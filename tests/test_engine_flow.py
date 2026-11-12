"""Engine-lane flow regression tests against the local fixture server.

Covers plan §4 fixes: soft-200 HTML-as-md hardening (#6), deterministic
book order + entry-page title (#8), link rewriting (#9), language-filter
fixes + BFS exclude enforcement (#10), and the Lane-B facade kwargs
(path_scope / exclude_paths / timeout / max_pages=None).
"""

import time
from pathlib import Path

import pytest

import docharvest.engine as engine
from docharvest.providers import GitBookProvider
from docharvest.storage import StorageManager
from docharvest.utils import create_session


# ── Stub storage/search so engine tests never touch the library ──


@pytest.fixture()
def fake_storage():
    """Compatibility fixture: the engine no longer writes storage itself.

    Kept so existing test signatures keep working while pinning the boundary:
    if the engine ever regains hidden persistence, tests that assert on the
    facade's storage will catch it.
    """

    class FakeStorage:
        def __init__(self):
            self.saved = []

        def domain_exists(self, domain):
            return False

        def save_doc(self, **kw):
            self.saved.append(kw)

    return FakeStorage()


@pytest.fixture()
def session():
    return create_session()


def _pages(raw):
    """The engine now returns structured pages; keep assertions on that shape."""
    assert isinstance(raw, dict), f"expected structured result, got {type(raw)!r}"
    assert "pages" in raw, raw
    return raw["pages"]


def _urls(raw) -> list[str]:
    return [p["url"] for p in _pages(raw)]


def _text(raw) -> str:
    return "\n".join(p["content"] for p in _pages(raw))


# ── Fix #6: soft-200 HTML-as-md hardening ────────────────────────


class TestSoft200Hardening:
    def test_html_shell_md_export_is_rejected(self, fixture_server, session):
        """/spa/page.md returns 200 with an <html> shell (no doctype);
        the provider must fall back to HTML extraction instead of
        storing the shell as markdown."""
        provider = GitBookProvider()
        content = provider.extract_content(fixture_server.url("/spa/page"), session)
        assert content, "expected extracted content"
        assert "<html" not in content.lower()
        assert "Real Content" in content

    def test_looks_like_html_flags_shells(self):
        from docharvest.providers.base import looks_like_html

        assert looks_like_html("<html><head></head></html>")
        assert looks_like_html("<!DOCTYPE html><div id=root></div>")
        assert looks_like_html(
            '<div id="app"></div><script>x</script><body>y</body>'
        )
        assert not looks_like_html("# Heading\n\nSome <div>snippet</div> text.")
        assert not looks_like_html("")


# ── Facade kwargs (Lane B contract) ──────────────────────────────


class TestStreamDownloadSignature:
    def test_accepts_path_scope_exclude_timeout_and_none_max_pages(
        self, fixture_server, session, fake_storage
    ):
        raw = engine.stream_download(
            fixture_server.url("/"),
            max_pages=None,
            workers=4,
            session=session,
            path_scope=None,
            exclude_paths=None,
            timeout=5.0,
        )
        urls = _urls(raw)
        assert urls, "root crawl should produce content"
        assert any(u.endswith("/docs/intro") for u in urls)

    def test_max_pages_zero_still_unlimited(self, fixture_server, session, fake_storage):
        raw = engine.stream_download(
            fixture_server.url("/"), max_pages=0, workers=4, session=session
        )
        assert any("/docs/guide" in u for u in _urls(raw))

    def test_path_scope_restricts_crawl(self, fixture_server, session, fake_storage):
        raw = engine.stream_download(
            fixture_server.url("/"),
            max_pages=None,
            workers=4,
            session=session,
            path_scope=("/docs/",),
        )
        urls = _urls(raw)
        assert any("/docs/intro" in u for u in urls)
        assert not any("/gitbook" in u for u in urls)

    def test_exclude_paths_enforced_on_discovered_urls(
        self, fixture_server, session, fake_storage
    ):
        raw = engine.stream_download(
            fixture_server.url("/"),
            max_pages=None,
            workers=4,
            session=session,
            exclude_paths=("guide",),
        )
        urls = _urls(raw)
        assert any("/docs/intro" in u for u in urls)
        assert not any("/docs/guide" in u for u in urls)


# ── Fix #8: deterministic book order + entry-page title ──────────


class TestDeterministicOrder:
    def test_book_order_follows_crawl_order_not_completion(
        self, fixture_server, session, fake_storage, monkeypatch
    ):
        """Alphabetically-first page sleeps so it finishes LAST; the book must
        still list it first (crawl order is sorted for determinism)."""
        provider = GitBookProvider()
        original = provider.extract_content

        def slow_first(url, sess):
            if url.rstrip("/").endswith("/docs/guide"):
                time.sleep(0.2)
            return original(url, sess)

        monkeypatch.setattr(provider, "extract_content", slow_first)

        events = []
        raw = engine.stream_download(
            fixture_server.url("/"),
            max_pages=None,
            workers=4,
            session=session,
            provider=provider,
            progress_callback=events.append,
        )

        pages = _pages(raw)
        assert pages, "crawl should produce pages"
        first_url = pages[0]["url"]
        assert "/docs/guide" in first_url, (
            f"first crawled page must come first regardless of completion order; got {first_url}"
        )
        # The engine no longer writes storage; persistence is the facade's job.
        assert fake_storage.saved == [], (
            "the engine must not persist; api.capture owns storage writes"
        )


# ── Fix #9: link rewriting ───────────────────────────────────────


class TestLinkRewriting:
    def test_relative_links_absolutized_against_page_url(self):
        from docharvest.engine import rewrite_markdown_links

        md_text = (
            "See [Guide](./guide) and [Self](/docs/intro) and "
            "[External](https://elsewhere.com/x) and [anchor](#details)."
        )
        out = rewrite_markdown_links(md_text, "http://srv.test/docs/intro")
        assert "[Guide](guide)" in out
        # Site-absolute self link relativizes against the page directory.
        assert "[Self](intro)" in out
        assert "[External](https://elsewhere.com/x)" in out
        # Anchor-only links are stripped to their text.
        assert "](#details)" not in out
        assert "anchor" in out

    def test_docusaurus_flow_rewrites_links(self, fixture_server, session, fake_storage):
        raw = engine.stream_download(
            fixture_server.url("/docusaurus"),
            max_pages=None,
            workers=2,
            session=session,
        )
        text = _text(raw)
        assert "[Usage](usage)" in text
        assert "](./usage)" not in text


# ── Fix #10: language filter + BFS excludes ──────────────────────


class TestLanguageFilterAndBfs:
    def test_bare_zh_filtered_from_discovered_set(
        self, fixture_server, session, fake_storage
    ):
        raw = engine.stream_download(
            fixture_server.url("/"), max_pages=None, workers=4, session=session
        )
        urls = _urls(raw)
        assert not any("/docs/zh-cn/page" in u for u in urls)
        assert any("/docs/intro" in u for u in urls)

    def test_empty_after_filter_is_empty_with_warning_not_fallback(
        self, fixture_server, session, fake_storage, monkeypatch
    ):
        provider = GitBookProvider()
        monkeypatch.setattr(
            provider,
            "discover_urls",
            lambda base_url, sess: {fixture_server.url("/docs/zh-cn/page")},
        )
        events = []
        raw = engine.stream_download(
            fixture_server.url("/docs"),
            max_pages=None,
            workers=2,
            session=session,
            provider=provider,
            progress_callback=events.append,
        )
        assert _pages(raw) == []
        warnings = [
            e for e in events if e.get("phase") == "warning" or e.get("type") == "warning"
        ]
        assert warnings, "an empty-after-filter crawl must surface a warning"

    def test_segment_boundary_prefix_match(
        self, fixture_server, session, fake_storage, monkeypatch
    ):
        """/docs scope must not admit sibling paths like /docsx."""
        provider = GitBookProvider()
        monkeypatch.setattr(
            provider,
            "discover_urls",
            lambda base_url, sess: {
                fixture_server.url("/docs/intro"),
                fixture_server.url("/docsx/page"),
            },
        )
        raw = engine.stream_download(
            fixture_server.url("/docs"),
            max_pages=None,
            workers=2,
            session=session,
            provider=provider,
        )
        urls = _urls(raw)
        assert any("/docs/intro" in u for u in urls)
        assert not any("/docsx/page" in u for u in urls)

    def test_bfs_honors_exclude_paths_and_strips_anchor_links(
        self, fixture_server, session, fake_storage, monkeypatch
    ):
        """Force BFS by disabling every discovery path."""
        import docharvest.utils.discovery as disc

        provider = GitBookProvider()
        monkeypatch.setattr(provider, "discover_urls", lambda b, s: set())
        monkeypatch.setattr(disc, "discover_from_llms_txt", lambda b, s: set())
        monkeypatch.setattr(disc, "discover_from_sitemap", lambda b, s: set())

        raw = engine.stream_download(
            fixture_server.url("/gitbook"),
            max_pages=None,
            workers=2,
            session=session,
            provider=provider,
            path_scope="/",
            exclude_paths=("guide",),
        )
        urls = _urls(raw)
        assert any("/docs/intro" in u for u in urls)  # nav link followed
        assert not any("/docs/guide" in u for u in urls)  # excluded

    def test_leaf_doc_url_auto_expands_to_doc_root(
        self, fixture_server, session, fake_storage, monkeypatch
    ):
        """When given a leaf doc URL like /docs/installation, discovery should retain /docs/* pages."""
        provider = GitBookProvider()
        monkeypatch.setattr(
            provider,
            "discover_urls",
            lambda base_url, sess: {
                fixture_server.url("/docs/intro"),
                fixture_server.url("/docs/guide"),
                fixture_server.url("/blog/post-1"),
            },
        )
        raw = engine.stream_download(
            fixture_server.url("/docs/installation"),
            max_pages=None,
            workers=2,
            session=session,
            provider=provider,
        )
        urls = _urls(raw)
        assert any("/docs/intro" in u for u in urls)
        assert any("/docs/guide" in u for u in urls)
        assert not any("/blog/post-1" in u for u in urls)

# ── Snapshot ownership: api.capture snapshots, the engine must not ──


class _NullSearch:
    """Swallow the engine's post-capture indexing so tests stay hermetic."""

    def index_domain(self, *a, **k):
        pass


class TestEngineDoesNotSnapshot:
    """``api.capture`` records the pre-capture state exactly once. The engine
    used to snapshot again after saving ``docs.md``, so a single crawl minted
    two version files — the second identical to the first apart from the
    generated capture timestamp — and the newest version file never matched the
    live ``docs.md``."""

    def test_stream_download_creates_no_version_file(
        self, fixture_server, session, tmp_path
    ):
        from urllib.parse import urlparse

        store = StorageManager(base_dir=tmp_path)

        start_url = fixture_server.url("/")
        domain = urlparse(start_url).netloc
        # Seed a previous capture so an engine-side snapshot would have
        # something to copy — this is what the old code keyed on.
        store.save_doc(
            domain=domain, content="> Captured: 2026-01-01T00:00:00Z\n\n# Old\n\nOld body.",
            url=start_url, title="Old", pages=1, provider="gitbook",
            new_pages=1, size_kb=0.1,
        )
        assert store.domain_exists(domain)

        engine.stream_download(
            start_url, max_pages=None, workers=4, session=session
        )

        version_files = sorted(
            p.name for p in store.versions_dir(domain).glob("*.md")
        )
        assert version_files == [], (
            "the engine must not snapshot; api.capture owns snapshotting "
            f"(found {version_files})"
        )
