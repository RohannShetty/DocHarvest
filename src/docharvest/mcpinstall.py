"""One-command MCP installer (SPIKE 028).

Writes the ``mcpServers.docharvest`` entry for one configuration *family*:
the JSON clients that accept a ``command``/``args`` object. Array-form
configs (OpenCode/Kilo), TOML/YAML configs, and deeplink-only hosts are out
of scope.

Safety properties, in order:

- ``--dry-run`` is the default: nothing is written unless the caller asks.
- An existing ``docharvest`` entry is reported, never replaced without
  ``--force``.
- Writes are atomic; after writing, the file is parsed back and the entry is
  asserted. On any failure the original bytes are restored.
- No network access anywhere in this module.
"""

from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass
from pathlib import Path

from .storage.manager import atomic_write_text

#: v1 family: JSON configs whose root maps a server name to command/args.
FAMILY_A_CLIENTS = ("claude-code", "claude-desktop", "cursor", "vscode", "windsurf")

#: Clients whose root key differs from the default ``mcpServers``.
_ROOT_KEYS = {"vscode": "servers"}

#: VS Code requires an explicit transport discriminator.
_STDIO_TYPE = {"vscode": "stdio"}

_SERVER_NAME = "docharvest"
_COMMAND = "docharvest"
_ARGS = ("mcp",)


class InstallError(RuntimeError):
    """A reversible, user-facing installer failure."""


def _platform_name(platform: str | None = None) -> str:
    if platform:
        return platform
    if os.name == "nt":
        return "windows"
    if sys.platform == "darwin":
        return "darwin"
    return "linux"


def _home(home: str | Path | None = None) -> Path:
    return Path(home).expanduser() if home is not None else Path.home()


def client_path(
    client: str,
    *,
    home: str | Path | None = None,
    cwd: str | Path | None = None,
    platform: str | None = None,
) -> Path:
    """Return the configuration path for one supported client."""
    client = client.strip().lower()
    if client not in FAMILY_A_CLIENTS:
        raise InstallError(
            f"{client!r} is not in the v1 family. Supported: "
            + ", ".join(FAMILY_A_CLIENTS)
        )
    home_path = _home(home)
    cwd_path = Path(cwd).expanduser() if cwd is not None else Path.cwd()
    plat = _platform_name(platform)

    if client == "claude-code":
        return home_path / ".claude.json"
    if client == "claude-desktop":
        if plat == "windows":
            appdata = Path(os.environ.get("APPDATA") or home_path / "AppData" / "Roaming")
            return appdata / "Claude" / "claude_desktop_config.json"
        if plat == "darwin":
            return home_path / "Library" / "Application Support" / "Claude" / "claude_desktop_config.json"
        return home_path / ".config" / "Claude" / "claude_desktop_config.json"
    if client == "cursor":
        return home_path / ".cursor" / "mcp.json"
    if client == "windsurf":
        return home_path / ".codeium" / "windsurf" / "mcp_config.json"
    # vscode: workspace-scoped by convention.
    return cwd_path / ".vscode" / "mcp.json"


def root_key(client: str) -> str:
    return _ROOT_KEYS.get(client, "mcpServers")


def payload(client: str) -> dict[str, object]:
    entry: dict[str, object] = {"command": _COMMAND, "args": list(_ARGS)}
    if client in _STDIO_TYPE:
        entry = {"type": _STDIO_TYPE[client], **entry}
    return entry


@dataclass(frozen=True)
class Plan:
    """A rendered, not-yet-written configuration change."""

    client: str
    path: Path
    existing: str | None
    rendered: str

    @property
    def changed(self) -> bool:
        return self.existing != self.rendered

    @property
    def key(self) -> str:
        return root_key(self.client)


def _parse(text: str, path: Path) -> dict:
    if not text.strip():
        return {}
    try:
        value = json.loads(text)
    except json.JSONDecodeError as exc:
        raise InstallError(
            f"Existing configuration {path} is not valid JSON ({exc}); "
            "leaving it untouched."
        ) from exc
    if not isinstance(value, dict):
        raise InstallError(f"Configuration root in {path} must be an object.")
    return value


def plan(
    client: str,
    *,
    path: str | Path | None = None,
    force: bool = False,
    home: str | Path | None = None,
    cwd: str | Path | None = None,
    platform: str | None = None,
) -> Plan:
    """Compute the merge without touching the filesystem."""
    target = Path(path) if path is not None else client_path(
        client, home=home, cwd=cwd, platform=platform
    )
    existing = target.read_text(encoding="utf-8") if target.exists() else None
    data = _parse(existing or "", target)

    key = root_key(client)
    root = data.setdefault(key, {})
    if not isinstance(root, dict):
        raise InstallError(f"{key!r} in {target} must be an object.")

    if _SERVER_NAME in root and not force:
        raise InstallError(
            f"docharvest is already registered in {target}; "
            "use --force to replace the existing entry."
        )

    root[_SERVER_NAME] = payload(client)
    rendered = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
    return Plan(client=client, path=target, existing=existing, rendered=rendered)


def verify(path: Path, client: str) -> None:
    """Re-read *path* and assert the entry round-trips."""
    data = _parse(path.read_text(encoding="utf-8"), path)
    entry = data.get(root_key(client), {}).get(_SERVER_NAME)
    if not isinstance(entry, dict):
        raise InstallError(f"Verification failed: {_SERVER_NAME} entry missing after write.")
    if entry.get("command") != _COMMAND:
        raise InstallError("Verification failed: unexpected command after write.")
    if list(entry.get("args") or []) != list(_ARGS):
        raise InstallError("Verification failed: unexpected args after write.")


def apply(plan: Plan) -> None:
    """Write atomically, verify, and restore the original bytes on failure."""
    backup = plan.path.read_bytes() if plan.path.exists() else None
    atomic_write_text(plan.path, plan.rendered)
    try:
        verify(plan.path, plan.client)
    except Exception:
        if backup is None:
            try:
                plan.path.unlink()
            except OSError:
                pass
        else:
            atomic_write_text(plan.path, backup.decode("utf-8"))
        raise


def detect(*, home: str | Path | None = None, cwd: str | Path | None = None) -> dict[str, Path | None]:
    """Report-only detection: existing config paths for the v1 family."""
    found: dict[str, Path | None] = {}
    for client in FAMILY_A_CLIENTS:
        try:
            candidate = client_path(client, home=home, cwd=cwd)
        except InstallError:
            candidate = None
        found[client] = candidate if candidate and candidate.exists() else None
    return found
