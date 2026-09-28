"""Consumer-facing README contracts for the growth front door."""
from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
README = ROOT / "README.md"


def test_first_screen_leads_with_install_proof_and_local_first_path() -> None:
    text = README.read_text(encoding="utf-8")
    first_screen = text[: text.index("## ⚡ Overview")]

    assert "pip install docharvest" in first_screen
    assert "673 pages" in first_screen
    assert "18.2 s" in first_screen
    assert "~83%" in first_screen
    assert text.index("pip install docharvest") < text.index("## ⚡ Overview")
    assert "python benchmarks/run.py" in first_screen


def test_badges_use_brand_ramp_and_one_amber_accent() -> None:
    text = README.read_text(encoding="utf-8")
    badge_lines = [line for line in text.splitlines() if line.startswith("[![")]
    top_badges = badge_lines[:4]

    assert len(top_badges) == 4
    assert all("labelColor=18181b" in line for line in top_badges)
    colours = [re.findall(r"-([0-9a-f]{6})\?style=", line)[0] for line in top_badges]
    assert colours.count("f59e0b") == 1
    assert set(colours) <= {"3f3f46", "71717a", "a1a1aa", "f59e0b"}


def test_mcp_ownership_token_remains_unique_and_canonical() -> None:
    text = README.read_text(encoding="utf-8")
    assert text.count("mcp-name: io.github.RohannShetty/docharvest") == 1
    assert "docharvest mcp" in text
    assert "gitbook-downloader" not in text
