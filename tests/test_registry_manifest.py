"""Registry manifest consistency.

`server.json` is what the official MCP registry (`registry.modelcontextprotocol.io`)
publishes, and it is what downstream directories — mcp.so, Smithery, Glama,
PulseMCP, Docker's MCP catalog — ingest. It therefore has to agree with the
package, the repo, and the README token that proves ownership of the PyPI
package. When the project was renamed from `docharvest` to DocHarvest,
nothing tied these surfaces together, so every draft listing kept advertising the
retired slug and a GitHub Pages path that 404s. These tests are that tie.

The manifest itself is validated against the live published schema by
`scripts/check-registry-manifest.py` (network); here we assert the invariants
that must hold offline.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "server.json"
README = ROOT / "README.md"
PYPROJECT = ROOT / "pyproject.toml"

REPO_URL = "https://github.com/RohannShetty/DocHarvest"
SHOWCASE_URL = "https://rohannshetty.github.io/DocHarvest/"


def _manifest() -> dict:
    assert MANIFEST.exists(), (
        "server.json is missing — it is the manifest the official MCP registry publishes"
    )
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def _pyproject_text() -> str:
    return PYPROJECT.read_text(encoding="utf-8")


def test_manifest_version_matches_the_package() -> None:
    from docharvest import __version__

    data = _manifest()
    assert data["version"] == __version__, (
        f"server.json advertises {data['version']} but the package is {__version__}"
    )
    for package in data["packages"]:
        assert package["version"] == __version__, (
            f"server.json package {package['identifier']} is pinned to "
            f"{package['version']}, not {__version__}"
        )


def test_manifest_points_at_docharvest_not_the_retired_slug() -> None:
    data = _manifest()
    assert data["repository"]["url"] == REPO_URL, (
        "server.json repository must be the DocHarvest repo"
    )
    assert data.get("websiteUrl") == SHOWCASE_URL, (
        "server.json websiteUrl must be the DocHarvest showcase"
    )
    text = json.dumps(data)
    assert "docharvest" in text, "the PyPI package name is still required"
    assert "rohannshetty.github.io/docharvest" not in text, (
        "server.json still references the retired GitHub Pages path (it 404s)"
    )


def test_manifest_name_matches_the_readme_ownership_token() -> None:
    """The registry proves PyPI ownership by finding this token in the README."""
    data = _manifest()
    name = data["name"]
    assert name.startswith("io.github.RohannShetty/"), (
        f"{name!r} must be namespaced io.github.<owner>/<server> for GitHub auth"
    )
    readme = README.read_text(encoding="utf-8")
    assert f"mcp-name: {name}" in readme, (
        f"README.md must contain 'mcp-name: {name}' — without it the registry "
        f"rejects the publish ('Registry validation failed for package')"
    )


def test_manifest_description_fits_the_registry_limit() -> None:
    assert len(_manifest()["description"]) <= 100, (
        "the registry rejects descriptions longer than 100 characters"
    )


def test_manifest_package_matches_pyproject() -> None:
    data = _manifest()
    package = data["packages"][0]
    assert package["registryType"] == "pypi"
    assert f'name = "{package["identifier"]}"' in _pyproject_text(), (
        f"server.json publishes {package['identifier']!r} but pyproject.toml "
        f"declares a different distribution name"
    )
    assert package["transport"]["type"] == "stdio"


def test_listings_use_one_canonical_name() -> None:
    """Directory copy must use the same name, package and URLs as the manifest.

    The listing kit lived in `marketing/`, which is deliberately untracked
    (.gitignore) — so asserting on it passed in a local working copy and failed
    on every CI runner. The tracked, shipped source of that copy is
    `docs/PROMOTION_PACKAGE.md`; the test guards it instead.
    """
    data = _manifest()
    listing = ROOT / "docs" / "PROMOTION_PACKAGE.md"
    assert listing.exists(), "the directory-listing copy is the source of that claim"
    text = listing.read_text(encoding="utf-8")
    assert data["name"] in text, (
        f"docs/PROMOTION_PACKAGE.md must quote the registry id {data['name']}"
    )
    assert REPO_URL in text, "the listing copy must point at the DocHarvest repo"
    assert "rohannshetty.github.io/docharvest" not in text, (
        "the listing copy still contains the retired GitHub Pages path (it 404s)"
    )
