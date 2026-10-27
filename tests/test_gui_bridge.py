"""Tests for the Desktop GUI ApiBridge and assets."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

from docharvest.gui.app import get_web_dir
from docharvest.gui.bridge import ApiBridge


def test_get_web_dir_exists():
    web_dir = get_web_dir()
    assert web_dir.exists()
    assert (web_dir / "index.html").exists()
    assert (web_dir / "assets").exists() or (web_dir / "app.js").exists()


def test_bridge_detect_invalid_url():
    bridge = ApiBridge()
    res = bridge.detect("not-a-url")
    assert res["success"] is False
    assert "valid" in res["error"].lower()


def test_bridge_detect_mocked(monkeypatch):
    class FakeProvider:
        name = "gitbook"
        evidence = "mock evidence"

        def discover_urls(self, url):
            return ["https://docs.example.com/v1/a", "https://docs.example.com/v2/b"]

    monkeypatch.setattr(
        "docharvest.gui.bridge.detect_provider",
        lambda url, sess: FakeProvider(),
    )
    bridge = ApiBridge()
    res = bridge.detect("https://docs.example.com/")
    assert res["success"] is True
    assert res["provider"] == "gitbook"
    assert "v1" in res["site_versions"]
    assert "v2" in res["site_versions"]


def test_bridge_system_info():
    bridge = ApiBridge()
    info = bridge.get_system_info()
    assert info["version"] == "11.3.2"
    assert info["name"] == "DocHarvest"
    assert "DocHarvest Engine" in info["engine"]
    assert info["author"] == "Rohan Shetty"
    assert info["platform"] == sys.platform
    assert Path(info["library_dir"]).exists()
    render_status = bridge.is_render_available()
    assert "available" in render_status


def test_bridge_cancel_capture():
    bridge = ApiBridge()
    res = bridge.cancel_capture()
    assert res["success"] is True
    assert bridge._cancel_requested is True


def test_bridge_diagnostics_empty():
    bridge = ApiBridge()
    diag = bridge.get_diagnostics()
    assert diag == {}


def test_bridge_search_empty():
    bridge = ApiBridge()
    hits = bridge.search_docs("")
    assert hits == []


def test_bridge_list_library():
    bridge = ApiBridge()
    entries = bridge.list_library()
    assert isinstance(entries, list)


def test_bridge_rename_domain(tmp_path):
    from docharvest.storage import StorageManager
    sm = StorageManager(base_dir=tmp_path)
    sm.save_doc(domain="test.domain", content="# Content", url="u", title="T", pages=1, provider="generic", new_pages=1, size_kb=1.0)
    bridge = ApiBridge(storage_manager=sm)

    res = bridge.rename_domain("test.domain", "renamed.domain")
    assert res["success"] is True
    assert res["domain"] == "renamed.domain"
    assert sm.domain_exists("renamed.domain")
    assert not sm.domain_exists("test.domain")


def test_bridge_export_doc_not_found(tmp_path):
    bridge = ApiBridge()
    res = bridge.export_doc("non-existent-domain", "md", custom_path=str(tmp_path))
    assert res["success"] is False
    assert "not found" in res["error"].lower()


# ── Cancel/reset worker-lifecycle race regression tests ─────────────────────
# reset_capture() joins the worker for at most 1s; if the worker is still
# alive (e.g. blocked in a slow network call) it must NOT clear
# _active_thread — otherwise a subsequent start_capture() would falsely
# replace the live worker and run two captures concurrently.


def _ok_result():
    from unittest.mock import MagicMock

    r = MagicMock()
    r.provider = "generic"
    r.pages_captured = 1
    r.skipped = 0
    r.warnings = ()
    r.local_path = None
    r.library_path = None
    r.book_file = None
    r.manifest_file = None
    r.version_id = "v1"
    return r


def test_reset_capture_preserves_live_worker_reference(monkeypatch):
    """reset_capture must not drop the reference to a worker that is still running."""
    import threading

    started = threading.Event()
    release = threading.Event()

    def blocking_capture(url, options, progress=None):
        started.set()
        release.wait(timeout=10.0)
        return _ok_result()

    monkeypatch.setattr("docharvest.gui.bridge.capture", blocking_capture)
    bridge = ApiBridge()
    assert bridge.start_capture("https://docs.example.com", {})["success"] is True
    assert started.wait(2.0)
    worker = bridge._active_thread
    assert worker is not None and worker.is_alive()

    try:
        res = bridge.reset_capture()
        assert res["success"] is True
        assert res["worker_still_running"] is True
        # The still-running worker must keep its slot: no false replacement.
        assert bridge._active_thread is worker
        assert worker.is_alive()
    finally:
        release.set()
        worker.join(timeout=5.0)
    assert not worker.is_alive()


def test_start_capture_refuses_while_unstopped_worker_alive(monkeypatch):
    """A second capture must not start while a cancelled-but-alive worker runs."""
    import threading

    started = threading.Event()
    release = threading.Event()
    calls: list[str] = []

    def blocking_capture(url, options, progress=None):
        calls.append(url)
        started.set()
        release.wait(timeout=10.0)
        return _ok_result()

    monkeypatch.setattr("docharvest.gui.bridge.capture", blocking_capture)
    bridge = ApiBridge()
    assert bridge.start_capture("https://docs.example.com", {})["success"] is True
    assert started.wait(2.0)

    try:
        # Worker still blocked inside blocking_capture; join(1.0) times out.
        bridge.reset_capture()
        res = bridge.start_capture("https://other.example.com", {})
        assert res["success"] is False
        assert "already running" in res["error"]
        assert len(calls) == 1
    finally:
        release.set()
        if bridge._active_thread is not None:
            bridge._active_thread.join(timeout=5.0)


def test_reset_capture_keeps_locks_while_worker_alive(tmp_path, monkeypatch):
    """reset_capture must not force-clear locks while the worker still runs.

    Force-clearing the live worker's DomainLock would let another process
    (CLI capture, second GUI) acquire the domain and corrupt the capture.
    """
    import threading

    from docharvest.storage import StorageManager

    started = threading.Event()
    release = threading.Event()

    def blocking_capture(url, options, progress=None):
        started.set()
        release.wait(timeout=10.0)
        return _ok_result()

    monkeypatch.setattr("docharvest.gui.bridge.capture", blocking_capture)
    bridge = ApiBridge(storage_manager=StorageManager(base_dir=tmp_path))
    clear_calls: list[bool] = []
    original_clear = bridge._storage.clear_all_locks

    def spy_clear_all_locks(force: bool = False) -> int:
        clear_calls.append(force)
        return original_clear(force=force)

    monkeypatch.setattr(bridge._storage, "clear_all_locks", spy_clear_all_locks)

    assert bridge.start_capture("https://docs.example.com", {})["success"] is True
    assert started.wait(2.0)
    worker = bridge._active_thread
    assert worker is not None and worker.is_alive()

    try:
        res = bridge.reset_capture()
        assert res["success"] is True
        assert res["worker_still_running"] is True
        # No locks cleared, and storage never touched, while the worker lives.
        assert res["cleared_locks"] == 0
        assert clear_calls == []
        assert bridge._active_thread is worker
    finally:
        release.set()
        worker.join(timeout=5.0)
    assert not worker.is_alive()

    # Once the worker has stopped, a later reset may clear locks again.
    res2 = bridge.reset_capture()
    assert res2["success"] is True
    assert res2["worker_still_running"] is False
    assert clear_calls == [True]


def test_cancel_capture_never_clears_locks(tmp_path, monkeypatch):
    """cancel_capture requests cancellation only; it must not touch locks."""
    from docharvest.storage import StorageManager

    bridge = ApiBridge(storage_manager=StorageManager(base_dir=tmp_path))
    clear_calls: list[bool] = []
    monkeypatch.setattr(
        bridge._storage,
        "clear_all_locks",
        lambda force=False: clear_calls.append(force) or 0,
    )

    res = bridge.cancel_capture()
    assert res["success"] is True
    assert bridge._cancel_requested is True
    assert clear_calls == []
