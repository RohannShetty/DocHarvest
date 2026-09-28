"""Tests for deterministic local retrieval benchmark metrics."""

from __future__ import annotations

from docharvest.benchmark import BenchmarkQuery, Dataset, corpus_hash, run


class FakeIndex:
    def search(self, query: str, *, limit: int) -> list[dict]:
        assert limit == 2
        if query == "auth":
            return [{"url": "https://docs.test/auth#authentication", "snippet": "Bearer token"}]
        return [{"url": "https://docs.test/other", "snippet": "unrelated"}]


def test_metrics_match_page_urls_and_answer_spans() -> None:
    dataset = Dataset(
        dataset_id="test",
        corpus_hash=corpus_hash((("u", "body"),)),
        queries=(
            BenchmarkQuery(
                query="auth",
                expected_urls=("https://docs.test/auth",),
                answer_spans=("bearer token",),
            ),
            BenchmarkQuery(query="missing", expected_urls=("https://docs.test/no",)),
        ),
    )

    report = run(dataset, index=FakeIndex(), k=2)

    assert report.hit_at_k == 0.5
    assert report.mrr == 0.5
    assert report.answer_containment_at_k == 0.5
    assert len(report.latency_ms) == 2


def test_invalid_benchmark_inputs_fail_closed() -> None:
    dataset = Dataset("empty", "hash", ())
    try:
        run(dataset, index=FakeIndex())
    except ValueError as exc:
        assert str(exc) == "dataset must contain at least one query"
    else:  # pragma: no cover
        raise AssertionError("empty datasets must be rejected")
