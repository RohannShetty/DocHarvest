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

# Hostnames that may address this loopback server (DNS-rebinding defense).
_LOOPBACK_HOSTS = frozenset({"localhost", "127.0.0.1", "::1"})

# Bounds for best-effort body draining on early rejections: never read an
# untrusted or oversized body, and never wait indefinitely for a stalling
# client. See GuiRequestHandler._drain_request_body.
_MAX_DRAIN_BYTES = 64 * 1024
_DRAIN_TIMEOUT_S = 2.0

# Origins of the intentional Vite dev-proxy workflow: the frontend dev server
# (frontend/vite.config.ts proxies /api -> http://127.0.0.1:<port> with
# changeOrigin, so the Host header stays correct while Origin stays :5173).
# This is a narrow allowlist for a fixed local dev port, not a wildcard.
_DEV_PROXY_ORIGINS = frozenset(
    {
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://[::1]:5173",
    }
)

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


def _split_host(host_header: str) -> tuple[str, int | None]:
    """Split a Host header into (lowercased hostname without brackets, port).

    Returns ("", None) for empty or malformed values.
    """
    h = (host_header or "").strip().lower()
    if not h:
        return "", None
    if h.startswith("["):  # IPv6 literal, e.g. [::1]:8765
        end = h.find("]")
        if end == -1:
            return "", None
        name = h[1:end]
        rest = h[end + 1 :]
        if rest.startswith(":") and rest[1:].isdigit():
            return name, int(rest[1:])
        return name, None
    if ":" in h:
        name, _, port_s = h.rpartition(":")
        if name and port_s.isdigit():
            return name, int(port_s)
        return "", None
    return h, None


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
    """Open *url* in the user's browser, gracefully falling back to the system default."""
    target = (browser_name or "").strip().lower()

    # Explicit Zen request
    if target in ("zen", "zen-browser"):
        zen_path = find_zen_browser()
        if zen_path:
            try:
                subprocess.Popen([zen_path, url])
                return True
            except Exception as exc:
                print(f"Note: Could not launch Zen Browser ({exc}), falling back to system default.", file=sys.stderr)

    # Specific named browser requested (e.g. 'chrome', 'firefox', 'edge')
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
            if b.open(url):
                return True
        except Exception:
            pass

    # Universal fallback: system default browser
    try:
        return webbrowser.open(url)
    except Exception as exc:
        print(f"Note: Could not open system default browser ({exc}). Please open {url} manually.", file=sys.stderr)
        return False


class GuiRequestHandler(BaseHTTPRequestHandler):
    """HTTP request handler serving static GUI assets and bridging ApiBridge over JSON/SSE."""

    server: GuiServer

    def log_message(self, format: str, *args: Any) -> None:
        # Suppress routine request spam, keep console clean
        pass

    # ── Same-origin / Host protection ────────────────────────────────────
    # The server exposes bridge methods that can read and open local files.
    # Two attack routes must be closed without breaking the loopback app:
    #   1. Cross-origin browser pages (CSRF/SOP bypass attempts). Browsers
    #      always attach an Origin header to cross-origin fetch/EventSource,
    #      so an Origin that is not ours means a foreign page -> 403.
    #   2. DNS rebinding, where a foreign hostname resolves to 127.0.0.1 and
    #      the browser sends Host: evil.example:<port>. Only loopback
    #      hostnames (plus an explicit non-wildcard bind host) are accepted.
    # Requests without an Origin (curl, native tools, tests) keep working:
    # they are not cross-origin browser pages.

    def _allowed_origins(self) -> set[str]:
        """Exact origins allowed to call this server (no wildcards)."""
        port = self.server.server_address[1]
        origins = {
            f"http://localhost:{port}",
            f"http://127.0.0.1:{port}",
            f"http://[::1]:{port}",
        }
        origins |= _DEV_PROXY_ORIGINS
        return origins

    def _host_allowed(self) -> bool:
        """Validate the Host header against the bound address (anti-rebinding)."""
        port = self.server.server_address[1]
        name, host_port = _split_host(self.headers.get("Host", ""))
        if not name:
            return False
        if host_port is None:
            # Browsers always include a non-default port; bare hostnames are
            # only valid for default ports.
            if port not in (80, 443):
                return False
        elif host_port != port:
            return False
        allowed_names = set(_LOOPBACK_HOSTS)
        bind_host = (self.server.server_address[0] or "").strip().lower()
        if bind_host and bind_host not in ("0.0.0.0", "::"):
            allowed_names.add(bind_host)
        return name in allowed_names

    def _origin_allowed(self) -> bool:
        """True for same-origin, dev-proxy, or non-browser (no Origin) requests."""
        origin = (self.headers.get("Origin") or "").strip().lower()
        if not origin:
            # Non-browser client (curl, native tools, urllib).
            return True
        if origin == "null":
            # Opaque origin (sandboxed iframe, file:// page) — treat as foreign.
            return False
        return origin in self._allowed_origins()

    def _drain_request_body(self) -> None:
        """Best-effort bounded drain of an unread request body.

        Early rejections respond before reading the body; closing a socket
        that still has unread bytes in the receive buffer makes Windows reset
        the connection (WSAECONNRESET / WinError 10053) and the client can
        lose the response. Drain a small bounded amount so the close is
        clean. Oversized or absent bodies are left alone — the drain never
        reads more than _MAX_DRAIN_BYTES and never waits longer than
        _DRAIN_TIMEOUT_S.
        """
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except (TypeError, ValueError):
            return
        if length <= 0 or length > _MAX_DRAIN_BYTES:
            return
        old_timeout = self.connection.gettimeout()
        try:
            self.connection.settimeout(_DRAIN_TIMEOUT_S)
            self.rfile.read(length)
        except (OSError, ValueError):
            pass
        finally:
            try:
                self.connection.settimeout(old_timeout)
            except OSError:
                pass

    def _request_allowed(self) -> bool:
        """Shared gate for every request method; sends 403 when blocked."""
        if not self._host_allowed():
            self._drain_request_body()
            self.send_error(403, "Invalid Host header")
            return False
        if not self._origin_allowed():
            self._drain_request_body()
            self.send_error(403, "Cross-origin requests are not allowed")
            return False
        return True

    def _send_cors(self) -> None:
        """Echo the exact allowed origin (never a wildcard); nothing otherwise."""
        origin = (self.headers.get("Origin") or "").strip()
        if origin and origin.lower() in self._allowed_origins():
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self) -> None:
        if not self._request_allowed():
            return
        self.send_response(204)
        self._send_cors()
        self.end_headers()

    def do_HEAD(self) -> None:
        self.do_GET()

    def do_GET(self) -> None:
        if not self._request_allowed():
            return
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
        if not self._request_allowed():
            return
        clean_path = urllib.parse.urlparse(self.path).path
        if not clean_path.startswith("/api/"):
            self._drain_request_body()
            self.send_error(404, "Unknown API route")
            return

        method_name = clean_path[5:].strip("/")
        bridge = self.server.bridge

        if not hasattr(bridge, method_name) or method_name.startswith("_"):
            self._drain_request_body()
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
