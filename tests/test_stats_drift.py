"""Stats drift regression.

Single source of truth for DocHarvest marketing stats: ``docs/lib/stats.ts``.

This test fails if any of the hardcoded magic numbers that previously appeared
across Hero, AgentEcosystemShowcase, PersonaShowcase, or ExportStudioPreview
are re-introduced.

After Phase 1 step 2:
- All copy using ``15+``, ``12+``, ``11+``, ``89%``, ``364``, ``18.2``,
  ``20.0`` must read from ``STATS.*``.
- ``docs/lib/stats.ts`` is the only file that defines these numbers; any
  duplicate literal in the components is a regression.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent
COMPONENTS_DIR = REPO_ROOT / "docs" / "components"
STATS_FILE = REPO_ROOT / "docs" / "lib" / "stats.ts"


# Magic-number literals that MUST NOT appear hardcoded in component files.
# The values (15, 12, 11, 89, 364, 18.2, 20.0) are tied to STATS fields.
# We allow them to appear in:
#   - docs/lib/stats.ts (the source of truth)
#   - tests, fixtures, and lockfiles (out of scope)
# We also allow them in CHANGELOG.md and AGENTS.md (historical notes).
DRIFT_PATTERNS = [
    re.compile(r"15\+ Harnesses"),
    re.compile(r"11\+ Modern Coding Harnesses"),
    re.compile(r"All 12\+ Harnesses"),
    re.compile(r"89% Reduction"),
    re.compile(r"89% prompt token reduction"),
    re.compile(r"364/364 HARVESTED"),
    re.compile(r"18\.2s"),
    re.compile(r"20\.0 pgs/sec"),
    # The combined terminal line uses spaces in `20.0 pages/sec` AND
    # `20.0 pgs/sec` — block both, including the dynamic one that would only
    # be valid if it's not from STATS.speedPagesPerSec.
    re.compile(r"20\.0 pages/sec"),
    # The STATUS footer in Hero.tsx uses `364` directly; that's a STATS value.
    # We grep for the pattern in terminal log lines by context.
    re.compile(r"364 pages harvested"),
    re.compile(r"Extracted 364 articles"),
    re.compile(r"total_pages: 364"),
]


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def test_stats_file_exists() -> None:
    assert STATS_FILE.exists(), (
        f"Expected {STATS_FILE.relative_to(REPO_ROOT)} to exist as the central "
        f"stats source of truth"
    )


def test_stats_file_exports_starts_object() -> None:
    text = _read_text(STATS_FILE)
    assert "export const STATS" in text, (
        f"{STATS_FILE.relative_to(REPO_ROOT)} must export a STATS object"
    )
    for field in (
        "agentsShipped",
        "harnesses",
        "pagesCaptured",
        "reductionPct",
        "speedPagesPerSec",
        "captureTimeSec",
    ):
        assert field in text, (
            f"STATS must include the {field!r} field"
        )


@pytest.mark.parametrize(
    "component",
    sorted(p for p in COMPONENTS_DIR.glob("*.tsx") if p.is_file()),
    ids=lambda p: p.name,
)
def test_no_hardcoded_stats_in_components(component: Path) -> None:
    text = _read_text(component)
    for pattern in DRIFT_PATTERNS:
        match = pattern.search(text)
        assert match is None, (
            f"{component.relative_to(REPO_ROOT)} contains hardcoded stat "
            f"literal {match.group(0)!r} (pattern: {pattern.pattern!r}). "
            f"Import STATS from '../lib/stats' instead."
        )


def test_hero_numbers_come_from_data_not_literals() -> None:
    """Hero.tsx must render its specimen numbers from committed capture data.

    The Index Sheet hero has no fake terminal any more: it shows real rows from
    ``docs/data/index-data.json`` (via ``indexData``). The invariant that still
    matters is the original one — public numbers are never typed into a
    component. They come from ``STATS`` (docs/lib/stats.ts) or from the
    generated capture data.
    """
    hero = COMPONENTS_DIR / "Hero.tsx"
    if not hero.exists():
        pytest.skip("Hero.tsx replaced by Masthead.tsx in The Index Sheet architecture")
    text = _read_text(hero)

    assert "indexData" in text, (
        "Hero.tsx must render the capture specimen from the committed capture "
        "data (indexData), not from inline literals"
    )
    assert "indexData.provenance.totalRows" in text, (
        "Hero.tsx must read the specimen row count from the capture provenance"
    )

    # Claim literals that must never be typed into the hero again.
    for literal in ("673", "18.2", "765", "37 pages", "83"):
        assert literal not in text, (
            f"Hero.tsx hardcodes the claim literal {literal!r}; read it from "
            f"STATS (docs/lib/stats.ts) or the capture data instead"
        )


def test_hero_no_legacy_hardcoded_harnesses_label() -> None:
    """Defence-in-depth: no `15+ Harnesses` literal can sneak back in."""
    hero = COMPONENTS_DIR / "Hero.tsx"
    if not hero.exists():
        pytest.skip("Hero.tsx replaced by Masthead.tsx in The Index Sheet architecture")
    text = _read_text(hero)
    assert "15+ Harnesses" not in text
    assert "12+ Harnesses" not in text
    assert "11+ Harnesses" not in text


# ── Generated claim numbers ───────────────────────────────────────────────
#
# `testsCollected` / `testsPassing` / `testsFailing` / `statsUpdated` in
# docs/lib/stats.ts are generated by docs/scripts/sync-stats.mjs. They used to
# be typed in by hand, which is how the site ended up advertising "765 tests
# passing" (badge), "686" (README body) and "740" (HANDOFF) while the real suite
# had grown past 800 — with four failures. These tests keep the published
# numbers consistent, dated, and never larger than reality.

REGENERATE_HINT = "regenerate with `node docs/scripts/sync-stats.mjs --run`"


def _stats_fields() -> dict[str, object]:
    """Parse the generated fields out of docs/lib/stats.ts."""
    text = _read_text(STATS_FILE).split("export const STATS", 1)[-1]
    fields: dict[str, object] = {}
    for match in re.finditer(r"(\w+):\s*('([^']*)'|[-\d.]+)", text):
        name, raw, quoted = match.group(1), match.group(2), match.group(3)
        if quoted is not None:
            fields[name] = quoted
        elif "." in raw:
            fields[name] = float(raw)
        else:
            fields[name] = int(raw)
    return fields


def test_generated_test_counts_are_present() -> None:
    fields = _stats_fields()
    for name in (
        "testsCollected",
        "testsPassing",
        "testsFailing",
        "testsSkipped",
        "statsUpdated",
    ):
        assert name in fields, (
            f"docs/lib/stats.ts is missing the generated field {name!r} — {REGENERATE_HINT}"
        )


def test_generated_test_counts_are_internally_consistent() -> None:
    fields = _stats_fields()
    collected = int(str(fields["testsCollected"]))
    passing = int(str(fields["testsPassing"]))
    failing = int(str(fields["testsFailing"]))
    skipped = int(str(fields["testsSkipped"]))
    assert passing + failing + skipped == collected, (
        f"published counts do not add up: {passing} passing + {failing} failing "
        f"+ {skipped} skipped != {collected} collected — {REGENERATE_HINT}"
    )


def test_published_pass_count_is_plausible_for_this_suite() -> None:
    """A published number has to be possible for *this* suite.

    An earlier version of this test compared the published count against the
    number of tests collected in the current run. That was wrong: collection is
    environment-dependent (the optional `mcp` extra adds 31 tests when it is
    importable, and TTY-dependent suites vary), so a machine with fewer extras
    would fail a suite that was published honestly from another machine.

    What is stable everywhere is the shape of the number: it must be a real
    count of *this* repository's tests, not a leftover from another project and
    not a rounded-up marketing figure.
    """
    fields = _stats_fields()
    passing = int(str(fields["testsPassing"]))
    assert 100 <= passing <= 100_000, (
        f"published passing count {passing} is not a plausible size for this suite — {REGENERATE_HINT}"
    )
    test_files = sorted((REPO_ROOT / "tests").glob("test_*.py"))
    assert len(test_files) >= 40, (
        "this repository has dozens of test modules; a much smaller published "
        "figure suggests the number describes a subset (or another project)"
    )
    # A published count in the hundreds/thousands must at least be able to come
    # from the test modules that exist, at ~a few tests per module.
    assert passing <= len(test_files) * 200, (
        f"{passing} passing tests across {len(test_files)} modules is not credible — {REGENERATE_HINT}"
    )


def test_generated_stats_carry_a_real_date() -> None:
    """An undated number is not a claim, it is a rumour."""
    from datetime import datetime

    fields = _stats_fields()
    raw = str(fields["statsUpdated"])
    datetime.strptime(raw, "%Y-%m-%d")  # raises ValueError on a bad date


def test_no_document_states_a_conflicting_test_count() -> None:
    """Prose must not advertise a *different* current count.

    The README badge is generated. Any other current-looking "N passing" figure
    (700-2000) has to agree with it, so a doc can't quietly reintroduce the
    686/740/765 split this release fixed. Historical records quoting smaller
    numbers (e.g. the v9.0.1 handoff's 484) are out of range and ignored.
    """
    fields = _stats_fields()
    published = int(str(fields["testsPassing"]))
    pattern = re.compile(r"\b(7\d\d|8\d\d|9\d\d|1\d\d\d)\b[^\n]{0,24}?\b(passing|passed)\b", re.I)

    offenders = []
    for rel in ("README.md", "docs/SEO_GUIDE.md", "docs/HANDOFF.md", "PRODUCT.md"):
        text = _read_text(REPO_ROOT / rel)
        for line in text.splitlines():
            if "badge/tests-" in line:
                continue
            match = pattern.search(line)
            if match and int(match.group(1)) != published:
                offenders.append(f"{rel}: {line.strip()[:90]}")
    assert not offenders, (
        f"these documents advertise a test count that disagrees with the generated "
        f"{published}: {offenders} — {REGENERATE_HINT}"
    )


def test_readme_badge_agrees_with_the_generated_stats() -> None:
    """The README badge is a published claim, so it is generated too.

    Both surfaces are written by `node docs/scripts/sync-stats.mjs`, and a badge
    that disagrees with docs/lib/stats.ts is how "765 passing" outlived a suite
    of 800+ tests.
    """
    fields = _stats_fields()
    readme = _read_text(REPO_ROOT / "README.md")
    badge = re.search(r"!\[Tests: (\d+) passing\]\(https://img\.shields\.io/badge/tests-(\d+)%20passing", readme)
    assert badge, (
        f"README.md must carry a tests badge generated by the sync script — {REGENERATE_HINT}"
    )
    alt, image = badge.group(1), badge.group(2)
    published = int(str(fields["testsPassing"]))
    assert int(image) == published, (
        f"README badge image says {image} passing but docs/lib/stats.ts says "
        f"{published} — {REGENERATE_HINT}"
    )
    assert int(alt) == published, (
        f"the badge's alt text says {alt} while the badge image says {image}; the alt "
        f"is what screen readers and broken images show, so it has to be regenerated "
        f"too — {REGENERATE_HINT}"
    )

