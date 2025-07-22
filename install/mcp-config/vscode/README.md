# VS Code MCP Configuration

This configuration enables MiniMe-MCP in VS Code through GitHub Copilot Chat.

## Prerequisites

- VS Code version 1.102+ (or VS Code Insiders 1.103+)
- GitHub Copilot Chat extension v0.29+
- **GitHub Organization Policy**: If you're in a GitHub organization, your administrator must enable MCP in the organization's Copilot settings on GitHub
- MiniMe-MCP server running locally at http://localhost:8000

## Installation

### 1. Global MCP Configuration (Recommended)

Create or update the MCP configuration file:

**File location:**
- macOS: `~/Library/Application Support/Code/User/mcp.json`
- Windows: `%APPDATA%\Code\User\mcp.json`
- Linux: `~/.config/Code/User/mcp.json`

**Configuration:**
```json
{
  "mcpServers": {
    "minime": {
      "command": "npx",
      "args": ["-y", "minime-mcp"],
      "env": {
        "MINIME_SERVER_URL": "http://localhost:8000",
        "MINIME_DEBUG": "true"
      }
    }
  }
}
```

### 2. VS Code Settings

Update your VS Code settings:

**File:** `~/Library/Application Support/Code/User/settings.json`

```json
{
    "workbench.settings.applyToAllProfiles": [
        "chat.mcp.enabled"
    ],
    "github.copilot.enable": true,
    "github.copilot.advanced": {},
    "redhat.telemetry.enabled": true
}
```

### 3. Workspace-Specific Configuration (Optional)

For project-specific settings, create:

**File:** `.vscode/mcp.json` in your project root

Use the same format as the global configuration above.

## Important Notes

- The configuration uses `npx -y` to automatically install and run minime-mcp
- MCP servers are configured in `mcp.json`, NOT in `settings.json`
- The format uses `mcpServers` (not `servers` or `chat.mcp.servers`)
- Global configuration applies to all workspaces
- No manual npx commands needed - VS Code starts the MCP server automatically
- **Organization Users**: Ensure your GitHub organization administrator has enabled MCP in Copilot policies

## Verification

1. **Check MiniMe-MCP server is running:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Restart VS Code** after configuration

3. **Test in VS Code:**
   - Open GitHub Copilot Chat (click the chat icon in sidebar)
   - Type a message like "Use MCP tools to search my memories"
   - You should see MiniMe tools being used

## Available Tools

Once configured, these MiniMe-MCP tools are available in Copilot Chat:
- `store_memory` - Store project knowledge
- `search_memories` - Search stored information
- `get_insights` - Get AI-powered insights
- `manage_tasks` - Manage project tasks
- `start_thinking` - Sequential reasoning
- `manage_project` - Project documentation

## Troubleshooting

1. **MCP not available**:
   - Verify VS Code version is 1.102+ (or Insiders 1.103+)
   - Check GitHub Copilot Chat extension is v0.29+
   - For organization users: Contact your GitHub admin to enable MCP in Copilot policies

2. **Tools not appearing**: 
   - Ensure configuration is in `mcp.json`, not `settings.json`
   - Use `mcpServers` key, not `servers`
   - Restart VS Code completely after configuration

3. **Connection errors**:
   - Verify MiniMe server is running: `docker ps -f name=minimemcp`
   - Check server health: `curl http://localhost:8000/health`
   - Enable debug mode: Set `"MINIME_DEBUG": "true"`