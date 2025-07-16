# Visual Studio Code MCP Configuration

✅ **Important Clarification**: MCP support in VS Code is provided by the **GitHub Copilot extension**, not VS Code itself.

## Current Status

**GitHub Copilot** in VS Code has MCP support that can:
- Auto-discover MCP servers from Cursor's configuration
- Use the same MCP tools as Cursor
- Work with MiniMe-MCP through the Copilot extension

**Note**: This is Copilot's MCP integration, not native VS Code MCP support.

## Installation Options

### Option 1: Auto-Discovery from Cursor (Recommended)

If you have Cursor installed with MiniMe-MCP configured, GitHub Copilot in VS Code can automatically discover and use the same MCP configuration:

1. **Install GitHub Copilot extension** in VS Code (if not already installed)

2. **Install the MiniMe-MCP client globally**:
   ```bash
   npm install -g @minimemcp/mcp-client
   ```

3. **Make sure your MiniMe-MCP server is running**:
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

4. **Ensure Cursor is configured with MiniMe-MCP**:
   ```bash
   # Check if Cursor config exists
   ls ~/.cursor/mcp.json
   
   # If not, copy our config
   cp cursor/mcp.json ~/.cursor/mcp.json
   ```

5. **GitHub Copilot in VS Code should automatically discover** the MCP configuration from Cursor

### Option 2: Direct GitHub Copilot Configuration

Alternatively, configure GitHub Copilot directly in VS Code:

1. **Install GitHub Copilot extension** in VS Code

2. **Install the MiniMe-MCP client globally**:
   ```bash
   npm install -g @minimemcp/mcp-client
   ```

3. **Configure MCP for Copilot** by adding to VS Code's `settings.json`:
   ```json
   {
     "chat.mcp.discovery.enabled": true,
     "chat.mcp.servers": {
       "minime-mcp": {
         "command": "minime-mcp",
         "env": {
           "MINIME_SERVER_URL": "http://localhost:8000",
           "MINIME_DEBUG": "false"
         }
       }
     }
   }
   ```

4. **Restart VS Code**

### Option 3: Project-Level Configuration

For team projects or specific workspace configurations:

1. **Create a `.vscode` folder** in your project root (if it doesn't exist)

2. **Create `.vscode/settings.json`** with the following configuration:
   ```json
   {
     "servers": {
       "minime-mcp": {
         "type": "stdio",           // Required for local command servers
         "command": "minime-mcp",   // Command to start your server
         "args": [],                // Add any command-line arguments here
         "env": {
           "MINIME_SERVER_URL": "http://localhost:8000",
           "MINIME_DEBUG": "false"
         }
       }
     }
   }
   ```

3. **Commit this file** to your repository so all team members have the same MCP configuration

4. **Install the MiniMe-MCP client** (team members need to do this):
   ```bash
   npm install -g @minimemcp/mcp-client
   ```

5. **Restart VS Code** to load the project-level configuration

**Benefits of project-level configuration:**
- ✅ Consistent configuration across the team
- ✅ No need to modify global VS Code settings
- ✅ Configuration is version-controlled
- ✅ Works alongside global configurations

## Configuration Options

- `MINIME_SERVER_URL`: URL of your MiniMe-MCP server (default: http://localhost:8000)
- `MINIME_DEBUG`: Enable debug logging (true/false)

## Verification

In VS Code with GitHub Copilot, you should see MiniMe-MCP tools available in Copilot Chat. Test with:
- "Use the store_memory tool to save this information"
- "Search my memories using the search_memories tool"
- "Get insights about my projects"

## Available Tools

Once configured, you'll have access to all MiniMe-MCP tools through GitHub Copilot:
- **store_memory** - Store information with auto-tagging
- **search_memories** - Semantic search across memories
- **get_insights** - AI-powered insights and patterns
- **start_thinking** - Sequential reasoning process
- **manage_tasks** - Task management
- **manage_project** - Project documentation
- **And more!**

## Troubleshooting

If MCP tools don't appear in Copilot Chat:
1. **Ensure GitHub Copilot extension is installed and active**
2. Check if minime-mcp is installed: `which minime-mcp`
3. Verify server is running: `curl http://localhost:8000/health`
4. Check VS Code logs for Copilot-related errors
5. Restart VS Code completely after adding the configuration
6. Try the auto-discovery method if using direct configuration fails

## Important Notes

- **MCP support is through GitHub Copilot**, not VS Code itself
- **Auto-discovery from Cursor's config** is a convenient Copilot feature
- **Both methods provide the same MCP tool functionality** through Copilot Chat
- **You need an active GitHub Copilot subscription** for this to work