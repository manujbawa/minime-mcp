# Claude Desktop MCP Configuration

This configuration enables MiniMe-MCP in Claude Desktop application.

## Prerequisites

- Claude Desktop application installed
- Claude Code CLI (for seamless setup)
- MiniMe-MCP server running locally at http://localhost:8000
- Node.js installed (for npx)

## Installation Methods

### Method 1: Using Claude Code CLI (Recommended)

The easiest way to add MiniMe-MCP to Claude Desktop:

```bash
# If you have Claude Code installed
claude mcp add-from-claude-desktop

# This will import all MCP servers from Claude Code to Claude Desktop
```

### Method 2: Manual Configuration

1. Make sure your MiniMe-MCP server is running:
   ```bash
   docker ps -f name=minimemcp
   # If not running, start it with:
   docker run -d \
     --name minimemcp \
     --restart unless-stopped \
     -p 5432:5432 \
     -p 8000:8000 \
     -p 9090:9090 \
     -v minime-mcp-v9:/data \
     -e POSTGRES_PASSWORD=minime_password \
     -e UI_PORT=9090 \
     manujbawa/minimemcp:latest
   ```

2. Add the MiniMe-MCP configuration to Claude Desktop:

   **File location:**
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/claude/claude_desktop_config.json`

   **Configuration for macOS (with Homebrew Node.js):**
   ```json
   {
     "mcpServers": {
       "minime": {
         "command": "/bin/sh",
         "args": ["-c", "PATH=/opt/homebrew/bin:/opt/homebrew/opt/node/bin:/usr/local/bin:/usr/bin:$PATH npx -y minime-mcp"],
         "env": {
           "MINIME_SERVER_URL": "http://localhost:8000",
           "MINIME_DEBUG": "true"
         }
       }
     }
   }
   ```

   **Configuration for other systems:**
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

   **Note**: If you already have other MCP servers configured, add the "minime" entry to your existing "mcpServers" object.

3. Restart Claude Desktop completely (quit and reopen)

## Configuration Options

- `MINIME_SERVER_URL`: URL of your MiniMe-MCP server (default: http://localhost:8000)
- `MINIME_DEBUG`: Enable debug logging (true/false)

## Verification

In Claude Desktop, you should see MiniMe-MCP tools available. Test with:
- "Use the store_memory tool to save this information"
- "Search my memories using the search_memories tool"
- "Get insights about my projects"

## Troubleshooting

### Common Issues

1. **"env: node: No such file or directory" on macOS**
   - This happens because GUI apps on macOS don't inherit shell PATH
   - Use the macOS-specific configuration with `/bin/sh` wrapper shown above
   - Or use Method 1 with Claude Code CLI for automatic setup

2. **MCP tools don't appear**
   - Verify server is running: `curl http://localhost:8000/health`
   - Check Claude Desktop logs in the developer console
   - Ensure you've restarted Claude Desktop after configuration
   - Try the Claude Code CLI import method if manual config fails

3. **Node.js PATH issues**
   - Find your Node.js installation: `which node`
   - Common paths:
     - Homebrew: `/opt/homebrew/bin` or `/opt/homebrew/opt/node/bin`
     - nvm: `~/.nvm/versions/node/*/bin`
     - System: `/usr/local/bin`
   - Add your specific path to the configuration

4. **Permission errors**
   - Ensure the MiniMe-MCP server is accessible at http://localhost:8000
   - Check Docker container is running: `docker ps -f name=minimemcp`