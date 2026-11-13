# Spike 029 — Ingest-side untrusted-content screening

Status: branch-only spike (`advisor/029-ingest-screening`). Not merged.
Scope: plan `plans/029-ingest-screening-spike.md`.

## 1. Threat model and non-goals

DocHarvest captures arbitrary third-party pages and hands them to agents. The
screen looks for two classes of *shape*, not for intent:

| Class | Examples of the shape | Confidence |
|---|---|---|
| `injection` | “ignore previous instructions”, “reveal the system prompt”, `<\|im_start\|>` role tokens, a `system:` line, “send the API key to …”, “call tool read_doc …”, zero-width/bidi controls | high / medium |
| `secret` | OpenAI-style `sk-…`, AWS `AKIA…`, GitHub `ghp_…`, Slack `xox…`, Google `AIza…`, PEM private-key blocks | high |

Deliberately **not** caught: malicious prose that avoids these shapes,
persuasion, encoded or split payloads, and novel instructions written in a
language the pattern table does not cover. This is a smoke detector, not a
proof of safety.

The screen is **flag-first**. Default mode never rewrites a byte; credential
redaction is opt-in. A document *about* prompt injection must not be silently
mangled — archival fidelity is the product.

## 2. Where it runs

At the normalize boundary in `api.capture()`: after pages are normalized and
filtered, before `publish()` writes the page tree/manifest/search index. One
pass per capture, on `CapturedPage.content`.

`publish()` accepts an optional `security_findings` list; it is passed to
`build_manifest()` only. Default output is byte-identical when no findings
exist.

## 3. Actions

| Action | Default | Behaviour |
|---|---|---|
| `flag` | **on** | Findings become `CaptureResult.warnings`; manifest gets a `## Security findings` section; MCP `read_doc` adds `security_flags`; content unchanged. |
| `redact` | off (`DOCHARVEST_SCREEN_REDACT=1`) | Credential-shaped strings are masked in the written page/book content. Injection text is never rewritten. |
| `quarantine-file` | not implemented | Proposed: ship the page under `pages-quarantine/` with a manifest note. Needs a storage-layout review; left out of this prototype. |
| `off` | — | `DOCHARVEST_SCREEN=off` disables screening entirely. |

## 4. Surfacing

Warnings (one line per class):

> Screening flagged 2 prompt-injection signal(s) on 2 page(s): https://… .
> Content was not modified.

Manifest (`llms.txt`, both local and library copies):

```
## Security findings

- injection/instruction_override (high) — https://…: line 3 — `Ignore all previous instructions`
- secret/openai_key (high) — https://…: line 2 — `sk-t…0000`

> These are heuristic flags, not a verdict. Review before feeding the content to an agent.
```

MCP `read_doc` adds an additive `security_flags: [{class, kind, confidence,
line}]` key only when something is found. Consumers that ignore unknown keys
are unaffected.

Failure policy: if the scanner raises, the capture continues, content is
unchanged, and a `Screening unavailable: …` warning is emitted. Screening never
fails a capture and never blocks a write.

## 5. Evaluation (fixture corpus)

`tests/fixtures/screening/` holds 3 malicious pages, 3 benign pages that quote
or describe injection material, and 2 secret-bearing pages.

- Injection recall: 3/3.
- Benign false positives: at most 1 (the precision lever is ignoring matches
  inside fenced code blocks and blockquotes by default).
- Secret recall: 2/2.
- `flag` mode leaves every fixture byte-identical; `redact` removes only the
  secret strings.

The fixture corpus is the regression bed. Any pattern addition must keep the
benign fixtures green.

## What SHA-256 still means

The manifest/store hash authenticates the bytes DocHarvest wrote. It says
nothing about whether those bytes are safe to follow. This screen is heuristic
and is reported separately; the two claims must stay separate in docs.

## Follow-ups

1. Decide whether `flag` should become the documented default for release
   (the prototype defaults to it; `off` is one env var away).
2. Design `quarantine-file` with a storage-layout review.
3. Extend the pattern table from real incident reports; keep the corpus green.
4. Consider surfacing findings in the TUI diagnostics surface (the GUI already
   displays `CaptureResult.warnings`).
