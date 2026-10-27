"""Configuration loader for docharvest v7.

Wires TOML configuration into :class:`~docharvest.api.CaptureOptions`
(plan §5: "presets actually feed CaptureOptions defaults; flags override").

Files & precedence (lowest → highest):

1. Built-in :data:`DEFAULTS`
2. Global   ``~/.docharvest/config.toml``
3. Project  ``./docharvest.toml``
4. ``[presets.<name>]`` table from either file
5. CLI flags (applied by the caller on top)

Schema::

    [defaults]                # applied to every capture
    workers        = 8
    timeout        = 20.0
    max_pages      = 0        # 0 = unlimited
    output_mode    = "both"   # both | library | local
    snapshot       = true

    [presets.api-docs]        # a named bundle: one command re-crawls it
    url         = "https://docs.example.com/"
    path_scope  = ["/api/"]
    exclude_paths = []
    site_versions = []        # empty = all detected
    max_pages   = 500

Legacy ``[download]`` / ``[output]`` sections from v6 configs are still
accepted (their leaf keys are flattened into the same namespace).
"""

from __future__ import annotations

import logging
import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from docharvest.paths import PROJECT_CONFIG_FILE_NAME, global_config_path, library_root

logger = logging.getLogger(__name__)

# ── TOML parser: stdlib tomllib (3.11+), fall back to tomli ──
try:
    import tomllib  # type: ignore[attr-defined]
except ModuleNotFoundError:
    try:
        import tomli as tomllib  # type: ignore[no-redef]
    except ModuleNotFoundError:
        tomllib = None  # type: ignore[assignment]

# ── Default configuration values ──
DEFAULTS: dict[str, Any] = {
    "workers": 5,
    "timeout": 20,
    "retry_attempts": 3,
    "output_dir": str(library_root()),
    "max_pages": 0,
    "prefer_md": True,
    "use_llms_txt": True,
    "min_content_chars": 60,
}

GLOBAL_CONFIG_PATH = str(global_config_path())
PROJECT_CONFIG_PATH = f"./{PROJECT_CONFIG_FILE_NAME}"

# Sections whose leaf keys flatten into the option namespace.
_FLATTEN_SECTIONS = frozenset({"defaults", "download", "output", "capture"})
# Keys understood by CaptureOptions.
_CAPTURE_OPTION_KEYS = frozenset({
    "workers", "max_pages", "path_scope", "exclude_paths", "site_versions",
    "output_mode", "local_dir", "snapshot", "timeout", "render",
})


@dataclass
class AppConfig:
    """Merged configuration: scalar values plus named presets."""

    values: dict[str, Any] = field(default_factory=dict)
    presets: dict[str, dict[str, Any]] = field(default_factory=dict)
    sources: list[str] = field(default_factory=list)

    def preset(self, name: str) -> dict[str, Any] | None:
        """Look up a preset by name (case-insensitive), or None."""
        if not name:
            return None
        lowered = name.lower()
        for key, table in self.presets.items():
            if key.lower() == lowered:
                return table
        return None


def config_search_paths() -> list[tuple[str, Path]]:
    """Return ``(label, path)`` pairs in precedence order (low → high)."""
    return [
        ("global", Path(os.path.expanduser(GLOBAL_CONFIG_PATH))),
        ("project", Path(PROJECT_CONFIG_PATH).resolve()),
    ]


def find_config_files() -> list[tuple[str, Path]]:
    """Return only the config files that actually exist (precedence order)."""
    return [(label, p) for label, p in config_search_paths() if p.is_file()]


def _read_toml(path: str | Path) -> dict[str, Any]:
    """Read a TOML file, returning its raw table structure."""
    if tomllib is None:
        logger.warning(
            "No TOML parser available (need Python 3.11+ or tomli). "
            "Config file ignored: %s", path,
        )
        return {}
    try:
        with open(path, "rb") as fh:
            return tomllib.load(fh)
    except OSError as exc:
        logger.warning("Could not read config %s: %s", path, exc)
        return {}
    except Exception as exc:  # noqa: BLE001 — malformed TOML shouldn't crash
        logger.warning("Invalid TOML in %s: %s", path, exc)
        return {}


def _flatten(data: dict[str, Any]) -> tuple[dict[str, Any], dict[str, dict]]:
    """Split raw TOML into ``(flat_values, presets)``.

    Leaf keys of known sections (``[defaults]``, legacy ``[download]`` /
    ``[output]``, bare top-level scalars) are flattened into one namespace;
    ``[presets.<name>]`` tables are collected verbatim.
    """
    flat: dict[str, Any] = {}
    presets: dict[str, dict[str, Any]] = {}

    for key, value in data.items():
        if key == "presets" and isinstance(value, dict):
            for name, table in value.items():
                if isinstance(table, dict):
                    presets[name] = dict(table)
                else:
                    logger.warning("Preset %r is not a table; ignored.", name)
        elif isinstance(value, dict) and key.lower() in _FLATTEN_SECTIONS:
            flat.update(value)
        elif isinstance(value, dict):
            # Unknown table — flatten anyway so custom keys survive round-trips.
            flat.update(value)
        else:
            flat[key] = value

    return flat, presets


def load_full_config(
    *,
    project_path: str | Path | None = None,
    global_path: str | Path | None = None,
) -> AppConfig:
    """Load and merge global + project configuration over :data:`DEFAULTS`.

    Args:
        project_path: Override the project config location (tests).
        global_path: Override the global config location (tests).
    """
    cfg = AppConfig(values=dict(DEFAULTS))

    paths: list[tuple[str, Path]] = []
    paths.append((
        "global",
        Path(os.path.expanduser(str(global_path)))
        if global_path else Path(os.path.expanduser(GLOBAL_CONFIG_PATH)),
    ))
    paths.append((
        "project",
        Path(project_path) if project_path else Path(PROJECT_CONFIG_PATH),
    ))

    for label, path in paths:
        if not path.is_file():
            continue
        flat, presets = _flatten(_read_toml(path))
        cfg.values.update(flat)
        cfg.presets.update(presets)
        cfg.sources.append(f"{label}:{path}")
        logger.info("Loaded %s config from %s", label, path)

    return cfg


def capture_options_from_config(
    cfg: AppConfig,
    *,
    preset: str | None = None,
    cli_overrides: dict[str, Any] | None = None,
):
    """Build :class:`CaptureOptions` from merged config.

    Precedence: built-in defaults < config files < preset < ``cli_overrides``
    (values that are ``None`` mean "not provided" and are skipped).

    Raises:
        KeyError: Unknown preset name.
        ValueError: A preset or override value is invalid.
    """
    from ..api import CaptureOptions  # local import avoids a cycle at module load

    merged: dict[str, Any] = {
        k: v for k, v in cfg.values.items() if k in _CAPTURE_OPTION_KEYS
    }

    preset_table: dict[str, Any] | None = None
    if preset is not None:
        preset_table = cfg.preset(preset)
        if preset_table is None:
            raise KeyError(
                f"Unknown preset {preset!r}. "
                f"Available: {', '.join(sorted(cfg.presets)) or '(none defined)'}"
            )
        for key, value in preset_table.items():
            if key == "url":
                continue  # consumed by the caller as the capture target
            merged[key] = value

    if cli_overrides:
        for key, value in cli_overrides.items():
            if value is None:
                continue  # flag not provided
            merged[key] = value

    def _tuple_of_str(value: Any) -> tuple[str, ...]:
        if value is None:
            return ()
        if isinstance(value, str):
            # Allow comma-separated strings from CLI flags.
            parts = [p.strip() for p in value.split(",")]
            return tuple(p for p in parts if p)
        return tuple(str(v) for v in value)

    max_pages_raw = merged.get("max_pages")
    if max_pages_raw in (None, 0, "", False):
        max_pages: int | None = None
    else:
        max_pages = int(max_pages_raw)
        if max_pages <= 0:
            max_pages = None

    local_dir_raw = merged.get("local_dir")
    output_mode = str(merged.get("output_mode") or "both").lower()

    return CaptureOptions(
        workers=int(merged.get("workers") or 8),
        max_pages=max_pages,
        path_scope=_tuple_of_str(merged.get("path_scope")),
        exclude_paths=_tuple_of_str(merged.get("exclude_paths")),
        site_versions=(
            None if not merged.get("site_versions")
            else _tuple_of_str(merged["site_versions"])
        ),
        output_mode=output_mode if output_mode in ("both", "library", "local")
        else "both",
        local_dir=Path(os.path.expanduser(str(local_dir_raw)))
        if local_dir_raw else None,
        snapshot=bool(merged.get("snapshot", True)),
        timeout=float(merged.get("timeout") or 20.0),
        render=bool(merged.get("render", False)),
    )


# ── Legacy v6 API (kept for backwards compatibility) ────────────────────


def load_config() -> dict[str, Any]:
    """Load and merge configuration from the first found config file.

    Legacy flat-dict view (v6 behaviour): defaults overlaid with whatever
    leaf keys exist in the config files. For presets and typed
    :class:`CaptureOptions`, use :func:`load_full_config`.
    """
    merged = dict(DEFAULTS)
    for _label, path in find_config_files():
        flat, _presets = _flatten(_read_toml(path))
        merged.update(flat)
    return merged


def merge_config(cli_args: dict[str, Any], file_config: dict[str, Any]) -> dict[str, Any]:
    """Merge CLI arguments on top of file-loaded configuration.

    CLI arguments that are ``None`` (meaning "not provided") are ignored
    so the file/default value survives.
    """
    merged = dict(file_config)
    for key, value in cli_args.items():
        if value is not None:
            merged[key] = value
    return merged


_DEFAULT_TOML = """\
# docharvest configuration
# Docs: every value here overrides the built-in default for THIS project
# (this file) or globally (~/.docharvest/config.toml).

[defaults]
# workers     = 8          # parallel fetches
# timeout     = 20.0       # seconds per request
# max_pages   = 0          # 0 = unlimited
# output_mode = "both"     # both | library | local
# snapshot    = true       # snapshot the previous capture before overwriting
# path_scope    = ["/api/"]          # only pages under these URL prefixes
# exclude_paths = ["/forum/"]        # skip these even inside the scope

# Legacy v6 sections are still accepted:
# [download]
# [output]

[presets]
# [presets.api-docs]
# url           = "https://docs.example.com/"
# path_scope    = ["/api/"]
# exclude_paths = []
# site_versions = []       # empty = all detected versions
# max_pages     = 500
"""


def init_default_config(path: str | None = None) -> str:
    """Write a starter config file so users can edit it.

    Defaults to the global location (``~/.docharvest/config.toml``);
    pass an explicit path to seed a project file instead. Never overwrites
    an existing file.
    """
    if path is None:
        path = os.path.expanduser(GLOBAL_CONFIG_PATH)

    dest = Path(path)
    dest.parent.mkdir(parents=True, exist_ok=True)

    if dest.exists():
        logger.info("Config file already exists at %s — skipping write.", dest)
        return str(dest.resolve())

    dest.write_text(_DEFAULT_TOML, encoding="utf-8")
    logger.info("Wrote default config to %s", dest)
    return str(dest.resolve())


# ── Writer: merge values back into a config file ───────────────────────

_KEY_RE = re.compile(r"^[A-Za-z0-9_-]+$")
_HEADER_RE = re.compile(r"^\s*\[([^\[\]]+)\]\s*(?:#.*)?$")


def format_toml_value(value: Any) -> str:
    """Render a Python value as a TOML literal.

    Only the shapes a config file actually holds are supported: booleans,
    numbers, strings, and flat arrays of those. Anything else raises
    ``TypeError`` rather than silently writing a broken file.
    """
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return repr(value)
    if isinstance(value, str):
        escaped = value.replace("\\", "\\\\").replace('"', '\\"')
        return f'"{escaped}"'
    if isinstance(value, (list, tuple)):
        return "[" + ", ".join(format_toml_value(item) for item in value) + "]"
    raise TypeError(f"Cannot write {type(value).__name__} to a config file")


def _section_spans(lines: list[str]) -> list[tuple[str, int, int]]:
    """Return ``(name, header_index, end_index)`` for every table header."""
    spans: list[list[Any]] = []
    for index, line in enumerate(lines):
        match = _HEADER_RE.match(line)
        if match:
            spans.append([match.group(1).strip(), index, len(lines)])
    for index in range(len(spans) - 1):
        spans[index][2] = spans[index + 1][1]
    return [(name, start, end) for name, start, end in spans]


def _append_to_section(lines: list[str], section: str, entries: list[str]) -> None:
    """Append *entries* to *section*, creating the table when absent."""
    for name, start, end in _section_spans(lines):
        if name.lower() != section.lower():
            continue
        # Keep new keys inside the block, above its trailing blank lines and
        # comments, so a visually grouped table stays grouped.
        insert_at = end
        while insert_at > start + 1 and (
            not lines[insert_at - 1].strip() or lines[insert_at - 1].lstrip().startswith("#")
        ):
            insert_at -= 1
        lines[insert_at:insert_at] = entries
        return
    if lines and lines[-1].strip():
        lines.append("")
    lines.append(f"[{section}]")
    lines.extend(entries)


def merge_into_toml(text: str, values: dict[str, Any], *, section: str = "defaults") -> str:
    """Merge *values* into TOML *text*, preserving comments and other tables.

    A key that already exists in any flattened capture section (``[defaults]``
    or the legacy ``[download]`` / ``[output]`` / ``[capture]`` tables) is
    updated where it lives — writing a second copy into ``[defaults]`` would
    lose to the legacy section whenever that section appears later in the file.
    Remaining keys are appended to *section*.
    """
    lines = text.splitlines()
    rendered = {key: f"{key} = {format_toml_value(value)}" for key, value in values.items()}
    pending = dict(rendered)

    for name, start, end in _section_spans(lines):
        if name.lower() not in _FLATTEN_SECTIONS:
            continue
        for index in range(start + 1, end):
            for key in list(pending):
                if re.match(rf"^\s*{re.escape(key)}\s*=", lines[index]):
                    lines[index] = pending.pop(key)
                    break

    if pending:
        _append_to_section(lines, section, [rendered[key] for key in values if key in pending])

    return "\n".join(lines) + "\n"


def save_config_values(values: dict[str, Any], *, path: str | Path | None = None) -> str:
    """Merge *values* into the ``[defaults]`` table of a config file.

    Defaults to the global config (``~/.docharvest/config.toml``) and creates
    it when missing. Existing comments, presets, and unknown keys survive
    untouched; only the keys given here are rewritten.

    Args:
        values: Config keys to set. ``None`` values are skipped, so callers can
            pass a partially filled form.
        path: Override the destination file (project config, tests).

    Returns:
        The absolute path written.

    Raises:
        ValueError: A key contains characters TOML bare keys cannot hold.
        TypeError: A value is a shape the writer does not support.
    """
    dest = Path(os.path.expanduser(str(path))) if path else Path(os.path.expanduser(GLOBAL_CONFIG_PATH))

    cleaned: dict[str, Any] = {}
    for key, value in values.items():
        if not isinstance(key, str) or not _KEY_RE.match(key):
            raise ValueError(f"Invalid config key: {key!r}")
        if value is None:
            continue
        format_toml_value(value)  # validate before touching the file
        cleaned[key] = value

    if not cleaned:
        return str(dest.resolve())

    existing = dest.read_text(encoding="utf-8") if dest.is_file() else ""
    updated = merge_into_toml(existing, cleaned)
    dest.parent.mkdir(parents=True, exist_ok=True)

    from docharvest.storage.manager import atomic_write_text

    atomic_write_text(dest, updated)
    logger.info("Saved %d config key(s) to %s", len(cleaned), dest)
    return str(dest.resolve())
