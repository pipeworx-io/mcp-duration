# mcp-duration

ISO 8601 duration MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1163+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `parse_duration` | Parse an ISO 8601 duration string (e.g. "PT1H30M", "P1Y2M10DT2H") into its components and an approximate total in seconds (keyless, offline). Note: months=30d, years=365d for the estimate. |
| `format_duration` | Convert a number of seconds into an ISO 8601 duration string and a human-readable form (keyless, offline). |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "duration": {
      "url": "https://gateway.pipeworx.io/duration/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1163+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Duration data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
