# MCP tool profiles

DocHarvest keeps the default MCP schema small and makes the complete tool set explicit.
Both profiles use the same local library, capture facade, stdio transport, and zero-telemetry behavior.

## Default: `minimal`

Start with:

```bash
docharvest mcp
```

The default profile exposes the core capture and retrieval path:

- `download_docs`
- `search_docs`
- `list_domains`
- `find_docs`
- `read_doc`

This is the recommended profile for clients that charge for tool-schema tokens or display every tool to the model.
`read_doc` and `search_docs(max_tokens=...)` provide bounded responses; the capture writes `docs.md`, `llms.txt`, and `llms-full.txt`.

## Explicit: `full`

Use the complete backwards-compatible tool surface when a workflow needs snapshots, exports, changelogs, or graphs:

```bash
docharvest mcp --profile full
```

The full profile adds:

- `get_doc`
- `diff_versions`
- `list_versions`
- `export_docs`
- `get_changelog`
- `query_doc_graph`
- `get_related_concepts`

Existing client configuration can opt in by adding `--profile`, for example:

```json
{
  "mcpServers": {
    "docharvest": {
      "command": "docharvest",
      "args": ["mcp", "--profile", "full"]
    }
  }
}
```

Unknown profile names fail closed. The server never guesses a larger schema or enables a tool that was not requested.
