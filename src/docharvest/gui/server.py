"""Standalone browser server for DocHarvest GUI with PyWebView shim and SSE bridge."""

from __future__ import annotations

import json
import mimetypes
import os
import queue
import shutil
import socketserver
import subprocess
import sys
import threading
import time
import urllib.parse
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Callable

from .. import __version__
from .app import get_web_dir
from .bridge import ApiBridge

MIME_TYPES = {
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".css": "text/css",
    ".html": "text/html; charset=utf-8",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
}

_SHIM_SCRIPT = """<script>
(function() {
  if (!window.pywebview) {
    window.pywebview = {
      api: new Proxy({}, {
        get: function(target, prop) {
          return async function(...args) {
            var resp = await fetch('/api/' + String(prop), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(args)
            });
            if (!resp.ok) {
              throw new Error('API request failed with status ' + resp.status);
            }
            return await resp.json();
          };
        }
      })
    };
    try {
      var evt = new EventSource('/api/events');
      evt.onmessage = function(e) {
        try {
          var payload = JSON.parse(e.data);
          if (payload && payload.func && typeof window[payload.func] === 'function') {
            window[payload.func](payload.data);
          }
        } catch (err) {
          console.warn('Failed to dispatch event', err);
        }
      };
    } catch (err) {
      console.warn('SSE connection failed', err);
    }
  }
})();
</script>
"""


def find_zen_browser() -> str | None:
    """Locate the Zen Browser executable on Windows, macOS, or Linux."""
    candidates = []
    if sys.platform == "win32":
        local_app_data = os.environ.get("LOCALAPPDATA", "")
        app_data = os.environ.get("APPDATA", "")
        program_files = os.environ.get("ProgramFiles", r"C:\Program Files")
        program_files_x86 = os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)")

        candidates.extend([
            os.path.join(program_files, "Zen Browser", "zen.exe"),
            os.path.join(program_files_x86, "Zen Browser", "zen.exe"),
            os.path.join(local_app_data, "Zen Browser", "zen.exe"),
            os.path.join(local_app_data, "Programs", "Zen Browser", "zen.exe"),
            os.path.join(app_data, "Zen Browser", "zen.exe"),
            shutil.which("zen"),
            shutil.which("zen.exe"),
        ])
    elif sys.platform == "darwin":
        candidates.extend([
            "/Applications/Zen Browser.app/Contents/MacOS/zen",
            os.path.expanduser("~/Applications/Zen Browser.app/Contents/MacOS/zen"),
            shutil.which("zen"),
        ])
    else:
        candidates.extend([
            shutil.which("zen-browser"),
            shutil.which("zen"),
            "/usr/bin/zen-browser",
            "/usr/local/bin/zen-browser",
            os.path.expanduser("~/.local/bin/zen-browser"),
        ])

    for cand in candidates:
        if cand and os.path.isfile(cand):
            return cand
    return None


def open_browser(url: str, browser_name: str | None = None) -> bool:
    """Open *url* in the specified browser (defaults to Zen Browser if available)."""
    target = (browser_name or "").strip().lower()

    if target in ("zen", "zen-browser", ""):
        zen_path = find_zen_browser()
        if zen_path:
            try:
                subprocess.Popen([zen_path, url])
                return True
            except Exception as exc:
                print(f"Warning: Failed to launch Zen Browser ({exc}), trying default browser…", file=sys.stderr)

    if target and target not in ("default", "zen", "zen-browser"):
        custom_path = shutil.which(target) or (target if os.path.isfile(target) else None)
        if custom_path:
            try:
                subprocess.Popen([custom_path, url])
                return True
            except Exception:
                pass
        try:
            b = webbrowser.get(target)
            return b.open(url)
        except Exception:
            pass

    return webbrowser.open(url)


class GuiRequestHandler(BaseHTTPRequestHandler):
    """HTTP request handler serving static GUI assets and bridging ApiBridge over JSON/SSE."""

    server: GuiServer

    def log_message(self, format: str, *args: Any) -> None:
        # Suppress routine request spam, keep console clean
        pass

    def _send_cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._send_cors()
        self.end_headers()

    def do_HEAD(self) -> None:
        self.do_GET()

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        clean_path = parsed.path

        if clean_path == "/api/events":
            self._handle_sse()
            return

        self._serve_static(clean_path)

    def _handle_sse(self) -> None:
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-cache, no-transform")
        self.send_header("Connection", "keep-alive")
        self.send_header("X-Accel-Buffering", "no")
        self._send_cors()
        self.end_headers()

        client_q: queue.Queue[dict[str, Any]] = queue.Queue()
        self.server.add_sse_client(client_q)

        try:
            self.wfile.write(b": connected\n\n")
            self.wfile.flush()
            while not self.server.shutting_down:
                try:
                    payload = client_q.get(timeout=15.0)
                    msg = f"data: {json.dumps(payload, ensure_ascii=False)}\n\n".encode("utf-8")
                    self.wfile.write(msg)
                    self.wfile.flush()
                except queue.Empty:
                    # Keep-alive comment
                    self.wfile.write(b": ping\n\n")
                    self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass
        finally:
            self.server.remove_sse_client(client_q)

    def _serve_static(self, req_path: str) -> None:
        web_dir = self.server.web_dir
        clean = req_path.lstrip("/")

        # Root or index request
        if clean in ("", "index.html"):
            index_path = web_dir / "index.html"
            if not index_path.exists():
                self.send_error(404, "index.html not found")
                return
            try:
                html_text = index_path.read_text(encoding="utf-8", errors="replace")
                if "</head>" in html_text:
                    html_text = html_text.replace("</head>", f"{_SHIM_SCRIPT}\n</head>", 1)
                else:
                    html_text = f"{_SHIM_SCRIPT}\n{html_text}"
                data = html_text.encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(data)))
                self._send_cors()
                self.end_headers()
                self.wfile.write(data)
                return
            except Exception as exc:
                self.send_error(500, str(exc))
                return

        # Resolve asset
        target = (web_dir / clean).resolve()
        try:
            target.relative_to(web_dir.resolve())
        except ValueError:
            self.send_error(403, "Access denied")
            return

        if target.exists() and target.is_file():
            suffix = target.suffix.lower()
            content_type = MIME_TYPES.get(suffix) or mimetypes.guess_type(str(target))[0] or "application/octet-stream"
            try:
                raw_bytes = target.read_bytes()
                self.send_response(200)
                self.send_header("Content-Type", content_type)
                self.send_header("Content-Length", str(len(raw_bytes)))
                self._send_cors()
                self.end_headers()
                self.wfile.write(raw_bytes)
                return
            except Exception as exc:
                self.send_error(500, str(exc))
                return

        # SPA fallback for unrecognized routes
        index_path = web_dir / "index.html"
        if index_path.exists():
            html_text = index_path.read_text(encoding="utf-8", errors="replace")
            if "</head>" in html_text:
                html_text = html_text.replace("</head>", f"{_SHIM_SCRIPT}\n</head>", 1)
            else:
                html_text = f"{_SHIM_SCRIPT}\n{html_text}"
            data = html_text.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self._send_cors()
            self.end_headers()
            self.wfile.write(data)
            return

        self.send_error(404, "Not found")

    def do_POST(self) -> None:
        clean_path = urllib.parse.urlparse(self.path).path
        if not clean_path.startswith("/api/"):
            self.send_error(404, "Unknown API route")
            return

        method_name = clean_path[5:].strip("/")
        bridge = self.server.bridge

        if not hasattr(bridge, method_name) or method_name.startswith("_"):
            self._send_json(404, {"success": False, "error": f"API method '{method_name}' not found"})
            return

        try:
            content_len = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_len) if content_len > 0 else b"[]"
            args = json.loads(body_bytes.decode("utf-8")) if body_bytes else []
            if not isinstance(args, list):
                args = [args]
        except Exception as exc:
            self._send_json(400, {"success": False, "error": f"Invalid JSON payload: {exc}"})
            return

        fn = getattr(bridge, method_name)
        try:
            res = fn(*args)
            self._send_json(200, res)
        except Exception as exc:
            self._send_json(500, {"success": False, "error": str(exc)})

    def _send_json(self, status: int, data: Any) -> None:
        try:
            raw = json.dumps(data, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(raw)))
            self._send_cors()
            self.end_headers()
            self.wfile.write(raw)
        except Exception:
            pass


class GuiServer(ThreadingHTTPServer):
    """Threading HTTP server with SSE client registry and ApiBridge integration."""

    def __init__(
        self,
        server_address: tuple[str, int],
        web_dir: Path,
        bridge: ApiBridge,
    ) -> None:
        super().__init__(server_address, GuiRequestHandler)
        self.web_dir = web_dir
        self.bridge = bridge
        self.shutting_down = False
        self._clients_lock = threading.Lock()
        self._sse_clients: list[queue.Queue[dict[str, Any]]] = []

        # Connect bridge events to SSE broadcaster
        self.bridge.add_event_listener(self.broadcast_event)

    def add_sse_client(self, q: queue.Queue[dict[str, Any]]) -> None:
        with self._clients_lock:
            self._sse_clients.append(q)

    def remove_sse_client(self, q: queue.Queue[dict[str, Any]]) -> None:
        with self._clients_lock:
            if q in self._sse_clients:
                self._sse_clients.remove(q)

    def broadcast_event(self, func_name: str, data: Any) -> None:
        payload = {"func": func_name, "data": data}
        with self._clients_lock:
            for q in list(self._sse_clients):
                try:
                    q.put_nowait(payload)
                except Exception:
                    pass

    def stop(self) -> None:
        self.shutting_down = True
        self.bridge.remove_event_listener(self.broadcast_event)
        self.bridge.cleanup()
        self.shutdown()
        self.server_close()


def launch_browser_gui(
    browser: str | None = "zen",
    port: int = 0,
    host: str = "127.0.0.1",
    open_browser_window: bool = True,
) -> int:
    """Serve the DocHarvest GUI and launch the browser."""
    web_dir = get_web_dir()
    index_file = web_dir / "index.html"
    if not index_file.exists():
        print(
            f"Error: GUI web assets not found at {index_file}. Please run 'npm run build' in frontend/.",
            file=sys.stderr,
        )
        return 1

    bridge = ApiBridge()
    server = GuiServer((host, port), web_dir, bridge)
    actual_port = server.server_address[1]
    url = f"http://{host}:{actual_port}"

    browser_display = browser or "default browser"
    if browser in ("zen", "zen-browser"):
        zen_exe = find_zen_browser()
        if zen_exe:
            browser_display = f"Zen Browser ({zen_exe})"
        else:
            browser_display = "Zen Browser (falling back to default browser)"

    print("=" * 60)
    print(f"  DocHarvest v{__version__} GUI Server")
    print(f"  URL:     {url}")
    print(f"  Target:  {browser_display}")
    print("=" * 60)
    print("Serving GUI. Press Ctrl+C to stop.\n")

    if open_browser_window:
        open_browser(url, browser_name=browser)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down GUI server…")
    finally:
        server.stop()

    return 0
