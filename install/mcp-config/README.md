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
# Required for embeddings
ollama pull mxbai-embed-large

# Required for insights (or use OpenAI/Anthropic)
ollama pull qwen2.5-coder:7b
```

**Important:** The `mxbai-embed-large` model is required for generating embeddings. Without it, document processing and memory search will fail.

---

## Optional: Install MCP Client (npm)

The MCP Client provides command-line tools for testing and debugging MiniMe-MCP:

```bash
npm install -g @minimemcp/mcp-client
```

**Verify installation:**
```bash
minime-mcp --help

# Test connection (after Docker is running)
MINIME_SERVER_URL=http://localhost:8000 minime-mcp
```

This is optional - IDE integrations work without the CLI client.

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

After MiniMe-MCP is running, configure your IDE:

- **[Cursor](mcp-config/cursor/README.md)** - Full MCP support
- **[VS Code](mcp-config/vscode/README.md)** - Via GitHub Copilot
- **[Claude Desktop](mcp-config/claude-code/README.md)** - Full MCP support

**Note:** If you changed `HOST_MCP_PORT` in `minime.env` from the default `8000`, make sure to update the `MINIME_SERVER_URL` in your IDE's MCP configuration to match the new port (e.g., `http://localhost:8001`).

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

## Troubleshooting

**Ollama Connection Issues:**
```bash
# Ensure Ollama is running
ollama serve

# Verify models are downloaded
ollama list
```

**Port Conflicts:**
Edit `minime.env` and change the HOST_* port mappings, then restart:
```bash
# Edit install/minime.env - change HOST_UI_PORT, HOST_MCP_PORT, etc.
docker-compose down
docker-compose up -d
```

**View Container Status:**
```bash
docker ps -f name=minimemcp
curl http://localhost:8000/health
```

## Next Steps

1. **Test MiniMe**: Visit http://localhost:9000
2. **Configure IDE**: Follow the guides in `mcp-config/`
3. **Start Building**: Your AI now has persistent memory!

---

