"""Tests for the browser GUI server, PyWebView shim, and SSE bridge."""

from __future__ import annotations

import json
import threading
import time
import urllib.request
from pathlib import Path

import pytest

from gitbook_downloader.gui.app import get_web_dir
from gitbook_downloader.gui.bridge import ApiBridge
from gitbook_downloader.gui.server import (
    GuiServer,
    find_zen_browser,
    open_browser,
)


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
    from gitbook_downloader.cli import build_parser

    parser = build_parser()
    args = parser.parse_args(["gui", "--browser", "zen", "--port", "9000"])
    assert args.command == "gui"
    assert args.browser == "zen"
    assert args.port == 9000

    args_default = parser.parse_args(["gui", "-b"])
    assert args_default.browser == "default"
