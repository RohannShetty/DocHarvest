"""MCP client configuration writers and deeplink generators.

The installer deliberately models configuration *families* rather than making
one bespoke writer per client.  Client paths and root keys stay in a small,
reviewable table so an unsupported or unverified client fails closed.
"""
from __future__ import annotations

import base64
import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Mapping
from urllib.parse import quote


@dataclass(frozen=True)
class ServerSpec:
    """The local or remote server registration emitted for a client."""

    command: str = "docharvest"
    args: tuple[str, ...] = ("mcp",)
    env: Mapping[str, str] = field(default_factory=dict)
    url: str | None = None

    @property
    def remote(self) -> bool:
        return self.url is not None


@dataclass(frozen=True)
class ClientSpec:
    """Known configuration contract for one MCP client."""

    name: str
    family: str
    paths: tuple[str, ...]
    key: str = "mcpServers"
    supports_remote: bool = True
    deeplink_host: str | None = None
    command_hint: str | None = None


_CLIENTS: dict[str, ClientSpec] = {
    "claude-desktop": ClientSpec("claude-desktop", "json", ("~/.config/Claude/claude_desktop_config.json",)),
    "claude-code": ClientSpec("claude-code", "json", ("~/.claude.json",)),
    "cursor": ClientSpec("cursor", "json", (".cursor/mcp.json",)),
    "cursor-cli": ClientSpec("cursor-cli", "json", (".cursor/mcp.json",)),
    "vscode": ClientSpec("vscode", "json", (".vscode/mcp.json",), key="servers"),
    "copilot-cli": ClientSpec("copilot-cli", "json", ("~/.copilot/mcp-config.json",)),
    "qwen-code": ClientSpec("qwen-code", "json", ("~/.qwen/settings.json",)),
    "zoo-code": ClientSpec("zoo-code", "json", (".roo/mcp.json",)),
    "warp": ClientSpec("warp", "json", ("~/.warp/.mcp.json",)),
    "junie": ClientSpec("junie", "json", (".junie/mcp/mcp.json", "~/.junie/mcp/mcp.json")),
    "gemini": ClientSpec("gemini", "json", ("~/.gemini/settings.json",)),
    "antigravity": ClientSpec("antigravity", "json", ("~/.gemini/config/mcp_config.json",)),
    "openhands": ClientSpec("openhands", "json", ("~/.openhands/mcp.json",)),
    "firebase-studio": ClientSpec("firebase-studio", "json", (".idx/mcp.json",)),
    "tabnine": ClientSpec("tabnine", "json", (".tabnine/mcp_servers.json",)),
    "kiro": ClientSpec("kiro", "json", (".kiro/settings/mcp.json",), deeplink_host="kiro"),
    "kilo-code": ClientSpec("kilo-code", "a_prime", ("~/.config/kilo/kilo.jsonc",), key="mcp"),
    "opencode": ClientSpec("opencode", "a_prime", ("opencode.json",), key="mcp"),
    "posit": ClientSpec("posit", "a_prime", ("~/.posit/assistant/settings.json",), key="mcpServers"),
    "codex": ClientSpec("codex", "toml", ("~/.codex/config.toml",), key="mcp_servers"),
    "mistral-vibe": ClientSpec("mistral-vibe", "toml", ("~/.vibe/config.toml",), key="mcp_servers"),
    "grok": ClientSpec("grok", "toml", ("~/.grok/config.toml",), key="mcp_servers"),
    "goose": ClientSpec("goose", "yaml", ("~/.config/goose/config.yaml",), key="extensions"),
    "continue": ClientSpec("continue", "yaml", (".continue/config.yaml",), key="mcpServers"),
    "trae": ClientSpec("trae", "deeplink", (), deeplink_host="trae"),
    "chatbox": ClientSpec("chatbox", "deeplink", (), deeplink_host="chatbox"),
    "raycast": ClientSpec("raycast", "deeplink", (), deeplink_host="raycast"),
    "msty": ClientSpec("msty", "deeplink", (), deeplink_host="msty"),
    "amazon-q-cli": ClientSpec(
        "amazon-q-cli", "command", (), command_hint="qchat mcp add docharvest -- docharvest mcp"
    ),
}

_ALIASES = {
    "claude": "claude-code",
    "claude-desktop": "claude-desktop",
    "copilot": "copilot-cli",
    "qwen": "qwen-code",
    "kilo": "kilo-code",
    "zoo": "zoo-code",
    "amazon-q": "amazon-q-cli",
}


def client_names() -> tuple[str, ...]:
    """Return supported client ids in stable order."""
    return tuple(sorted(_CLIENTS))


def get_client(name: str) -> ClientSpec:
    """Resolve a client id or raise a useful error for unknown clients."""
    normalized = name.strip().lower()
    normalized = _ALIASES.get(normalized, normalized)
    try:
        return _CLIENTS[normalized]
    except KeyError as exc:
        choices = ", ".join(client_names())
        raise ValueError(f"Unsupported MCP client {name!r}. Choose one of: {choices}") from exc


def _local_payload(spec: ServerSpec) -> dict[str, object]:
    if spec.remote:
        raise ValueError("A remote ServerSpec cannot be rendered as a local config")
    payload: dict[str, object] = {"command": spec.command}
    if spec.args:
        payload["args"] = list(spec.args)
    if spec.env:
        payload["env"] = dict(spec.env)
    return payload


def _a_prime_payload(spec: ServerSpec) -> dict[str, object]:
    if spec.remote:
        payload: dict[str, object] = {"type": "remote", "url": spec.url}
    else:
        payload = {"type": "local", "command": [spec.command, *spec.args]}
        if spec.env:
            payload["environment"] = dict(spec.env)
    return payload


def _standard_payload(spec: ServerSpec) -> dict[str, object]:
    if spec.remote:
        return {"url": spec.url}
    return _local_payload(spec)


def _strip_jsonc(text: str) -> str:
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    text = re.sub(r"(^|\s)//.*?$", r"\1", text, flags=re.MULTILINE)
    return re.sub(r",\s*([}\]])", r"\1", text)


def _parse_json(text: str, *, jsonc: bool = False) -> dict[str, object]:
    if not text.strip():
        return {}
    raw = _strip_jsonc(text) if jsonc else text
    try:
        value = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Existing configuration is not valid JSON{'C' if jsonc else ''}: {exc}") from exc
    if not isinstance(value, dict):
        raise ValueError("Existing configuration root must be an object")
    return value


def _render_json(client: ClientSpec, spec: ServerSpec, existing: str | None) -> str:
    data = _parse_json(existing or "", jsonc=client.family == "a_prime")
    root = data.setdefault(client.key, {})
    if not isinstance(root, dict):
        raise ValueError(f"Configuration key {client.key!r} must contain an object")
    root["docharvest"] = _a_prime_payload(spec) if client.family == "a_prime" else _standard_payload(spec)
    return json.dumps(data, indent=2, ensure_ascii=False) + "\n"


def _toml_value(value: object) -> str:
    if isinstance(value, str):
        return json.dumps(value)
    if isinstance(value, (list, tuple)):
        return "[" + ", ".join(_toml_value(item) for item in value) + "]"
    if isinstance(value, Mapping):
        return "{" + ", ".join(f"{k} = {_toml_value(v)}" for k, v in value.items()) + "}"
    raise TypeError(f"Unsupported TOML value: {value!r}")


def _render_toml(
    client: ClientSpec, spec: ServerSpec, existing: str | None, *, force: bool = False
) -> str:
    text = (existing or "").rstrip()
    duplicate = re.compile(r"(?ms)^\[mcp_servers\.docharvest\]\s*$.*?(?=^\[|\Z)")
    if duplicate.search(text):
        if not force:
            raise ValueError("docharvest is already registered in this TOML file; use --force to replace it")
        text = duplicate.sub("", text).rstrip()
    text += "\n\n" if text else ""
    if spec.remote:
        lines = ["[mcp_servers.docharvest]", f"url = {_toml_value(spec.url or '')}"]
    else:
        lines = [
            "[mcp_servers.docharvest]",
            f"command = {_toml_value(spec.command)}",
            f"args = {_toml_value(spec.args)}",
        ]
        if spec.env:
            lines.append(f"env = {_toml_value(spec.env)}")
    return text + "\n".join(lines) + "\n"


def _yaml_scalar(value: object) -> str:
    if isinstance(value, str):
        return json.dumps(value)
    if isinstance(value, (list, tuple)):
        return "[" + ", ".join(_yaml_scalar(v) for v in value) + "]"
    raise TypeError(f"Unsupported YAML value: {value!r}")


def _render_yaml(
    client: ClientSpec, spec: ServerSpec, existing: str | None, *, force: bool = False
) -> str:
    text = (existing or "").rstrip()
    duplicate = re.compile(r"(?ms)^  docharvest:\s*$.*?(?=^  \S|\Z)")
    if duplicate.search(text):
        if not force:
            raise ValueError("docharvest is already registered in this YAML file; use --force to replace it")
        text = duplicate.sub("", text).rstrip()
    block = [client.key + ":", "  docharvest:", "    name: docharvest"]
    if spec.remote:
        block.append(f"    uri: {_yaml_scalar(spec.url or '')}")
    else:
        block.extend(
            [
                "    type: stdio",
                f"    cmd: {_yaml_scalar(spec.command)}",
                f"    args: {_yaml_scalar(spec.args)}",
            ]
        )
        if spec.env:
            block.append("    env:")
            block.extend(f"      {key}: {_yaml_scalar(value)}" for key, value in spec.env.items())
    if text:
        return text + "\n" + "\n".join(block) + "\n"
    return "\n".join(block) + "\n"


def render_config(
    client: ClientSpec,
    spec: ServerSpec,
    existing: str | None = None,
    *,
    force: bool = False,
) -> str:
    """Render a merged client config without touching the filesystem."""
    if client.family in {"json", "a_prime"}:
        return _render_json(client, spec, existing)
    if client.family == "toml":
        return _render_toml(client, spec, existing, force=force)
    if client.family == "yaml":
        return _render_yaml(client, spec, existing, force=force)
    raise ValueError(f"Client family {client.family!r} is not writable")


def build_deeplink(host: str, spec: ServerSpec) -> str:
    """Build a host-specific install link without embedding credentials."""
    if spec.remote:
        payload: dict[str, object] = {"url": spec.url}
    else:
        payload = {"command": spec.command, "args": list(spec.args)}
    encoded = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).decode().rstrip("=")
    templates = {
        "trae": "trae://mcp-import?config={}",
        "chatbox": "chatbox://mcp/install?server={}",
        "raycast": "raycast://extensions/mcp/install?config={}",
        "msty": "msty://mcp/import?config={}",
        "kiro": "kiro://mcp/install?config={}",
    }
    try:
        return templates[host].format(quote(encoded, safe=""))
    except KeyError as exc:
        raise ValueError(f"Unsupported deeplink host {host!r}") from exc


def target_path(client: ClientSpec, *, cwd: Path | None = None) -> Path | None:
    """Return the first writable path, or ``None`` for UI/command clients."""
    if not client.paths:
        return None
    base = (cwd or Path.cwd()).resolve()
    candidate = Path(client.paths[0]).expanduser()
    return candidate if candidate.is_absolute() else base / candidate
