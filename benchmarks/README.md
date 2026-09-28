# Local retrieval benchmark

The fixture benchmark is deterministic and network-free. It builds two Markdown pages into a temporary DocHarvest page tree, indexes them with SQLite FTS5, and reports hit@k, MRR, answer-containment@k, latency, dataset id, corpus hash, and runtime metadata.

Run it from the repository root:

```bash
python benchmarks/run.py
# or
uv run docharvest bench --dataset fixtures
```

The fixture is a smoke benchmark, not a web-scale quality claim. Replace public performance numbers only with output that includes the dataset id, corpus hash, commit, Python version, and machine.
