# Claude Desktop MCP Configuration

This configuration enables MiniMe-MCP in Claude Desktop application.

## Installation

1. First, install the MiniMe-MCP client globally:
   ```bash
   npm install -g @minimemcp/mcp-client
   ```

2. Make sure your MiniMe-MCP server is running:
   ```bash
   docker ps -f name=minime-mcp
   # If not running, start it with:
   docker run -d \
     --name minime-mcp \
     -p 5432:5432 \
     -p 8000:8000 \
     -p 9000:9000 \
     -v minime_data:/var/lib/postgresql/data \
     minimemcp:latest-v2
   ```

3. Copy the configuration file to Claude Desktop's config directory:
   ```bash
   # macOS
   cp claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Windows
   # Copy to: %APPDATA%\Claude\claude_desktop_config.json
   
   # Linux
   # Copy to: ~/.config/claude/claude_desktop_config.json
   ```

4. Restart Claude Desktop

## Configuration Options

- `MINIME_SERVER_URL`: URL of your MiniMe-MCP server (default: http://localhost:8000)
- `MINIME_DEBUG`: Enable debug logging (true/false)

## Verification

In Claude Desktop, you should see MiniMe-MCP tools available. Test with:
- "Use the store_memory tool to save this information"
- "Search my memories using the search_memories tool"
- "Get insights about my projects"

## Troubleshooting

If MCP tools don't appear:
1. Check if minime-mcp is installed: `which minime-mcp`
2. Verify server is running: `curl http://localhost:8000/health`
3. Check Claude Desktop logs for errors
4. Restart Claude Desktop completely after adding the configuration