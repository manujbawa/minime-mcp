# MCP Configuration Files

This directory contains Model Context Protocol (MCP) configuration files for various IDEs and applications that support MCP.

## Prerequisites

1. **Install MiniMe-MCP Client**:
   ```bash
   npm install -g @minimemcp/mcp-client
   ```

2. **Start MiniMe-MCP Server**:
   ```bash
   docker run -d \
     --name minime-mcp \
     -p 5432:5432 \
     -p 8000:8000 \
     -p 9000:9000 \
     -v minime_data:/var/lib/postgresql/data \
     minimemcp:latest-v2
   ```

3. **Verify Installation**:
   ```bash
   # Check client installation
   minime-mcp --version
   
   # Check server health
   curl http://localhost:8000/health
   ```

## Available Configurations

### 📝 Cursor
- **Directory**: `cursor/`
- **Config File**: `mcp.json`
- **Status**: ✅ Fully Supported

### 🔷 Visual Studio Code
- **Directory**: `vscode/`
- **Config File**: `mcp.json` / `settings.json`
- **Status**: ✅ Supported via GitHub Copilot extension
- **Note**: MCP support is through GitHub Copilot, not native VS Code

### 🤖 Claude Desktop
- **Directory**: `claude-code/`
- **Config File**: `claude_desktop_config.json`
- **Status**: ✅ Fully Supported

## Quick Setup

### For Cursor:
```bash
cp cursor/mcp.json ~/.cursor/mcp.json
```

### For VS Code (GitHub Copilot):
```bash
# Option 1: Auto-discovery (if Cursor is configured)
cp cursor/mcp.json ~/.cursor/mcp.json
# GitHub Copilot in VS Code will automatically discover MCP servers

# Option 2: Direct Copilot configuration
# Add to VS Code settings.json:
# "chat.mcp.discovery.enabled": true
# "chat.mcp.servers": { "minime-mcp": { "command": "minime-mcp", ... } }
```

### For Claude Desktop:
```bash
# macOS
cp claude-code/claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

## Configuration Options

All configurations use the same environment variables:

- `MINIME_SERVER_URL`: MiniMe-MCP server URL (default: `http://localhost:8000`)
- `MINIME_DEBUG`: Enable debug logging (`true`/`false`)

## Available MCP Tools

Once configured, these tools will be available in your IDE:

1. **store_memory** - Store information with auto-tagging and ML enrichment
2. **search_memories** - Search using semantic, keyword, or hybrid search
3. **get_insights** - Get AI-powered insights and patterns
4. **start_thinking** - Begin sequential reasoning process
5. **add_thought** - Add thoughts to reasoning chain
6. **manage_tasks** - Create and manage tasks
7. **manage_project** - Project documentation management

## Important Notes

- **VS Code**: MCP support is provided by the GitHub Copilot extension, not VS Code itself
- **Cursor**: Native MCP support built into the IDE
- **Claude Desktop**: Native MCP support built into the application
- **Auto-discovery**: GitHub Copilot can discover MCP servers from Cursor's configuration