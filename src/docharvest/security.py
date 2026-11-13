"""Flag-first screening for untrusted captured documentation.

The screen is deliberately *additive*: by default it reports findings and
never rewrites a byte. Redaction of credential-shaped strings is opt-in via
``DOCHARVEST_SCREEN_REDACT=1``, and ``DOCHARVEST_SCREEN=off`` disables the
whole pass.

What this catches (pattern + heuristic classes):

- ``injection`` — instruction-override phrasing, fake role/system markers,
  zero-width/bidi control characters used to hide text from readers.
- ``secret`` — credential-shaped strings (provider token prefixes, private
  key blocks).

What it does not catch, by design: semantically malicious prose that avoids
the patterns, encoded payloads beyond the scanner's depth, and natural-language
persuasion. Matches inside fenced code blocks and blockquotes are ignored for
the injection class, because documentation *about* prompt injection routinely
quotes payloads; that is the main precision lever.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass, field, replace
from typing import Iterable

# ── Pattern tables (data-driven; extend without touching the scanner) ──

_INJECTION_PATTERNS: list[tuple[str, re.Pattern[str], str]] = [
    (
        "instruction_override",
        re.compile(
            r"\b(ignore|disregard|forget)\b[^\n]{0,40}\b"
            r"(previous|prior|above|earlier)\b[^\n]{0,40}\b"
            r"(instructions?|prompts?|rules?|directives?)\b",
            re.IGNORECASE,
        ),
        "high",
    ),
    (
        "system_prompt_probe",
        re.compile(
            r"\b(reveal|print|show|output|repeat)\b[^\n]{0,30}\b"
            r"(system prompt|developer message|hidden instructions?)\b",
            re.IGNORECASE,
        ),
        "high",
    ),
    (
        "fake_role_marker",
        re.compile(r"<\|(im_start|im_end|system|assistant|user)\|>", re.IGNORECASE),
        "high",
    ),
    (
        "fake_role_line",
        re.compile(r"^\s*(system|developer)\s*:\s*\S", re.IGNORECASE | re.MULTILINE),
        "medium",
    ),
    (
        "exfiltration_directive",
        re.compile(
            r"\b(send|post|upload|exfiltrate)\b[^\n]{0,40}\b"
            r"(api[ _-]?key|token|credentials?|secrets?)\b",
            re.IGNORECASE,
        ),
        "high",
    ),
    (
        "tool_directive",
        re.compile(
            r"\b(call|invoke|run)\b[^\n]{0,20}\b(tool|function)\b[^\n]{0,20}\b"
            r"(read_doc|download_docs|search_docs)\b",
            re.IGNORECASE,
        ),
        "medium",
    ),
]

_SECRET_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("openai_key", re.compile(r"\bsk-[A-Za-z0-9]{20,}\b")),
    ("aws_access_key", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("github_token", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{30,}\b")),
    ("slack_token", re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}\b")),
    ("google_api_key", re.compile(r"\bAIza[0-9A-Za-z\-_]{35}\b")),
    (
        "private_key_block",
        re.compile(
            r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----.*?"
            r"-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
            re.DOTALL,
        ),
    ),
]

# Zero-width and bidi controls used to hide text from a human reader.
_HIDDEN_CHARS = re.compile("[\u200b-\u200f\u202a-\u202e\u2066-\u2069]")

_INJECTION_CLASSES = {name for name, _rx, _conf in _INJECTION_PATTERNS}

_FENCE_RE = re.compile(r"```.*?```", re.DOTALL)
_QUOTE_RE = re.compile(r"^\s*>.*$", re.MULTILINE)

#: Modes: ``flag`` (default) reports only; ``off`` skips the pass.
_VALID_MODES = {"flag", "off"}


@dataclass(frozen=True)
class Finding:
    """One screening hit. ``snippet`` never contains the full secret."""

    cls: str  # injection | secret
    kind: str  # e.g. instruction_override, openai_key
    confidence: str  # high | medium
    url: str
    line: int
    snippet: str


@dataclass
class ScreeningResult:
    """Pages (possibly redacted) plus the findings and warning strings."""

    pages: list = field(default_factory=list)
    findings: list[Finding] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    @property
    def flagged(self) -> int:
        return len({f.url for f in self.findings})

    def manifest_findings(self) -> list[dict]:
        return [
            {
                "class": f.cls,
                "kind": f.kind,
                "confidence": f.confidence,
                "url": f.url,
                "line": f.line,
                "snippet": f.snippet,
            }
            for f in self.findings
        ]


def screen_mode() -> str:
    """Return the active mode. Anything unrecognized falls back to ``flag``."""
    mode = (os.environ.get("DOCHARVEST_SCREEN") or "flag").strip().lower()
    return mode if mode in _VALID_MODES else "flag"


def redact_enabled() -> bool:
    """Redaction is opt-in and off in every default path."""
    return (os.environ.get("DOCHARVEST_SCREEN_REDACT") or "").strip() == "1"


def _strip_ignored_for_injection(text: str) -> str:
    """Blank fenced blocks and blockquotes, preserving line numbers."""
    def blank(match: re.Match[str]) -> str:
        return "\n" * match.group(0).count("\n")

    without_fences = _FENCE_RE.sub(blank, text)
    return _QUOTE_RE.sub(lambda m: " " * len(m.group(0)), without_fences)


def _line_of(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def _mask_secret(value: str) -> str:
    value = value.strip()
    if len(value) <= 8:
        return "***"
    return f"{value[:4]}…{value[-4:]}"


def _redact_value(value: str) -> str:
    value = value.strip()
    if len(value) <= 8:
        return "[REDACTED]"
    return f"{value[:4]}[REDACTED]{value[-4:]}"


def scan_text(url: str, content: str, *, ignore_code_blocks: bool = True) -> list[Finding]:
    """Scan one page/body and return its findings (never mutates *content*)."""
    findings: list[Finding] = []
    if not content:
        return findings

    visible = _strip_ignored_for_injection(content) if ignore_code_blocks else content
    for kind, pattern, confidence in _INJECTION_PATTERNS:
        haystack = visible if kind in _INJECTION_CLASSES else content
        for match in pattern.finditer(haystack):
            snippet = match.group(0).strip().replace("\n", " ")[:120]
            findings.append(
                Finding(
                    cls="injection",
                    kind=kind,
                    confidence=confidence,
                    url=url,
                    line=_line_of(haystack, match.start()),
                    snippet=snippet,
                )
            )

    hidden = _HIDDEN_CHARS.search(content)
    if hidden:
        findings.append(
            Finding(
                cls="injection",
                kind="hidden_characters",
                confidence="high",
                url=url,
                line=_line_of(content, hidden.start()),
                snippet=f"{hidden.group(0)!r} at column {hidden.start()}",
            )
        )

    for kind, pattern in _SECRET_PATTERNS:
        for match in pattern.finditer(content):
            findings.append(
                Finding(
                    cls="secret",
                    kind=kind,
                    confidence="high",
                    url=url,
                    line=_line_of(content, match.start()),
                    snippet=_mask_secret(match.group(0)),
                )
            )

    return findings


def redact_text(content: str) -> str:
    """Replace credential-shaped strings; used only when redaction is opted in."""
    redacted = content
    for _kind, pattern in _SECRET_PATTERNS:
        redacted = pattern.sub(lambda m: _redact_value(m.group(0)), redacted)
    return redacted


def screen_pages(pages: Iterable, *, redact: bool | None = None) -> ScreeningResult:
    """Screen captured pages at the normalize boundary.

    ``pages`` are ``CapturedPage`` objects (``url``/``title``/``content``).
    In ``off`` mode the input is returned untouched with no findings.
    """
    pages = list(pages)
    if screen_mode() == "off":
        return ScreeningResult(pages=pages)

    do_redact = redact_enabled() if redact is None else redact
    result = ScreeningResult(pages=[])
    for page in pages:
        findings = scan_text(page.url, page.content)
        result.findings.extend(findings)
        if do_redact and any(f.cls == "secret" for f in findings):
            page = replace(page, content=redact_text(page.content))
        result.pages.append(page)

    for cls, label in (("injection", "prompt-injection"), ("secret", "credential")):
        hits = [f for f in result.findings if f.cls == cls]
        if hits:
            urls = sorted({f.url for f in hits})
            shown = ", ".join(urls[:3]) + ("…" if len(urls) > 3 else "")
            result.warnings.append(
                f"Screening flagged {len(hits)} {label} signal(s) on "
                f"{len(urls)} page(s): {shown}. Content was not modified"
                + (" except credential redaction." if do_redact and cls == "secret" else ".")
            )
    return result
