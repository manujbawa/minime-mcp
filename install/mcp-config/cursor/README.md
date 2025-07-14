# Cursor MCP Configuration

This configuration enables MiniMe-MCP in Cursor IDE.

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

3. Copy the configuration file to Cursor's config directory:
   ```bash
   # macOS
   cp mcp.json ~/.cursor/mcp.json
   
   # Windows
   # Copy to: %APPDATA%\Cursor\mcp.json
   
   # Linux
   # Copy to: ~/.config/cursor/mcp.json
   ```

4. Restart Cursor

## Configuration Options

- `MINIME_SERVER_URL`: URL of your MiniMe-MCP server (default: http://localhost:8000)
- `MINIME_DEBUG`: Enable debug logging (true/false)

## Verification

In Cursor, you should see MiniMe-MCP tools available in the AI assistant. Test with:
- "Use the store_memory tool to save this information"
- "Search my memories using the search_memories tool"
- "Get insights about my projects"

## Troubleshooting

If MCP tools don't appear:
1. Check if minime-mcp is installed: `which minime-mcp`
2. Verify server is running: `curl http://localhost:8000/health`
3. Restart Cursor completely after adding the configuration