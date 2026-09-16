"""Tests for the bundled agent skills and their installer.

The skill ships inside the installed package so that ``gitbook-dl skill
install`` can drop it into whatever directory a harness reads. Before this,
no skill file was tracked in the repository at all: ``git ls-files`` over the
harness directories returned nothing, so a fresh clone had no skill for an
agent to discover.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import pytest

from gitbook_downloader.skills import (
    SKILLS_DIR,
    available_skills,
    install_skill,
    skill_file,
)

REPO_ROOT = Path(__file__).resolve().parent.parent


class TestBundledSkills:
    def test_docharvest_is_bundled(self):
        assert "docharvest" in available_skills()

    def test_skill_file_has_name_and_description_frontmatter(self):
        """Loaded skills need a non-empty `description`; harnesses that set
        requireDescription silently skip skills without one."""
        text = skill_file("docharvest").read_text(encoding="utf-8")

        assert text.startswith("---")
        frontmatter = text.split("---", 2)[1]
        assert "name: docharvest" in frontmatter
        description = next(
            line for line in frontmatter.splitlines() if line.startswith("description:")
        )
        assert len(description.split(":", 1)[1].strip().strip('"')) > 40

    def test_unknown_skill_raises(self):
        with pytest.raises(FileNotFoundError, match="No bundled skill"):
            skill_file("does-not-exist")

    def test_skill_lives_inside_the_installed_package(self):
        """The file must live under the package, not only in the repo, or a
        pip/uvx install has nothing to install from."""
        package_dir = Path(
            __import__("gitbook_downloader").__file__
        ).resolve().parent

        assert SKILLS_DIR.parent == package_dir
        assert (package_dir / "__init__.py").is_file()
        assert skill_file("docharvest").is_relative_to(package_dir)


class TestInstallSkill:
    def test_writes_harness_layout(self, tmp_path: Path):
        written = install_skill("docharvest", tmp_path)

        assert written == tmp_path / "docharvest" / "SKILL.md"
        assert written.read_text(encoding="utf-8") == skill_file("docharvest").read_text(
            encoding="utf-8"
        )

    def test_existing_file_is_preserved_without_force(self, tmp_path: Path):
        target = tmp_path / "docharvest"
        target.mkdir(parents=True)
        existing = target / "SKILL.md"
        existing.write_text("locally customized", encoding="utf-8")

        install_skill("docharvest", tmp_path)

        assert existing.read_text(encoding="utf-8") == "locally customized"

    def test_force_overwrites(self, tmp_path: Path):
        target = tmp_path / "docharvest"
        target.mkdir(parents=True)
        existing = target / "SKILL.md"
        existing.write_text("locally customized", encoding="utf-8")

        install_skill("docharvest", tmp_path, force=True)

        assert existing.read_text(encoding="utf-8").startswith("---")


class TestCommittedSkillCopy:
    def test_repo_copy_matches_the_packaged_skill(self):
        """The workspace copy that harnesses read directly must not drift from
        the canonical packaged file."""
        committed = REPO_ROOT / ".omp" / "skills" / "docharvest" / "SKILL.md"
        if not committed.exists():  # running from an sdist/wheel without the repo
            pytest.skip("workspace skill copy not present")

        assert committed.read_text(encoding="utf-8") == skill_file("docharvest").read_text(
            encoding="utf-8"
        )


class TestSkillCli:
    def test_list_reports_the_bundled_skill(self):
        result = subprocess.run(
            [sys.executable, "-m", "gitbook_downloader", "skill", "list"],
            capture_output=True,
            text=True,
            cwd=REPO_ROOT,
        )

        assert result.returncode == 0, result.stderr
        assert "docharvest" in result.stdout

    def test_install_into_a_chosen_harness_directory(self, tmp_path: Path):
        result = subprocess.run(
            [
                sys.executable, "-m", "gitbook_downloader", "skill", "install",
                "docharvest", "-o", str(tmp_path),
            ],
            capture_output=True,
            text=True,
            cwd=REPO_ROOT,
        )

        assert result.returncode == 0, result.stderr
        assert (tmp_path / "docharvest" / "SKILL.md").is_file()
