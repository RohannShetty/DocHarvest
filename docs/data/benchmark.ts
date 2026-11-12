/**
 * Retrieval benchmark, recorded from a real run — not a projection.
 *
 * Reproduce:
 *   cd <repo> && uv run python benchmarks/run.py --dataset fixtures --k 5
 *
 * The fixture corpus is small on purpose: it checks that capture -> index ->
 * search returns the containing passage, and that the run is reproducible.
 * It says nothing about capture speed on a live site, which is why no page
 * count or pages-per-second figure appears on the showcase.
 */
export const RETRIEVAL_BENCHMARK = {
  datasetId: 'fixture-v1',
  k: 5,
  queries: 2,
  hitAtK: 1,
  mrr: 1,
  answerContainmentAtK: 1,
  corpusHash: 'f6ea24a7b9ea2ec2322515eedd154b21bb18f481be9c7515adb65cc5a9778130',
  generatedAt: '2026-10-27',
  command: 'uv run python benchmarks/run.py --dataset fixtures --k 5',
} as const;
