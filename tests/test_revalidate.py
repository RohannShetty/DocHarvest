"""Spike 026: conditional revalidation for unchanged pages."""

from __future__ import annotations

from pathlib import Path

import pytest

import docharvest.engine as engine
from docharvest.providers.generic import GenericProvider

CHANGED_B = """<!DOCTYPE html>
<html><head><title>Page B</title></head>
<body><main><h1>Page B</h1>
<p>Beta content, second revision. The body changed between captures.</p>
</main></body></html>
"""


@pytest.fixture
def reval_env(tmp_path, monkeypatch):
    monkeypatch.setenv("DOCHARVEST_HOME", str(tmp_path / "library"))
    monkeypatch.setenv("DOCHARVEST_CHANGED_ONLY", "1")
    return tmp_path


def _capture(server):
    return engine.stream_download(
        server.url("/reval/"),
        max_pages=None,
        workers=2,
        provider=GenericProvider(),
        path_scope="/reval/",
    )


def test_unchanged_capture_sends_no_bodies(fixture_server, reval_env):
    first = _capture(fixture_server)
    before = fixture_server.not_modified

    second = _capture(fixture_server)

    # index + a + b all revalidated with 304 (no body transfer).
    assert fixture_server.not_modified - before == 3
    assert [p["content"] for p in first["pages"]] == [
        p["content"] for p in second["pages"]
    ]
    cache = (
        Path(reval_env)
        / "library"
        / "cache"
        / "127.0.0.1"
        / "revalidate.json"
    )
    # The cache path is domain-keyed; the fixture host includes a port, so the
    # exact directory name comes from domain_to_path_name. Any revalidate.json
    # under cache/ is enough for this assertion.
    assert any(Path(reval_env, "library", "cache").rglob("revalidate.json"))


def test_changed_page_is_refetched(fixture_server, reval_env):
    _capture(fixture_server)
    before = fixture_server.not_modified

    fixture_server.set_body("/reval/b.html", CHANGED_B)
    third = _capture(fixture_server)

    # index + a are still 304; b was re-fetched with a body.
    assert fixture_server.not_modified - before == 2
    by_url = {p["url"]: p["content"] for p in third["pages"]}
    b_content = next(v for k, v in by_url.items() if k.endswith("/reval/b.html"))
    a_content = next(v for k, v in by_url.items() if k.endswith("/reval/a.html"))
    assert "second revision" in b_content
    assert "Alpha content" in a_content


def test_disabled_by_default(fixture_server, tmp_path, monkeypatch):
    monkeypatch.setenv("DOCHARVEST_HOME", str(tmp_path / "library"))
    monkeypatch.delenv("DOCHARVEST_CHANGED_ONLY", raising=False)
    before = fixture_server.not_modified

    _capture(fixture_server)
    _capture(fixture_server)

    assert fixture_server.not_modified == before
    assert not any(Path(tmp_path, "library", "cache").glob("**/revalidate.json"))
