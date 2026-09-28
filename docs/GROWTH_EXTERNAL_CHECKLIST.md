# DocHarvest External Growth Checklist

This file is intentionally local and owner-run. The current implementation pass does not mutate GitHub settings, publish listings, upload media, open public PRs, or publish launch posts.

## Repository settings

- [ ] A2 — Open repository Settings → Social preview and verify `assets/social-preview.svg` renders. Capture a screenshot or record the result.
- [ ] A3 — Add the eight audit topics: `ai-agents`, `claude-code`, `cursor`, `codex`, `skills`, `llm`, `ai`, `agent-skills`.
- [ ] A4 — Enable GitHub Discussions after confirming a moderation owner.

Suggested authenticated checks:

```bash
gh api repos/RohannShetty/DocHarvest --jq '{topics: .topics, discussions: .has_discussions}'
gh repo edit RohannShetty/DocHarvest --add-topic ai-agents --add-topic claude-code --add-topic cursor --add-topic codex --add-topic skills --add-topic llm --add-topic ai --add-topic agent-skills
gh api --method PATCH repos/RohannShetty/DocHarvest -f has_discussions=true
```

## Distribution

- [ ] P3 — Publish the checked-in `server.json` to the official MCP Registry.
- [ ] P3 — Submit free listings to Glama, Smithery, mcp.so, and `punkpeye/awesome-mcp-servers`.
- [ ] P3 — Record each resulting listing URL in `docs/PROMOTION_PACKAGE.md`.
- [ ] P4 — Publish the generated showcase artifacts at `/llms.txt`, `/llms-full.txt`, `/index.md`, and per-page `.md` URLs.

## Media and launch

- [ ] A6 — Upload a 60–90 second demo as a GitHub user attachment and replace the placeholder in the README/launch drafts.
- [ ] P9 — Only after P1, P2, P4, and P5 gates pass, publish the coordinated HN, Reddit, X, and blog package.
- [ ] P11 — Enable GitHub Sponsors and keep the sponsor section below the fold.
- [ ] P12 — Have native reviewers approve the Chinese and Japanese README translations before linking them.

## Evidence rules

- Re-run `GROWTH_AUDIT.md` §7.3 before quoting volatile stars, installs, or directory counts.
- Do not report a setting as disabled when the API omits the key; print the actual object keys first.
- Do not mark an external item `DONE` until a third party can open the resulting URL or the owner records the manual verification evidence.
