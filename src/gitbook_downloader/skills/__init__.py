"""Bundled agent skills shipped with DocHarvest.

The canonical skill text lives inside the installed package so that
``gitbook-dl skill install`` can put it in front of any agent harness,
whatever directory layout that harness reads (``.agents/skills``,
``.claude/skills``, ``.cursor/skills``, ``.gemini/skills``,
``.github/skills``, ``.omp/skills`` …). Harnesses that read the packaged
copy directly, or that follow the repository's own skill directories, need
no install step.
"""

from __future__ import annotations

import shutil
from pathlib import Path

__all__ = ["SKILLS_DIR", "available_skills", "skill_file", "install_skill"]

#: Directory holding one sub-directory per bundled skill.
SKILLS_DIR = Path(__file__).resolve().parent


def available_skills() -> list[str]:
    """Return the names of bundled skills, sorted.

    A skill counts as bundled when it has a ``SKILL.md`` with a non-empty
    ``description``: harnesses that require a description silently skip
    skills without one, so shipping such a file would be dead weight.
    """
    names = []
    for skill_md in sorted(SKILLS_DIR.glob("*/SKILL.md")):
        if _has_description(skill_md):
            names.append(skill_md.parent.name)
    return names


def skill_file(name: str) -> Path:
    """Return the packaged ``SKILL.md`` path for *name*.

    Raises:
        FileNotFoundError: If no bundled skill carries that name.
    """
    path = SKILLS_DIR / name / "SKILL.md"
    if not path.is_file():
        raise FileNotFoundError(f"No bundled skill named '{name}' (looked in {path})")
    return path


def install_skill(name: str, target_dir: Path, *, force: bool = False) -> Path:
    """Copy a bundled skill into a harness skills directory.

    The layout written is ``<target_dir>/<name>/SKILL.md``, which is the
    non-recursive one-level shape every provider-based loader expects —
    nested layouts such as ``<root>/group/<name>/SKILL.md`` are not
    discovered.

    Args:
        name: Bundled skill name.
        target_dir: Harness skills root, e.g. ``.agents/skills``.
        force: Overwrite an existing file. Without it an existing skill is
            left untouched and reported back to the caller.

    Returns:
        Path: The written (or pre-existing) ``SKILL.md``.

    Raises:
        FileNotFoundError: If the skill is not bundled.
    """
    source = skill_file(name)
    destination_dir = Path(target_dir).expanduser() / name
    destination = destination_dir / "SKILL.md"
    if destination.exists() and not force:
        return destination
    destination_dir.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, destination)
    return destination


def _has_description(skill_md: Path) -> bool:
    """True when *skill_md* carries a non-empty frontmatter description."""
    try:
        text = skill_md.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return False
    if not text.startswith("---"):
        return False
    end = text.find("\n---", 3)
    if end == -1:
        return False
    for line in text[:end].splitlines():
        if line.strip().startswith("description:"):
            return len(line.split(":", 1)[1].strip()) > 0
    return False
