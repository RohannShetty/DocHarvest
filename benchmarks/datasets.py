"""Small redistributable fixture used for local benchmark smoke runs."""

from __future__ import annotations

from docharvest.benchmark import FIXTURE_RECORDS as RECORDS
from docharvest.benchmark import Dataset, fixture_dataset

__all__ = ["Dataset", "RECORDS", "fixture_dataset"]
