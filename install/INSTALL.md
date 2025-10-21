# MiniMe-MCP Quick Start

Get MiniMe-MCP running in **under 2 minutes**.

## Prerequisites

1. **Docker** - [Install Docker](https://docs.docker.com/get-docker/)
2. **Ollama** (for free local AI) - [Install Ollama](https://ollama.ai)

### Pull Required Models

```bash
# Required for embeddings
ollama pull mxbai-embed-large

# Required for insights (or use OpenAI/Anthropic)
ollama pull qwen2.5-coder:7b
```

## Quick Start

```bash
cd install
docker-compose up -d
```

**That's it!** Access MiniMe at:
- **Web UI**: http://localhost:9000
- **MCP API**: http://localhost:8000
- **Health Check**: http://localhost:8000/health

## Configuration

The `minime.config` file contains all configuration options. Key settings:

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

See `minime.config.example` for all available options with detailed documentation.

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
Edit `minime.config` and change the port values, then restart:
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

**Need detailed setup info?** See [INSTALL.md](INSTALL.md) for comprehensive installation guide.
