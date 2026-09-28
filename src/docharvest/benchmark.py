"""Deterministic local retrieval benchmark primitives."""

from __future__ import annotations

import hashlib
import json
import platform
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any, Sequence


@dataclass(frozen=True)
class BenchmarkQuery:
    query: str
    expected_urls: tuple[str, ...]
    answer_spans: tuple[str, ...] = ()


@dataclass(frozen=True)
class Dataset:
    dataset_id: str
    corpus_hash: str
    queries: tuple[BenchmarkQuery, ...]


@dataclass(frozen=True)
class BenchmarkReport:
    dataset_id: str
    corpus_hash: str
    k: int
    hit_at_k: float
    mrr: float
    answer_containment_at_k: float
    latency_ms: tuple[float, ...]
    environment: dict[str, str]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def corpus_hash(records: Sequence[tuple[str, str]]) -> str:
    """Hash sorted ``(url, content)`` records for fixture drift detection."""
    digest = hashlib.sha256()
    for url, content in sorted(records):
        digest.update(url.encode("utf-8"))
        digest.update(b"\0")
        digest.update(content.encode("utf-8"))
        digest.update(b"\0")
    return digest.hexdigest()


def run(dataset: Dataset, *, index, k: int = 5) -> BenchmarkReport:
    """Run deterministic retrieval metrics against a SearchIndex-like object."""
    if k <= 0:
        raise ValueError("k must be greater than zero")
    if not dataset.queries:
        raise ValueError("dataset must contain at least one query")

    hits = 0
    reciprocal_ranks: list[float] = []
    contained = 0
    latencies: list[float] = []
    for item in dataset.queries:
        started = time.perf_counter()
        results = index.search(item.query, limit=k)
        latencies.append((time.perf_counter() - started) * 1000)
        expected_urls = tuple(item.expected_urls)

        def is_expected(result: dict[str, Any]) -> bool:
            result_url = str(result.get("url", "")).split("#", 1)[0]
            return any(
                result_url == expected.split("#", 1)[0]
                for expected in expected_urls
            )

        rank = next(
            (position for position, result in enumerate(results, start=1) if is_expected(result)),
            None,
        )
        if rank is not None:
            hits += 1
            reciprocal_ranks.append(1.0 / rank)
        else:
            reciprocal_ranks.append(0.0)

        spans = tuple(span.lower() for span in item.answer_spans if span)
        if spans and any(
            span in str(result.get("snippet", "")).replace("<b>", "").replace("</b>", "").lower()
            for result in results
            for span in spans
        ):
            contained += 1

    count = len(dataset.queries)
    return BenchmarkReport(
        dataset_id=dataset.dataset_id,
        corpus_hash=dataset.corpus_hash,
        k=k,
        hit_at_k=hits / count,
        mrr=sum(reciprocal_ranks) / count,
        answer_containment_at_k=contained / count,
        latency_ms=tuple(round(value, 3) for value in latencies),
        environment={
            "python": platform.python_version(),
            "platform": platform.platform(),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        },
    )

FIXTURE_RECORDS = (
    ("https://fixture.test/auth", "# Authentication\n\nUse a bearer token in the Authorization header."),
    ("https://fixture.test/limits", "# Rate limits\n\nRequests are limited to 60 per minute."),
)


def fixture_dataset() -> Dataset:
    """Return the small network-free dataset used by the CLI smoke command."""
    return Dataset(
        dataset_id="fixture-v1",
        corpus_hash=corpus_hash(FIXTURE_RECORDS),
        queries=(
            BenchmarkQuery(
                query="bearer token",
                expected_urls=("https://fixture.test/auth",),
                answer_spans=("bearer token",),
            ),
            BenchmarkQuery(
                query="requests minute",
                expected_urls=("https://fixture.test/limits",),
                answer_spans=("60 per minute",),
            ),
        ),
    )


def run_fixture(k: int = 5) -> BenchmarkReport:
    """Build and benchmark the network-free fixture corpus."""
    from docharvest.output_contract import CapturedPage, write_page_tree
    from docharvest.search import SearchIndex

    with TemporaryDirectory(prefix="docharvest-benchmark-") as directory:
        root = Path(directory)
        pages = [
            CapturedPage(url=url, title=url.rsplit("/", 1)[-1], content=content)
            for url, content in FIXTURE_RECORDS
        ]
        write_page_tree(root, pages, crawl_date="benchmark")
        index = SearchIndex(base_dir=root / "state")
        index.index_domain(
            "fixture.test",
            "",
            "https://fixture.test/",
            pages_dir=root / "pages",
        )
        return run(fixture_dataset(), index=index, k=k)

def report_json(report: BenchmarkReport) -> str:
    """Serialize a report with stable key ordering for checked-in evidence."""
    return json.dumps(report.to_dict(), indent=2, sort_keys=True) + "\n"
