"""Shell-lane tests — the capture facade (api.py).

All tests inject a FAKE engine via ``api._load_stream_download`` and a temp
library via ``api._default_storage`` — no network, ever.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from docharvest import api
from docharvest.api import (
    LATEST_ONLY,
    CaptureError,
    CaptureOptions,
    ProgressEvent,
    capture,
)
from docharvest.storage import StorageManager


# ── Fixtures & helpers ──────────────────────────────────────────────────


PAGES = [
    {"url": "https://docs.example.com/", "title": "Home",
     "content": "# Home\n\nWelcome.", "site_version": ""},
    {"url": "https://docs.example.com/api/auth", "title": "Auth",
     "content": "# Auth\n\nTokens.", "site_version": ""},
    {"url": "https://docs.example.com/v2/intro", "title": "V2 Intro",
     "content": "# V2 Intro\n\nNew stuff.", "site_version": "v2"},
]


class FakeEngine:
    """Stands in for engine.stream_download, recording its kwargs."""

    def __init__(self, pages=PAGES, provider="gitbook",
                 discovered=len(PAGES), failed=0, raw_override=None,
                 fail_calls=0, on_start=None):
        self.pages = pages
        self.provider = provider
        self.discovered = discovered
        self.failed = failed
        self.raw_override = raw_override
        self.fail_calls = fail_calls
        self.on_start = on_start
        self.calls: list[dict] = []

    def __call__(self, url, **kwargs):
        if self.on_start is not None:
            self.on_start()
        self.calls.append({"url": url, **kwargs})
        if self.fail_calls:
            self.fail_calls -= 1
            raise RuntimeError("engine exploded")
        if self.raw_override is not None:
            raw = self.raw_override
        else:
            raw = {
                "pages": self.pages,
                "provider": self.provider,
                "discovered": self.discovered,
                "failed": self.failed,
            }
        if kwargs.get("progress_callback"):
            cb = kwargs["progress_callback"]
            cb({"phase": "discovery", "status": "done",
                "discovered": self.discovered})
            for p in self.pages[: len(self.pages) - self.failed]:
                cb({"phase": "downloaded", "url": p["url"],
                    "title": p.get("title"), "size_kb": 1.2})
            for i in range(self.failed):
                cb({"phase": "error", "url": f"https://docs.example.com/x{i}",
                    "error": "boom"})
        return raw


@pytest.fixture
def library(tmp_path, monkeypatch):
    """Isolated library dir wired into the facade."""
    lib = tmp_path / "library"
    manager = StorageManager(base_dir=lib)
    monkeypatch.setattr(api, "_default_storage", lambda: manager)
    return manager


@pytest.fixture
def events():
    collected: list[ProgressEvent] = []
    return collected


def run_capture(tmp_path, options=None, engine=None, events=None, min_content_chars=0):
    """Wire a fake engine (or default) and run capture()."""
    engine = engine or FakeEngine()
    monkey_target = engine
    original_loader = api._load_stream_download
    original_min_content = api._configured_min_content_chars
    api._load_stream_download = lambda: monkey_target
    api._configured_min_content_chars = lambda: min_content_chars
    try:
        opts = options or CaptureOptions(local_dir=tmp_path / "out")
        return capture("https://docs.example.com/", opts,
                       progress=(events.append if events is not None else None))
    finally:
        api._load_stream_download = original_loader
        api._configured_min_content_chars = original_min_content


# ── Validation ──────────────────────────────────────────────────────────


class TestCaptureValidation:
    def test_max_pages_zero_is_invalid(self, tmp_path, library):
        with pytest.raises(CaptureError, match="max_pages"):
            capture("https://docs.example.com/",
                    CaptureOptions(max_pages=0, local_dir=tmp_path / "o"))

    def test_negative_max_pages_is_invalid(self, tmp_path, library):
        with pytest.raises(CaptureError, match="max_pages"):
            capture("https://docs.example.com/",
                    CaptureOptions(max_pages=-5, local_dir=tmp_path / "o"))

    def test_workers_below_one_rejected(self, tmp_path, library):
        with pytest.raises(CaptureError, match="workers"):
            capture("https://docs.example.com/",
                    CaptureOptions(workers=0, local_dir=tmp_path / "o"))

    def test_bad_output_mode_rejected(self, tmp_path, library):
        with pytest.raises(CaptureError, match="output_mode"):
            capture("https://docs.example.com/",
                    CaptureOptions(output_mode="everywhere",
                                   local_dir=tmp_path / "o"))

    @pytest.mark.parametrize("bad", ["", "not-a-url", "ftp://x.com/",
                                     "https://"])
    def test_bad_urls_rejected(self, tmp_path, library, bad):
        with pytest.raises(CaptureError):
            capture(bad, CaptureOptions(local_dir=tmp_path / "o"))


# ── Engine plumbing ─────────────────────────────────────────────────────


class TestEnginePlumbing:
    @pytest.mark.real_min_content_config
    def test_min_content_preference_reads_config(self, monkeypatch):
        from docharvest.utils import config

        monkeypatch.setattr(
            config,
            "load_full_config",
            lambda: config.AppConfig(values={"min_content_chars": 42}),
        )

        assert api._configured_min_content_chars() == 42

    def test_engine_receives_v7_signature(self, tmp_path, library):
        engine = FakeEngine()
        options = CaptureOptions(
            workers=3,
            max_pages=42,
            path_scope=("/api/",),
            exclude_paths=("/forum/",),
            timeout=7.5,
            local_dir=tmp_path / "out",
        )
        run_capture(tmp_path, options, engine=engine)

        assert len(engine.calls) == 1
        call = engine.calls[0]
        assert call["url"] == "https://docs.example.com/"
        assert call["path_scope"] == ["/api/"]
        assert call["exclude_paths"] == ["/forum/"]
        assert call["timeout"] == 7.5
        assert call["max_pages"] == 42
        assert call["workers"] == 3
        assert callable(call["progress_callback"])

    def test_result_fields_populated(self, tmp_path, library):
        result = run_capture(tmp_path)
        assert result.source_url == "https://docs.example.com/"
        assert result.provider == "gitbook"
        assert result.pages_captured == 3
        assert result.local_path == tmp_path / "out"
        assert result.library_path == library._domain_dir("docs.example.com")
        assert result.book_file is not None and result.book_file.exists()
        assert result.manifest_file is not None
        assert result.manifest_file.name == "llms.txt"

    def test_min_content_preference_filters_short_pages(self, tmp_path, library):
        result = run_capture(tmp_path, min_content_chars=20)

        assert result.pages_captured == 1
        assert result.skipped == 2
        assert any("minimum content" in warning.lower() for warning in result.warnings)

    def test_progress_events_emitted(self, tmp_path, library, events):
        run_capture(tmp_path, engine=FakeEngine(failed=1), events=events)
        kinds = [e.kind for e in events]
        assert kinds[0] == "discovered"
        assert "downloaded" in kinds
        assert "failed" in kinds
        assert kinds[-1] == "written"
        failed_event = next(e for e in events if e.kind == "failed")
        assert failed_event.message == "boom"

    def test_legacy_string_return_still_works(self, tmp_path, library):
        engine = FakeEngine(raw_override="# All\n\nOne big blob.")
        result = run_capture(tmp_path, engine=engine)
        assert result.pages_captured == 1
        assert result.provider == "generic"  # no provider info in a bare string

    def test_url_map_return_still_works(self, tmp_path, library):
        engine = FakeEngine(raw_override={
            "https://docs.example.com/a": "# A\n\nAlpha.",
            "https://docs.example.com/b": "# B\n\nBeta.",
        })
        result = run_capture(tmp_path, engine=engine)
        assert result.pages_captured == 2

    def test_engine_signature_mismatch_raises_capture_error(
            self, tmp_path, library):

        def grumpy_engine(url, **kwargs):
            raise TypeError("unexpected keyword argument 'path_scope'")

        with pytest.raises(CaptureError, match="v7 stream_download"):
            run_capture(tmp_path, engine=grumpy_engine)


# ── Output routing ──────────────────────────────────────────────────────


class TestOutputRouting:
    def test_both_writes_local_and_library(self, tmp_path, library):
        result = run_capture(tmp_path)
        local = tmp_path / "out"
        libdir = library._domain_dir("docs.example.com")

        assert (local / "book.md").exists()
        assert (local / "llms.txt").exists()
        assert (local / "pages").is_dir()
        assert (libdir / "docs.md").exists()
        assert (libdir / "llms.txt").exists()
        assert (libdir / "pages").is_dir()
        # Library metadata was refreshed.
        meta = library.get_metadata("docs.example.com")
        assert meta["total_pages"] == 3
        assert meta["provider"] == "gitbook"

    def test_library_only_skips_local(self, tmp_path, library):
        options = CaptureOptions(output_mode="library")
        result = run_capture(tmp_path, options=options)
        assert result.local_path is None
        assert result.library_path.exists()
        assert not (tmp_path / "out").exists()

    def test_local_only_skips_library(self, tmp_path, library):
        options = CaptureOptions(output_mode="local",
                                 local_dir=tmp_path / "out")
        result = run_capture(tmp_path, options=options)
        assert result.library_path is None
        assert result.local_path.exists()
        assert not library.domain_exists("docs.example.com")

    def test_local_mode_does_not_write_library(self, tmp_path, library):
        """`local` must leave no domain artifacts in the library (engine writes
        used to leak here because the engine constructed its own storage)."""
        options = CaptureOptions(output_mode="local",
                                 local_dir=tmp_path / "out")
        run_capture(tmp_path, options=options)
        docs = tmp_path / "library" / "docs"
        leftovers = list(docs.glob("*")) if docs.exists() else []
        assert leftovers == [], f"local mode wrote library artifacts: {leftovers}"


# ── Batch capture (capture_many) ────────────────────────────────────────


class TestCaptureMany:
    def test_two_urls_succeed_in_order(self, tmp_path, library, monkeypatch):
        engine = FakeEngine()
        monkeypatch.setattr(api, "_load_stream_download", lambda: engine)
        monkeypatch.setattr(api, "_configured_min_content_chars", lambda: 0)

        batch = api.capture_many(
            ["https://a.example.com/", "https://b.example.com/"],
            CaptureOptions(local_dir=tmp_path / "out"),
        )

        assert batch.succeeded == 2 and batch.failed == 0
        assert not batch.cancelled
        assert [i.url for i in batch.items] == [
            "https://a.example.com/",
            "https://b.example.com/",
        ]
        assert all(i.ok and i.result is not None for i in batch.items)

    def test_failure_recorded_batch_continues(self, tmp_path, library, monkeypatch):
        engine = FakeEngine()
        monkeypatch.setattr(api, "_load_stream_download", lambda: engine)
        monkeypatch.setattr(api, "_configured_min_content_chars", lambda: 0)

        batch = api.capture_many(
            # The middle URL is invalid, so capture() raises CaptureError.
            ["https://a.example.com/", "not-a-url", "https://c.example.com/"],
            CaptureOptions(local_dir=tmp_path / "out"),
        )

        assert batch.succeeded == 2 and batch.failed == 1
        assert [i.ok for i in batch.items] == [True, False, True]
        assert batch.items[1].error

    def test_cancel_after_first_stops_batch(self, tmp_path, library, monkeypatch):
        class FirstThenDone(FakeEngine):
            def __init__(self):
                super().__init__()
                self.count = 0

            def __call__(self, url, **kwargs):
                result = super().__call__(url, **kwargs)
                self.count += 1
                return result

        engine = FirstThenDone()
        monkeypatch.setattr(api, "_load_stream_download", lambda: engine)
        monkeypatch.setattr(api, "_configured_min_content_chars", lambda: 0)

        batch = api.capture_many(
            ["https://a.example.com/", "https://b.example.com/"],
            CaptureOptions(
                local_dir=tmp_path / "out",
                cancel_check=lambda: engine.count > 0,
            ),
        )

        assert batch.cancelled is True
        assert len(batch.items) == 1
        assert batch.items[0].url == "https://a.example.com/"


# ── Site versions ───────────────────────────────────────────────────────


class TestSiteVersions:
    def test_versions_detected_in_result(self, tmp_path, library):
        result = run_capture(tmp_path)
        assert result.site_versions_found == ("v2",)

    def test_subset_filter_keeps_matching_pages(self, tmp_path, library):
        options = CaptureOptions(site_versions=("v2",),
                                 local_dir=tmp_path / "out")
        result = run_capture(tmp_path, options=options)
        assert result.pages_captured == 1
        assert result.skipped >= 2

    def test_latest_only_picks_newest(self, tmp_path, library):
        options = CaptureOptions(site_versions=(LATEST_ONLY,),
                                 local_dir=tmp_path / "out")
        result = run_capture(tmp_path, options=options)
        assert result.pages_captured == 1

    def test_impossible_filter_yields_empty_result_and_warning(
            self, tmp_path, library):
        options = CaptureOptions(site_versions=("v9",),
                                 local_dir=tmp_path / "out")
        result = run_capture(tmp_path, options=options)
        assert result.pages_captured == 0
        assert any("v9" in w for w in result.warnings)
        assert result.book_file is None

    def test_versionless_site_with_filter_warns_not_crashes(
            self, tmp_path, library):
        versionless = [p for p in PAGES if not p["site_version"]]
        options = CaptureOptions(site_versions=("v1",),
                                 local_dir=tmp_path / "out")
        result = run_capture(
            tmp_path, options=options, engine=FakeEngine(pages=versionless)
        )
        assert result.pages_captured == 0
        assert any("exposes none" in w for w in result.warnings)


# ── Snapshot & locking ──────────────────────────────────────────────────


class TestSnapshotAndLocking:
    def test_snapshot_taken_before_download(self, tmp_path, library):
        domain = "docs.example.com"
        library.save_doc(domain=domain, content="Old content", url="u",
                         title="T", pages=1, provider="gitbook",
                         new_pages=1, size_kb=0.1)

        vpath = library.versions_dir(domain) / "v1.0.1.md"

        def assert_snapshot_already_exists():
            """Runs when the engine starts — the snapshot must predate it."""
            assert vpath.exists(), "snapshot must be taken BEFORE download"
            assert vpath.read_text(encoding="utf-8") == "Old content"

        engine = FakeEngine(on_start=assert_snapshot_already_exists)
        result = run_capture(tmp_path, engine=engine)

        assert result.version_id == "v1.0.1"

    def test_no_snapshot_flag_skips_snapshot(self, tmp_path, library):
        domain = "docs.example.com"
        library.save_doc(domain=domain, content="Old", url="u", title="T",
                         pages=1, provider="g", new_pages=1, size_kb=0.1)
        options = CaptureOptions(snapshot=False, local_dir=tmp_path / "out")
        result = run_capture(tmp_path, options=options)
        assert result.version_id is None
        assert not library.versions_dir(domain).exists()

    def test_first_capture_has_no_version_id(self, tmp_path, library):
        result = run_capture(tmp_path)
        assert result.version_id is None

    def test_lock_blocks_second_concurrent_capture(self, tmp_path, library):
        lock = library.domain_lock("docs.example.com")
        lock.acquire()
        try:
            with pytest.raises(CaptureError, match="lock"):
                run_capture(tmp_path)
        finally:
            lock.release()

    def test_lock_released_after_success(self, tmp_path, library):
        run_capture(tmp_path)
        # A second capture must not hit LockHeldError.
        result = run_capture(tmp_path)
        assert result.pages_captured == 3
        assert not (library.locks_dir() / "docs.example.com.lock").exists()


# ── Warnings ────────────────────────────────────────────────────────────


class TestWarnings:
    def test_zero_pages_produces_warning(self, tmp_path, library):
        engine = FakeEngine(pages=[], discovered=0)
        result = run_capture(tmp_path, engine=engine)
        assert result.pages_captured == 0
        assert any("No content" in w for w in result.warnings)

    def test_empty_content_pages_are_dropped(self, tmp_path, library):
        engine = FakeEngine(pages=[
            {"url": "https://docs.example.com/empty", "title": "",
             "content": "   ", "site_version": ""},
        ])
        result = run_capture(tmp_path, engine=engine)
        assert result.pages_captured == 0


# ── Multi-page string normalization ─────────────────────────────────────


class TestMultiPageStringNormalization:
    def test_parses_multiple_pages_from_combined_string(self, tmp_path, library):
        raw_text = (
            "Source: https://docs.example.com/p1\n\n# Page 1\n\nContent 1\n\n---\n\n"
            "Source: https://docs.example.com/p2\n\n# Page 2\n\nContent 2"
        )
        engine = FakeEngine(raw_override=raw_text)
        result = run_capture(tmp_path, engine=engine)
        assert result.pages_captured == 2
        assert (tmp_path / "out" / "pages" / "p1.md").exists()
        assert (tmp_path / "out" / "pages" / "p2.md").exists()
        assert (tmp_path / "out" / "book.md").exists()
        assert (tmp_path / "out" / "llms.txt").exists()



# ── Capture cancellation (GUI Cancel button path) ──────────────────────


class TestCancelCheck:
    def test_cancel_before_crawl_raises_and_does_not_invoke_engine(
        self, tmp_path, library
    ):
        engine = FakeEngine()
        options = CaptureOptions(
            local_dir=tmp_path / "out", cancel_check=lambda: True
        )
        with pytest.raises(CaptureError, match="aborted"):
            run_capture(tmp_path, options, engine=engine)
        assert engine.calls == []
        # Nothing was written into the library root.
        docs = tmp_path / "library" / "docs"
        assert not docs.exists() or not any(docs.iterdir())

    def test_cancel_check_passed_to_engine(self, tmp_path, library):
        engine = FakeEngine()
        check = lambda: False  # noqa: E731
        options = CaptureOptions(local_dir=tmp_path / "out", cancel_check=check)
        run_capture(tmp_path, options, engine=engine)
        assert engine.calls, "engine must have been invoked"
        assert engine.calls[0]["cancel_check"] is check

    def test_engine_cancel_runtime_error_propagates(self, tmp_path, library):
        def _raise():
            raise RuntimeError("Capture aborted by user")

        engine = FakeEngine(on_start=_raise)
        options = CaptureOptions(local_dir=tmp_path / "out")
        # Current facade behavior: only TypeError is converted to CaptureError;
        # an engine RuntimeError propagates unchanged.
        with pytest.raises(RuntimeError, match="Capture aborted by user"):
            run_capture(tmp_path, options, engine=engine)
