"""Contracts for checkout-only growth deliverables."""
from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_external_checklist_keeps_external_mutations_manual() -> None:
    text = (ROOT / "docs" / "GROWTH_EXTERNAL_CHECKLIST.md").read_text(encoding="utf-8")

    for item in ("A2", "A3", "A4", "P3", "P4", "P9", "P11", "P12"):
        assert f"- [ ] {item}" in text
    assert "does not mutate GitHub settings" in text
    assert "GROWTH_AUDIT.md" in text


def test_audit_points_to_task_level_execution_plan() -> None:
    """The audit must name the plan that carries its tasks.

    `docs/superpowers/` is deliberately untracked (.gitignore) — the plan is a
    local working artifact, not a shipped file. So the contract is that the
    audit *references* it by path, which is what a reader in a clean checkout
    can check; the plan's own existence is not asserted, because asserting it
    would fail on every CI runner.
    """
    audit = (ROOT / "GROWTH_AUDIT.md").read_text(encoding="utf-8")

    assert "docs/superpowers/plans/2026-09-28-growth-roadmap.md" in audit
    assert "checkout-only" in audit
