"""Incremental refresh prototype (SPIKE 026).

Behind ``DOCHARVEST_CHANGED_ONLY=1``, page fetches carry the validators from
the previous capture (``If-None-Match`` / ``If-Modified-Since``). A ``304 Not
Modified`` is turned into a synthetic ``200`` carrying the cached HTML, so the
provider pipeline produces byte-identical Markdown without a body transfer.

The cache is a *hint*, never a source of truth: a poisoned or stale cache can
only cause an extra fetch or a missing revalidation, never a silently dropped
page (a 304 still yields the cached bytes for that URL only).

Layout (spike-only, reversible by deleting the directory):

    <library>/cache/<domain>/revalidate.json
    {"<url>": {"etag", "last_modified", "html", "content_type", "fetched_at"}}

Storing the HTML (rather than only validators) keeps the 304 path independent
of the library page tree. A follow-up should replace it with a URL→relpath
index over the stored pages and keep only validators here.
"""

from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any, Iterable

import requests

from .paths import library_root
from .storage.manager import atomic_write_text, domain_to_path_name

CACHE_DIR_NAME = "cache"
CACHE_FILE_NAME = "revalidate.json"
ENV_CHANGED_ONLY = "DOCHARVEST_CHANGED_ONLY"

#: Cap the stored body per page so a runaway page cannot fill the cache.
MAX_CACHED_BYTES = 2 * 1024 * 1024


def changed_only_enabled() -> bool:
    return (os.environ.get(ENV_CHANGED_ONLY) or "").strip() == "1"


def cache_path(domain: str) -> Path:
    return (
        library_root(create=True)
        / CACHE_DIR_NAME
        / domain_to_path_name(domain)
        / CACHE_FILE_NAME
    )


def load_cache(domain: str) -> dict[str, dict[str, Any]]:
    """Load the per-domain cache; any problem degrades to an empty cache."""
    path = cache_path(domain)
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    if not isinstance(data, dict):
        return {}
    return {url: entry for url, entry in data.items() if isinstance(entry, dict)}


def save_cache(domain: str, entries: dict[str, dict[str, Any]]) -> None:
    """Persist the cache atomically; failure is non-fatal by design."""
    try:
        payload = json.dumps(entries, ensure_ascii=False)
        atomic_write_text(cache_path(domain), payload)
    except Exception:  # noqa: BLE001 - cache is best-effort
        pass


def _synthetic_200(url: str, entry: dict[str, Any]) -> requests.Response:
    response = requests.Response()
    response.status_code = 200
    response.url = url
    response.encoding = "utf-8"
    response.headers["Content-Type"] = entry.get("content_type") or "text/html"
    html = (entry.get("html") or "").encode("utf-8")
    response._content = html
    return response


class ConditionalSession:
    """A ``requests.Session`` proxy that revalidates known page URLs.

    Only URLs in *record_urls* are stored; other traffic (sitemaps, probes)
    passes through untouched.
    """

    def __init__(self, session, entries: dict[str, dict[str, Any]], record_urls: Iterable[str]):
        self._session = session
        self.cache = entries
        self._record = set(record_urls)
        self.revalidated = 0  # 304s served from cache
        self.fetched = 0      # 200s stored

    def get(self, url: str, **kwargs):
        entry = self.cache.get(url)
        headers = dict(kwargs.pop("headers", {}) or {})
        if entry:
            if entry.get("etag"):
                headers["If-None-Match"] = entry["etag"]
            if entry.get("last_modified"):
                headers["If-Modified-Since"] = entry["last_modified"]
        response = self._session.get(url, headers=headers, **kwargs)
        if response.status_code == 304 and entry and entry.get("html") is not None:
            self.revalidated += 1
            return _synthetic_200(url, entry)
        if response.status_code == 200 and url in self._record:
            body = response.text
            if len(body.encode("utf-8")) <= MAX_CACHED_BYTES:
                self.cache[url] = {
                    "etag": response.headers.get("ETag"),
                    "last_modified": response.headers.get("Last-Modified"),
                    "html": body,
                    "content_type": response.headers.get("Content-Type"),
                    "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                }
                self.fetched += 1
        return response

    def __getattr__(self, name):
        return getattr(self._session, name)
