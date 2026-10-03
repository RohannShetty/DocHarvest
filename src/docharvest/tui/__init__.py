"""DocHarvest TUI.

Import this package without textual installed and nothing breaks —
textual is only imported when you actually build the app.
"""

from __future__ import annotations

__all__ = ["DocHarvestApp", "run"]


def __getattr__(name: str):
    if name in __all__:
        from .app import DocHarvestApp, run  # noqa: PLC0415

        return {"DocHarvestApp": DocHarvestApp, "run": run}[name]
    raise AttributeError(name)
