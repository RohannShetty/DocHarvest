"""TDD tests for ApiBridge event streaming, payload contract, and system path safety."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from docharvest.gui.bridge import ApiBridge
from docharvest.output_contract import CapturedPage


def test_bridge_start_capture_payload_contract():
    """Verify that ApiBridge.start_capture emits progress events matching the frontend contract."""
    bridge = ApiBridge()
    emitted_events = []

    mock_window = MagicMock()

    def capture_eval_js(js_code: str):
        # Extract json payload from: if (window.func) { window.func(payload); }
        if "onCaptureProgress" in js_code:
            start_idx = js_code.find("window.onCaptureProgress(") + len("window.onCaptureProgress(")
            end_idx = js_code.rfind("); }")
            if start_idx != -1 and end_idx != -1:
                data = json.loads(js_code[start_idx:end_idx])
                emitted_events.append(data)

    mock_window.evaluate_js.side_effect = capture_eval_js
    bridge.set_window(mock_window)

    # Trigger internal _emit_to_js directly to test event payload structure
    bridge._emit_to_js(
        "onCaptureProgress",
        {
            "kind": "downloaded",
            "url": "https://example.com/page1",
            "title": "Page 1",
            "size_kb": 12.5,
            "message": "Downloaded Page 1",
            "count": 1,
            "done": 1,
            "downloaded": 1,
            "failed": 0,
            "discovered": 5,
            "total": 5,
            "percent": 20,
            "elapsed": 1.2,
        },
    )
    # Phase 4 step 3: emits are queued and drained asynchronously. Wait
    # up to 1s for the drain thread to call evaluate_js.
    import time
    deadline = time.time() + 1.0
    while time.time() < deadline and len(emitted_events) == 0:
        time.sleep(0.05)
    assert len(emitted_events) == 1
    bridge.cleanup()  # stop drain thread
    event = emitted_events[0]
    assert event["kind"] == "downloaded"
    assert event["percent"] == 20
    assert event["downloaded"] == 1
    assert event["total"] == 5
    assert event["done"] == 1
    assert event["discovered"] == 5
    assert "elapsed" in event


def test_bridge_defaults_to_library_output_mode(monkeypatch):
    """Verify that GUI capture defaults to output_mode='library' to avoid writing into system directories."""
    captured_options = {}

    def fake_capture(url, options, progress=None):
        captured_options["output_mode"] = options.output_mode
        captured_options["path_scope"] = options.path_scope
        mock_result = MagicMock()
        mock_result.provider = "gitbook"
        mock_result.pages_captured = 1
        mock_result.skipped = 0
        mock_result.warnings = ()
        mock_result.local_path = None
        mock_result.library_path = Path("/mock/library")
        mock_result.book_file = Path("/mock/library/docs.md")
        mock_result.manifest_file = Path("/mock/library/llms.txt")
        mock_result.version_id = "v1"
        return mock_result

    monkeypatch.setattr("docharvest.gui.bridge.capture", fake_capture)

    bridge = ApiBridge()
    res = bridge.start_capture("https://docs.example.com", {})
    assert res["success"] is True

    # Wait briefly for worker thread
    if bridge._active_thread:
        bridge._active_thread.join(timeout=2.0)

    assert captured_options.get("output_mode") == "library"


def test_bridge_handles_none_options(monkeypatch):
    """Verify that start_capture does not crash when frontend sends None for optional string options."""
    captured_options = {}

    def fake_capture(url, options, progress=None):
        captured_options["path_scope"] = options.path_scope
        captured_options["exclude_paths"] = options.exclude_paths
        captured_options["max_pages"] = options.max_pages
        captured_options["site_versions"] = options.site_versions
        captured_options["output_mode"] = options.output_mode
        mock_result = MagicMock()
        mock_result.provider = "generic"
        mock_result.pages_captured = 1
        mock_result.skipped = 0
        mock_result.warnings = ()
        mock_result.local_path = None
        mock_result.library_path = Path("/mock/library")
        mock_result.book_file = Path("/mock/library/docs.md")
        mock_result.manifest_file = Path("/mock/library/llms.txt")
        mock_result.version_id = "v1"
        return mock_result

    monkeypatch.setattr("docharvest.gui.bridge.capture", fake_capture)

    bridge = ApiBridge()
    # Options with explicit None from JS
    res = bridge.start_capture(
        "https://opencode.ai/docs/",
        {
            "path_scope": None,
            "exclude_paths": None,
            "max_pages": None,
            "site_versions": None,
            "output_mode": None,
            "workers": 5,
        },
    )
    assert res["success"] is True

    if bridge._active_thread:
        bridge._active_thread.join(timeout=2.0)

    assert captured_options.get("path_scope") == ()
    assert captured_options.get("exclude_paths") == ()
    assert captured_options.get("max_pages") is None
    assert captured_options.get("output_mode") == "library"


from docharvest.storage import StorageManager


def _bridge_with_tmp_library(tmp_path):
    storage = StorageManager(base_dir=tmp_path)
    return storage, ApiBridge(storage_manager=storage)


def test_read_file_outside_library_rejected(tmp_path):
    bridge = _bridge_with_tmp_library(tmp_path)[1]
    res = bridge.read_file(str(tmp_path.parent / "secret.txt"))
    assert res.get("success") is False
    assert "content" not in res


def test_read_file_inside_library_allowed(tmp_path):
    storage, bridge = _bridge_with_tmp_library(tmp_path)
    page = tmp_path / "docs" / "example.com" / "pages" / "index.md"
    page.parent.mkdir(parents=True, exist_ok=True)
    page.write_text("# hello", encoding="utf-8")
    res = bridge.read_file(str(page))
    assert res.get("success") is True
    assert res.get("content") == "# hello"


def test_open_folder_outside_library_rejected(tmp_path):
    bridge = _bridge_with_tmp_library(tmp_path)[1]
    res = bridge.open_folder(str(tmp_path.parent))
    assert res.get("success") is False


def test_open_file_outside_library_rejected(tmp_path):
    bridge = _bridge_with_tmp_library(tmp_path)[1]
    res = bridge.open_file(str(tmp_path.parent / "x.txt"))
    assert res.get("success") is False


def test_open_folder_domain_name_opens_confined_path(tmp_path, monkeypatch):
    storage, bridge = _bridge_with_tmp_library(tmp_path)
    # create a domain dir
    ddir = storage._domain_dir("example.com") if hasattr(storage, "_domain_dir") else None
    if ddir is None:
        pytest.skip("no _domain_dir")
    ddir.mkdir(parents=True, exist_ok=True)
    storage._domains = getattr(storage, "_domains", {})
    try:
        storage._domains["example.com"] = ddir
    except Exception:
        pass

    import subprocess as _sp
    import os as _os

    calls = {"popen": [], "startfile": []}

    def fake_popen(args, *a, **k):
        calls["popen"].append(args)
        return MagicMock()

    def fake_startfile(p):
        calls["startfile"].append(p)

    monkeypatch.setattr("docharvest.gui.bridge.subprocess.Popen", fake_popen)
    monkeypatch.setattr("docharvest.gui.bridge.os.startfile", fake_startfile, raising=False)

    # Ensure domain_exists returns True
    monkeypatch.setattr(storage, "domain_exists", lambda d: d == "example.com")
    monkeypatch.setattr(storage, "_domain_dir", lambda d: ddir)

    res = bridge.open_folder("example.com")
    assert res.get("success") is True
    assert any(str(ddir) in str(x) for x in calls["startfile"]) or any(
        any(str(ddir) in str(a) for a in args) for args in calls["popen"]
    )

