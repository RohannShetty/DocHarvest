"""Run the checked-in retrieval fixture without network access."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from docharvest.benchmark import report_json, run_fixture  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", dest="json_path", type=Path, help="Also write the report to this path")
    parser.add_argument("--dataset", choices=("fixtures",), default="fixtures")
    parser.add_argument("--k", type=int, default=5, help="Results per query (default: 5)")
    args = parser.parse_args()

    serialized = report_json(run_fixture(args.k))
    print(serialized, end="")
    if args.json_path:
        args.json_path.parent.mkdir(parents=True, exist_ok=True)
        args.json_path.write_text(serialized, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
