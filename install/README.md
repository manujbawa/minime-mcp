# MiniMe-MCP Installation Guide

## What is MiniMe-MCP?

**MiniMe-MCP** is an AI memory and project intelligence server that enables persistent, context-aware assistance directly in your IDE (Cursor, VS Code, Claude Desktop). It uses the **Model Context Protocol (MCP)** to provide tools for storing, searching, and reasoning about your code, decisions, and project knowledge—creating a digital memory that persists across sessions and grows smarter over time.

---

Get MiniMe-MCP running in **under 2 minutes**.

## Prerequisites

### 1. Docker
[Install Docker](https://docs.docker.com/get-docker/) for your platform.

### 2. Ollama (for free local AI)

**Install Ollama:**

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai/download
```

**Start Ollama:**
```bash
ollama serve
```

### 3. Pull Required Models

```bash

# Required for insights (or use OpenAI/Anthropic)
ollama pull qwen2.5-coder:7b
```


---

## Note: No npm Client Needed (For Most IDEs)

**MiniMe-MCP now uses HTTP transport** - most modern IDEs connect directly to the Docker container:

✅ **No npm client needed (HTTP)**: Cursor, VS Code, Claude Code, Windsurf, and 10+ other IDEs

⚠️ **npm client required (STDIO→HTTP bridge)**: Claude Desktop, Zed, JetBrains, Cline, BoltAI, and other command-only IDEs

**Why does Claude Desktop need the npm client?**
Claude Desktop does not support HTTP MCP servers with localhost (non-HTTPS) URLs. The npm client acts as a bridge: it accepts STDIO commands from Claude Desktop and forwards them via HTTP to the MiniMe server.

If your IDE requires the npm client (see IDE Integration section below), install it:

```bash
npm install -g @minimemcp/mcp-client
```

---

## Quick Start

### Optional: Configure Ports (Before Starting)

If you need to change default ports (e.g., port 9000 is already in use), edit `minime.env` **before** running docker compose:

```bash
# Edit install/minime.env and change HOST port mappings:
HOST_UI_PORT=9001        # Access UI at localhost:9001 (default: 9000)
HOST_MCP_PORT=8001       # Access MCP API at localhost:8001 (default: 8000)
HOST_POSTGRES_PORT=5433  # Access PostgreSQL at localhost:5433 (default: 5432)
```

**How it works:** Docker maps your host machine ports to fixed container ports:
- `HOST_UI_PORT=9001` → Container internal port 9000 maps to your localhost:9001
- Container **always** uses fixed internal ports (MCP:8000, UI:9000, DB:5432)
- You only configure the **HOST_*** ports to avoid conflicts on your machine

**⚠️ Important:** If you change `HOST_MCP_PORT` from the default `8000`, you **must also update** your IDE's MCP client configuration to use the new port. See the `mcp-config/` directory for your IDE:
- `mcp-config/cursor/` - Cursor IDE configuration
- `mcp-config/vscode/` - VS Code configuration
- `mcp-config/claude-code/` - Claude Desktop configuration

Update the `MINIME_SERVER_URL` in your IDE's config to match your custom port (e.g., `http://localhost:8001`).

### Start MiniMe-MCP

```bash
cd install
docker-compose up -d
```

**That's it!** Access MiniMe at:
- **Web UI**: http://localhost:9000 (or your configured HOST_UI_PORT)
- **MCP API**: http://localhost:8000 (or your configured HOST_MCP_PORT)
- **Health Check**: http://localhost:8000/health

## Configuration

The `minime.env` file contains all configuration options. Key settings:

### Database (Required)
```bash
POSTGRES_PASSWORD=minime_password  # Change in production!
```

### LLM Provider
```bash
# Default: Ollama (free, local)
LLM_PROVIDER=ollama
LLM_MODEL=qwen2.5-coder:7b

# Or use OpenAI
# LLM_PROVIDER=openai
# LLM_MODEL=gpt-4o
# OPENAI_API_KEY=sk-...

# Or use Anthropic
# LLM_PROVIDER=anthropic
# LLM_MODEL=claude-sonnet-4-5-20250929
# ANTHROPIC_API_KEY=sk-ant-...
```

### Ports (Host Mappings)
```bash
HOST_UI_PORT=9000        # Access UI on your machine
HOST_MCP_PORT=8000       # Access MCP API on your machine
HOST_POSTGRES_PORT=5432  # Access PostgreSQL on your machine

# Container internal ports are fixed (not configurable):
# MCP:8000, UI:9000, DB:5432
```

See `minime.env` for all available options with detailed inline documentation.

---

## Advanced Configuration

All configuration is managed through `minime.env` (single source of truth). Common customizations:

### Change LLM Model
```bash
# Edit install/minime.env
LLM_MODEL=llama3.2:3b           # Smaller, faster
# or
LLM_MODEL=gpt-oss:20b           # Larger, more accurate
```

### Adjust Document Chunk Size
```bash
# Edit install/minime.env
CHUNK_SIZE_TOKENS=400           # Safe with 22% margin (recommended)
CHUNK_SIZE_TOKENS=450           # Moderate margin
```

### Change Processing Settings
```bash
# Edit install/minime.env
BATCH_SIZE=20                   # Process more memories at once
MAX_CONCURRENT=10               # More parallel operations
QUEUE_WORKERS=3                 # More background workers
```

### Use OpenAI or Anthropic
```bash
# Edit install/minime.env

# OpenAI
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o
OPENAI_API_KEY=sk-...

# Anthropic
LLM_PROVIDER=anthropic
LLM_MODEL=claude-sonnet-4-5-20250929
ANTHROPIC_API_KEY=sk-ant-...
```

### Disable Features
```bash
# Edit install/minime.env
ENABLE_PATTERN_MATCHING=false   # Skip pattern detection
ENABLE_UNIFIED_INSIGHTS=false   # Disable insights processing
REAL_TIME_PROCESSING=false      # Queue for batch processing
```

**After editing `minime.env`, restart the container:**
```bash
cd install
docker-compose down
docker-compose up -d
```

---

## IDE Integration

MiniMe-MCP supports two connection methods:

### ✅ HTTP-Capable IDEs (Recommended - No npm Client)

These IDEs connect directly to `http://localhost:8000/mcp`:

<details>
<summary><b>Install in Cursor</b></summary>

Go to: `Settings` → `Cursor Settings` → `MCP` → `Add new global MCP server`

**Configuration:**

```json
{
  "mcpServers": {
    "minime": {
      "url": "http://localhost:8000/mcp",
      "transport": "http"
    }
  }
}
```

**Or manually edit config file:**

**File location:**
- macOS: `~/.cursor/mcp.json`
- Windows: `%APPDATA%\Cursor\mcp.json`
- Linux: `~/.config/cursor/mcp.json`

**Verification:**
1. Restart Cursor after adding configuration
2. Test with: "Use the store_memory tool to save this information"
3. MiniMe tools should appear in the AI assistant

</details>

<details>
<summary><b>Install in VS Code</b></summary>

**Prerequisites:**
- VS Code version 1.102+ (or VS Code Insiders 1.103+)
- GitHub Copilot Chat extension v0.29+

**Method 1: Using Command Palette (Recommended)**

1. Press `Ctrl/Cmd + Shift + P`
2. Type and select: `MCP: Add Server`
3. Choose: `HTTP`
4. Enter URL: `http://localhost:8000/mcp`
5. Enter name: `minime`

**Method 2: Manual Configuration**

Add this to your VS Code MCP config file:

**File location:**
- macOS: `~/Library/Application Support/Code/User/mcp.json`
- Windows: `%APPDATA%\Code\User\mcp.json`
- Linux: `~/.config/Code/User/mcp.json`

```json
{
  "mcp": {
    "servers": {
      "minime": {
        "type": "http",
        "url": "http://localhost:8000/mcp"
      }
    }
  }
}
```

**Workspace-Specific Configuration (Optional):**

Create `.vscode/mcp.json` in your project root to override global settings for that workspace.

**Verification:**
1. Restart VS Code after adding configuration
2. Open GitHub Copilot Chat (click chat icon in sidebar)
3. Type "Use MCP tools to search my memories"
4. You should see MiniMe tools being used

See [VS Code MCP docs](https://code.visualstudio.com/docs/copilot/chat/mcp-servers) for more info.

</details>

<details>
<summary><b>Install in Claude Code</b></summary>

Run this command to add MiniMe with HTTP transport:

```bash
claude mcp add --transport http minime http://localhost:8000/mcp
```

**Verification:**
```bash
# List installed MCP servers
claude mcp list

# Test connection
claude mcp test minime
```

See [Claude Code MCP docs](https://docs.anthropic.com/en/docs/claude-code/mcp) for more info.

</details>

<details>
<summary><b>Install in Windsurf</b></summary>

Add this to your Windsurf MCP config file:

```json
{
  "mcpServers": {
    "minime": {
      "serverUrl": "http://localhost:8000/mcp"
    }
  }
}
```

</details>

<details>
<summary><b>Install in Roo Code</b></summary>

Add this to your Roo Code MCP configuration file:

```json
{
  "mcpServers": {
    "minime": {
      "type": "streamable-http",
      "url": "http://localhost:8000/mcp"
    }
  }
}
```

</details>

<details>
<summary><b>Install in Visual Studio 2022</b></summary>

Add this to your Visual Studio MCP config file. See [Visual Studio MCP docs](https://learn.microsoft.com/visualstudio/ide/mcp-servers) for details:

```json
{
  "inputs": [],
  "servers": {
    "minime": {
      "type": "http",
      "url": "http://localhost:8000/mcp"
    }
  }
}
```

</details>

<details>
<summary><b>Other HTTP-Capable IDEs</b></summary>

MiniMe also works with:
- **Gemini CLI** - Use `httpUrl: "http://localhost:8000/mcp"`
- **Qodo Gen** - Use `type: "remote", url: "http://localhost:8000/mcp"`
- **Opencode** - Use `type: "remote", url: "http://localhost:8000/mcp"`
- **Trae** - Use `url: "http://localhost:8000/mcp"`
- **Copilot Coding Agent** - Use `type: "http", url: "http://localhost:8000/mcp"`

Refer to your IDE's MCP documentation for exact configuration syntax.

</details>

### ⚠️ Command-Only IDEs (Requires npm Client)

These IDEs only support command-based connections and need the npm client as a stdio→HTTP bridge:

**First, install the npm client:**
```bash
npm install -g @minimemcp/mcp-client
```

<details>
<summary><b>Install in Zed</b></summary>

Add this to your Zed `settings.json`. See [Zed Context Server docs](https://zed.dev/docs/assistant/context-servers) for more info.

```json
{
  "context_servers": {
    "minime": {
      "source": "custom",
      "command": "npx",
      "args": ["-y", "minime-mcp"],
      "env": {
        "MINIME_SERVER_URL": "http://localhost:8000/mcp"
      }
    }
  }
}
```

See [Zed Context Server docs](https://zed.dev/docs/assistant/context-servers) for more info.

</details>

<details>
<summary><b>Install in JetBrains AI Assistant</b></summary>

See [JetBrains AI Assistant Documentation](https://www.jetbrains.com/help/ai-assistant/configure-an-mcp-server.html) for more details.

1. In JetBrains IDEs, go to `Settings` → `Tools` → `AI Assistant` → `Model Context Protocol (MCP)`
2. Click `+ Add`
3. Click on `Command` in the top-left corner and select `As JSON`
4. Add this configuration and click `OK`:

```json
{
  "mcpServers": {
    "minime": {
      "command": "npx",
      "args": ["-y", "minime-mcp"],
      "env": {
        "MINIME_SERVER_URL": "http://localhost:8000/mcp"
      }
    }
  }
}
```

5. Click `Apply` to save changes

See [JetBrains AI Assistant Documentation](https://www.jetbrains.com/help/ai-assistant/configure-an-mcp-server.html) for more info.

</details>

<details>
<summary><b>Install in Cline</b></summary>

Add this to your Cline MCP servers configuration:

```json
{
  "mcpServers": {
    "minime": {
      "command": "npx",
      "args": ["-y", "minime-mcp"],
      "env": {
        "MINIME_SERVER_URL": "http://localhost:8000/mcp"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Install in BoltAI</b></summary>

Open the "Settings" page of the app, navigate to "Plugins," and enter the following JSON:

```json
{
  "mcpServers": {
    "minime": {
      "command": "npx",
      "args": ["-y", "minime-mcp"],
      "env": {
        "MINIME_SERVER_URL": "http://localhost:8000/mcp"
      }
    }
  }
}
```

More information is available on [BoltAI's Documentation site](https://docs.boltai.com/docs/plugins/mcp-servers).

</details>

<details>
<summary><b>Install in Augment Code</b></summary>

1. Press Cmd/Ctrl Shift P or go to the hamburger menu in the Augment panel
2. Select Edit Settings
3. Under Advanced, click Edit in settings.json
4. Add the server configuration to the `mcpServers` array:

```json
"augment.advanced": {
  "mcpServers": [
    {
      "name": "minime",
      "command": "npx",
      "args": ["-y", "minime-mcp"],
      "env": {
        "MINIME_SERVER_URL": "http://localhost:8000/mcp"
      }
    }
  ]
}
```

Once the MCP server is added, restart your editor.

</details>

<details>
<summary><b>Install in Warp</b></summary>

See [Warp MCP Documentation](https://docs.warp.dev/knowledge-and-collaboration/mcp) for details.

1. Navigate `Settings` > `AI` > `Manage MCP servers`
2. Add a new MCP server by clicking the `+ Add` button
3. Paste the configuration given below:

```json
{
  "minime": {
    "command": "npx",
    "args": ["-y", "minime-mcp"],
    "env": {
      "MINIME_SERVER_URL": "http://localhost:8000/mcp"
    },
    "working_directory": null,
    "start_on_launch": true
  }
}
```

4. Click `Save` to apply the changes

</details>

<details>
<summary><b>Install in Amazon Q Developer CLI</b></summary>

Add this to your Amazon Q Developer CLI configuration file. See [Amazon Q Developer CLI docs](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/command-line-mcp-configuration.html) for more details.

```json
{
  "mcpServers": {
    "minime": {
      "command": "npx",
      "args": ["-y", "minime-mcp"],
      "env": {
        "MINIME_SERVER_URL": "http://localhost:8000/mcp"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Install in Claude Desktop</b></summary>

**Note:** Claude Desktop does not support non-HTTPS MCP servers with HTTP transport directly. You must use the npm client as a stdio→HTTP bridge.

**Steps to Configure:**

1. **Install npm client:**
   ```bash
   npm install -g @minimemcp/mcp-client
   ```

2. **Add to Claude Desktop config:**
   - Open Claude Desktop
   - Go to **Claude → Settings → Developer → Edit Config**
   - Add the following configuration:

   ```json
   {
     "mcpServers": {
       "minime": {
         "command": "/bin/sh",
         "args": [
           "-c",
           "PATH=/opt/homebrew/bin:/opt/homebrew/opt/node@22/bin:/usr/local/bin:/usr/bin:$PATH npx -y minime-mcp"
         ],
         "env": {
           "MINIME_SERVER_URL": "http://localhost:8000/mcp",
           "MINIME_DEBUG": "false"
         }
       }
     }
   }
   ```

   **Important notes:**
   - Set `MINIME_DEBUG` to `"true"` only for troubleshooting
   - Adjust the PATH to match your Node.js installation location
   - The `-y` flag ensures npx always uses the latest published version

3. **Enable MiniMe tools:**
   - Save the config and restart Claude Desktop
   - Go to **Connectors → Minime**
   - Enable each tool you want to use

4. **Verify connection:**
   - Check Claude Desktop logs for successful connection
   - Try using a MiniMe tool (e.g., `get_rules` with `project_name: "__global__"`)

**Troubleshooting:**
- If you see "HTTP 406" errors, ensure you have the latest npm client: `npm install -g @minimemcp/mcp-client`
- If tools don't appear, verify the Docker container is running: `docker ps -f name=minimemcp`
- Check Claude Desktop logs for detailed error messages

</details>

**Note:** If you changed `HOST_MCP_PORT` in `minime.env` from the default `8000`, update the URL in your IDE config (e.g., `http://localhost:8001/mcp`).

## Management Commands

```bash
# View logs
docker-compose logs -f

# Stop
docker-compose down

# Restart
docker-compose restart

# Update to latest version
docker-compose pull
docker-compose up -d

# Reset everything (⚠️ deletes all data!)
docker-compose down -v
```

## 🛟 Tips

### Add Rules for Automatic Tool Usage

If you don't want to manually invoke MiniMe tools every time, you can define rules in your IDE to automatically use MiniMe for specific tasks:

**For Cursor:** `Cursor Settings > Rules` section

**For Claude Code:** In `.clauderc` or `CLAUDE.md` file

**For Windsurf:** In `.windsurfrules` file

#### Example Rule

```txt
Always use minime MCP tools when working with this codebase. Specifically:
- Use store_memory to capture implementation decisions, learnings, and code context
- Use search_memories to find past decisions and context before making changes
- Use get_rules at the start of each session to load project behavioral guidelines
- Link memories to files using related_files parameter for better code searchability
```

From then on, your AI assistant will automatically use MiniMe's persistent memory without you having to explicitly request it.

### Testing with MCP Inspector

You can test and debug your MiniMe MCP connection using the official MCP Inspector:

```bash
# Test HTTP connection
npx @modelcontextprotocol/inspector http://localhost:8000/mcp

# Test npm client (stdio→HTTP bridge)
npx @modelcontextprotocol/inspector npx -y minime-mcp
```

The inspector provides a web interface to:
- List all available tools
- Test tool execution with custom parameters
- View request/response JSON
- Debug connection issues

---

## Troubleshooting

<details>
<summary><b>Ollama Connection Issues</b></summary>

```bash
# Ensure Ollama is running
ollama serve

# Verify models are downloaded
ollama list

# Test Ollama connection
curl http://localhost:11434/api/version
```

If Ollama is running on a different host:
```bash
# Edit install/minime.env
OLLAMA_HOST=http://your-ollama-host:11434
```

</details>

<details>
<summary><b>Port Conflicts</b></summary>

Edit `minime.env` and change the HOST_* port mappings, then restart:
```bash
# Edit install/minime.env - change HOST_UI_PORT, HOST_MCP_PORT, etc.
docker-compose down
docker-compose up -d
```

**Remember:** If you change `HOST_MCP_PORT`, you must also update your IDE config to use the new port.

</details>

<details>
<summary><b>Claude Desktop HTTP 406 Errors</b></summary>

If you see "HTTP 406: Not Acceptable" errors in Claude Desktop logs:

1. Update npm client to latest version:
   ```bash
   npm install -g @minimemcp/mcp-client
   ```

2. Clear npx cache:
   ```bash
   rm -rf ~/.npm/_npx
   npm cache clean --force
   ```

3. Restart Claude Desktop completely

The latest npm client (v1.2.3+) includes the correct Accept headers required by the MiniMe server.

</details>

<details>
<summary><b>Tools Not Appearing in IDE</b></summary>

1. Verify Docker container is running:
   ```bash
   docker ps -f name=minimemcp
   ```

2. Check MCP server health:
   ```bash
   curl http://localhost:8000/health
   curl http://localhost:8000/mcp/status
   ```

3. For HTTP-capable IDEs (Cursor, VS Code):
   - Verify URL ends with `/mcp`: `http://localhost:8000/mcp`
   - Restart your IDE after config changes

4. For command-only IDEs (Claude Desktop, Zed):
   - Ensure npm client is installed: `npm list -g @minimemcp/mcp-client`
   - Check `MINIME_SERVER_URL` includes `/mcp`: `http://localhost:8000/mcp`

</details>

<details>
<summary><b>Database Connection Issues</b></summary>

```bash
# Check PostgreSQL is running inside container
docker exec minimemcp pg_isready -U minime

# View database logs
docker exec minimemcp tail -f /data/postgres.log

# Connect to database directly
docker exec -it minimemcp psql -U minime -d minime_memories
```

</details>

<details>
<summary><b>View Container Status</b></summary>

```bash
# Check container status
docker ps -f name=minimemcp

# View all logs
docker logs -f minimemcp

# Check health endpoint
curl http://localhost:8000/health

# Check MCP status with tool list
curl http://localhost:8000/mcp/status
```

</details>

<details>
<summary><b>npm Client Issues (Claude Desktop, Zed, JetBrains)</b></summary>

**Module not found errors:**
```bash
# Reinstall npm client
npm uninstall -g @minimemcp/mcp-client
npm install -g @minimemcp/mcp-client

# Verify installation
npm list -g @minimemcp/mcp-client
minime-mcp --version
```

**Connection timeout:**
```bash
# Test npm client directly
MINIME_DEBUG=true MINIME_SERVER_URL=http://localhost:8000/mcp minime-mcp
```

**Wrong Node.js version:**
The npm client requires Node.js >= 18. Check your version:
```bash
node --version
```

</details>

## Next Steps

1. **Test MiniMe**: Visit http://localhost:9000
2. **Configure IDE**: Follow the guides in `mcp-config/`
3. **Start Building**: Your AI now has persistent memory!

---

