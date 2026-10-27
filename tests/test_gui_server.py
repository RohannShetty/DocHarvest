"""Tests for the browser GUI server, PyWebView shim, and SSE bridge."""

from __future__ import annotations

import http.client
import json
import threading
import time
import urllib.request
from pathlib import Path

import pytest

from docharvest.gui.app import get_web_dir
from docharvest.gui.bridge import ApiBridge
from docharvest.gui.server import (
    GuiServer,
    find_zen_browser,
    open_browser,
)


class _SpyBridge(ApiBridge):
    """Bridge that records whether a harmless API method actually executed."""

    def __init__(self) -> None:
        super().__init__()
        self.get_system_info_calls = 0

    def get_system_info(self):  # type: ignore[override]
        self.get_system_info_calls += 1
        return {"name": "DocHarvest", "version": "test"}


def _run_server():
    """Start a GuiServer with a spy bridge on an ephemeral port."""
    web_dir = get_web_dir()
    bridge = _SpyBridge()
    server = GuiServer(("127.0.0.1", 0), web_dir, bridge)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, bridge, port


def _post(port: int, path: str, headers: dict[str, str] | None = None):
    req = urllib.request.Request(
        f"http://127.0.0.1:{port}{path}",
        data=b"[]",
        headers={"Content-Type": "application/json", **(headers or {})},
        method="POST",
    )
    return urllib.request.urlopen(req, timeout=5.0)


def test_find_zen_browser_returns_string_or_none():
    zen_path = find_zen_browser()
    if zen_path is not None:
        assert isinstance(zen_path, str)
        assert Path(zen_path).exists()


def test_gui_server_serves_index_with_injected_shim():
    web_dir = get_web_dir()
    bridge = ApiBridge()
    server = GuiServer(("127.0.0.1", 0), web_dir, bridge)
    port = server.server_address[1]

    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    try:
        url = f"http://127.0.0.1:{port}/"
        with urllib.request.urlopen(url, timeout=5.0) as resp:
            assert resp.status == 200
            content_type = resp.headers.get("Content-Type", "")
            assert "text/html" in content_type
            body = resp.read().decode("utf-8")
            assert "window.pywebview" in body
            assert "Proxy" in body
            assert "/api/events" in body
    finally:
        server.stop()


def test_gui_server_dispatches_api_post():
    web_dir = get_web_dir()
    bridge = ApiBridge()
    server = GuiServer(("127.0.0.1", 0), web_dir, bridge)
    port = server.server_address[1]

    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    try:
        url = f"http://127.0.0.1:{port}/api/get_system_info"
        req = urllib.request.Request(
            url,
            data=b"[]",
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            assert resp.status == 200
            data = json.loads(resp.read().decode("utf-8"))
            assert data["name"] == "DocHarvest"
            assert "version" in data
    finally:
        server.stop()


def test_gui_server_sse_stream():
    web_dir = get_web_dir()
    bridge = ApiBridge()
    server = GuiServer(("127.0.0.1", 0), web_dir, bridge)
    port = server.server_address[1]

    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    try:
        url = f"http://127.0.0.1:{port}/api/events"
        req = urllib.request.Request(url, headers={"Accept": "text/event-stream"})
        resp = urllib.request.urlopen(req, timeout=5.0)
        assert resp.status == 200

        # Read initial connect comment
        line = resp.readline().decode("utf-8")
        assert ": connected" in line

        # Emit an event from bridge
        bridge._emit_to_js("onCaptureProgress", {"done": 3, "total": 10})

        # Read event data
        data_line = resp.readline().decode("utf-8")
        while data_line.strip() == "":
            data_line = resp.readline().decode("utf-8")

        assert data_line.startswith("data: ")
        payload = json.loads(data_line[6:].strip())
        assert payload["func"] == "onCaptureProgress"
        assert payload["data"]["done"] == 3
        assert payload["data"]["total"] == 10

        resp.close()
    finally:
        server.stop()


def test_cli_parser_gui_browser_option():
    from docharvest.cli import build_parser

    parser = build_parser()
    args = parser.parse_args(["gui", "--browser", "zen", "--port", "9000"])
    assert args.command == "gui"
    assert args.browser == "zen"
    assert args.port == 9000

    args_default = parser.parse_args(["gui", "-b"])
    assert args_default.browser == "default"


# ── Same-origin / Host protection regression tests ──────────────────────────
# The standalone GUI server binds to 127.0.0.1 and exposes bridge methods that
# can read/open local files. Foreign web pages must not be able to invoke
# them (CSRF/cross-origin), and DNS-rebinding clients must be rejected via
# Host validation. The same-origin browser app and the intentional Vite dev
# proxy workflow (origin http://localhost:5173 proxied to the server) must
# keep working, as must no-origin native clients (curl, tests, urllib).


def test_gui_server_rejects_cross_origin_post_and_spies_not_called():
    """A foreign page's Origin must 403 before the bridge method runs."""
    import urllib.error

    server, bridge, port = _run_server()
    try:
        with pytest.raises(urllib.error.HTTPError) as excinfo:
            _post(port, "/api/get_system_info", {"Origin": "https://evil.example"})
        assert excinfo.value.code == 403
        assert bridge.get_system_info_calls == 0
    finally:
        server.stop()


def test_gui_server_rejects_cross_origin_preflight():
    """OPTIONS preflights from foreign origins must not be granted."""
    import urllib.error

    server, bridge, port = _run_server()
    try:
        req = urllib.request.Request(
            f"http://127.0.0.1:{port}/api/get_system_info",
            headers={
                "Origin": "https://evil.example",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type",
            },
            method="OPTIONS",
        )
        with pytest.raises(urllib.error.HTTPError) as excinfo:
            urllib.request.urlopen(req, timeout=5.0)
        assert excinfo.value.code == 403
        assert excinfo.value.headers.get("Access-Control-Allow-Origin") is None
    finally:
        server.stop()


def test_gui_server_rejects_cross_origin_sse():
    """EventSource from a foreign origin must be denied before streaming."""
    import urllib.error

    server, bridge, port = _run_server()
    try:
        req = urllib.request.Request(
            f"http://127.0.0.1:{port}/api/events",
            headers={"Accept": "text/event-stream", "Origin": "https://evil.example"},
        )
        with pytest.raises(urllib.error.HTTPError) as excinfo:
            urllib.request.urlopen(req, timeout=5.0)
        assert excinfo.value.code == 403
    finally:
        server.stop()


def test_gui_server_rejects_null_origin():
    """Opaque origins (sandboxed iframes / file:// pages) must be rejected."""
    import urllib.error

    server, bridge, port = _run_server()
    try:
        with pytest.raises(urllib.error.HTTPError) as excinfo:
            _post(port, "/api/get_system_info", {"Origin": "null"})
        assert excinfo.value.code == 403
        assert bridge.get_system_info_calls == 0
    finally:
        server.stop()


def test_gui_server_allows_same_origin_post():
    """The browser app posting to its own origin must succeed and echo Origin."""
    server, bridge, port = _run_server()
    try:
        with _post(port, "/api/get_system_info", {"Origin": f"http://127.0.0.1:{port}"}) as resp:
            assert resp.status == 200
            assert bridge.get_system_info_calls == 1
            acao = resp.headers.get("Access-Control-Allow-Origin")
            assert acao == f"http://127.0.0.1:{port}"
            assert acao != "*"
    finally:
        server.stop()


def test_gui_server_allows_vite_dev_proxy_origin():
    """The intentional Vite dev proxy (origin localhost:5173) must keep working."""
    server, bridge, port = _run_server()
    try:
        with _post(port, "/api/get_system_info", {"Origin": "http://localhost:5173"}) as resp:
            assert resp.status == 200
            assert bridge.get_system_info_calls == 1
    finally:
        server.stop()


def test_gui_server_no_origin_native_client_still_works():
    """No-Origin clients (curl, urllib, native tools) must keep working."""
    server, bridge, port = _run_server()
    try:
        with _post(port, "/api/get_system_info") as resp:
            assert resp.status == 200
            data = json.loads(resp.read().decode("utf-8"))
            assert data["name"] == "DocHarvest"
            assert bridge.get_system_info_calls == 1
    finally:
        server.stop()


def test_gui_server_rejects_dns_rebinding_host():
    """A forged Host header (DNS rebinding) must be rejected with 403."""
    server, bridge, port = _run_server()
    try:
        conn = http.client.HTTPConnection("127.0.0.1", port, timeout=5.0)
        conn.putrequest("POST", "/api/get_system_info", skip_host=True, skip_accept_encoding=True)
        conn.putheader("Host", f"evil.example:{port}")
        conn.putheader("Content-Type", "application/json")
        conn.putheader("Content-Length", "2")
        conn.endheaders(b"[]")
        resp = conn.getresponse()
        assert resp.status == 403
        resp.read()
        conn.close()
        assert bridge.get_system_info_calls == 0
    finally:
        server.stop()


def test_gui_server_rejects_cross_origin_static_assets():
    """Static assets must not be served to foreign origins either."""
    import urllib.error

    server, bridge, port = _run_server()
    try:
        req = urllib.request.Request(
            f"http://127.0.0.1:{port}/",
            headers={"Origin": "https://evil.example"},
        )
        with pytest.raises(urllib.error.HTTPError) as excinfo:
            urllib.request.urlopen(req, timeout=5.0)
        assert excinfo.value.code == 403
    finally:
        server.stop()


def test_gui_server_rejected_post_with_delayed_body_still_gets_403():
    """Regression: early rejection must not lose the 403 to a TCP reset.

    Windows resets a connection closed with unread request-body bytes
    (WinError 10053 on the client, seen 20/20 pre-fix with this repro and
    4/500 in a urllib storm). The server must drain a small body before
    closing so the rejection response survives.
    """
    import socket

    server, bridge, port = _run_server()
    try:
        sock = socket.create_connection(("127.0.0.1", port), timeout=5.0)
        try:
            headers = (
                "POST /api/get_system_info HTTP/1.1\r\n"
                f"Host: 127.0.0.1:{port}\r\n"
                "Origin: null\r\n"
                "Content-Type: application/json\r\n"
                "Content-Length: 2\r\n"
                "\r\n"
            )
            sock.sendall(headers.encode("ascii"))
            # Let the server hit the rejection path (and, pre-fix, close with
            # the body unread) before the body is sent.
            time.sleep(0.3)
            sock.sendall(b"[]")
            chunks = []
            while True:
                chunk = sock.recv(4096)
                if not chunk:
                    break
                chunks.append(chunk)
            raw = b"".join(chunks)
        finally:
            sock.close()
        status_line = raw.split(b"\r\n", 1)[0]
        assert b" 403 " in status_line, raw[:200]
        assert bridge.get_system_info_calls == 0
    finally:
        server.stop()


def test_gui_server_rejected_post_huge_body_is_not_drained():
    """Oversized bodies must never be read; the 403 must still be prompt."""
    import socket

    server, bridge, port = _run_server()
    try:
        sock = socket.create_connection(("127.0.0.1", port), timeout=5.0)
        try:
            headers = (
                "POST /api/get_system_info HTTP/1.1\r\n"
                f"Host: 127.0.0.1:{port}\r\n"
                "Origin: null\r\n"
                "Content-Type: application/json\r\n"
                "Content-Length: 100000000\r\n"
                "\r\n"
            )
            sock.sendall(headers.encode("ascii"))
            # The promised 100 MB body is never sent; the server must reject
            # promptly instead of waiting to drain it.
            status_line = sock.recv(4096).split(b"\r\n", 1)[0]
            assert b" 403 " in status_line, status_line
        finally:
            sock.close()
        assert bridge.get_system_info_calls == 0
    finally:
        server.stop()
