#!/usr/bin/env python3
"""Validate server.json against the live MCP registry schema.

`tests/test_registry_manifest.py` covers the offline invariants (name, version,
package, README ownership token). This script adds the one check that needs
network access: the manifest must satisfy the published JSON Schema, because
`mcp-publisher publish` rejects anything that does not.

Usage:
    python scripts/check-registry-manifest.py
    python scripts/check-registry-manifest.py --schema 2025-09-29

Exit code is 0 when valid, 1 otherwise — safe to wire into CI.
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "server.json"
DEFAULT_SCHEMA_VERSION = "2025-12-11"


def load_json(url: str) -> dict:
    with urllib.request.urlopen(url, timeout=30) as response:  # noqa: S310
        return json.load(response)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--schema", default=DEFAULT_SCHEMA_VERSION, help="registry schema version")
    parser.add_argument("--manifest", default=str(MANIFEST))
    args = parser.parse_args()

    from jsonschema import Draft7Validator

    manifest_path = Path(args.manifest)
    if not manifest_path.exists():
        print(f"FAIL: {manifest_path} does not exist")
        return 1
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    schema_url = (
        manifest.get("$schema")
        or f"https://static.modelcontextprotocol.io/schemas/{args.schema}/server.schema.json"
    )
    print(f"manifest: {manifest_path}")
    print(f"schema:   {schema_url}")

    try:
        schema = load_json(schema_url)
    except Exception as exc:  # pragma: no cover - network dependent
        print(f"FAIL: could not fetch the schema ({exc})")
        return 1

    errors = sorted(Draft7Validator(schema).iter_errors(manifest), key=lambda e: list(e.path))
    if errors:
        for error in errors:
            location = "/".join(str(p) for p in error.path) or "<root>"
            print(f"FAIL {location}: {error.message}")
        return 1

    name = manifest["name"]
    package = manifest["packages"][0]
    print(
        f"OK: {name} v{manifest['version']} "
        f"({package['registryType']}:{package['identifier']} over {package['transport']['type']})"
    )

    # A published server is discoverable without the publisher CLI.
    try:
        published = load_json(
            "https://registry.modelcontextprotocol.io/v0/servers?search="
            + urllib.parse.quote(name, safe="")
        )
        count = published.get("metadata", {}).get("count", 0)
        print(f"registry lookup: {count} published version(s) for {name}")
    except Exception as exc:  # pragma: no cover - network dependent
        print(f"registry lookup skipped ({exc})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
