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

## Install MCP Client (npm)

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
# Edit install/minime.env and change port values:
UI_PORT=9001        # Web UI (default: 9000)
MCP_PORT=8001       # MCP API (default: 8000)
POSTGRES_PORT=5433  # PostgreSQL (default: 5432)
```

**How it works:** Docker maps `HOST_PORT:CONTAINER_PORT`, so `UI_PORT=9001` means:
- Container runs on port 9000 internally
- Accessible on your machine at `http://localhost:9001`

### Start MiniMe-MCP

```bash
cd install
docker-compose up -d
```

**That's it!** Access MiniMe at:
- **Web UI**: http://localhost:9000
- **MCP API**: http://localhost:8000
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

### Ports
```bash
UI_PORT=9000
MCP_PORT=8000
POSTGRES_PORT=5432
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
Edit `minime.env` and change the port values, then restart:
```bash
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

