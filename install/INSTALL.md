# MiniMe-MCP Installation Guide

## What is MiniMe-MCP?

**MiniMe-MCP** is an AI memory and project intelligence server that enables persistent, context-aware assistance directly in your IDE (Cursor, VS Code, Claude Desktop). It uses the **Model Context Protocol (MCP)** to provide tools for storing, searching, and reasoning about your code, decisions, and project knowledge—creating a digital memory that persists across sessions and grows smarter over time.

---

## 1. Install Ollama

MiniMe-MCP requires [Ollama](https://ollama.ai/) for both LLM analysis and embeddings. Install Ollama on your host machine:

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai/download
```

Pull the required models:

```bash
# Pull the embedding model (REQUIRED for memory processing)
ollama pull mxbai-embed-large

# Pull the default LLM model for analysis
ollama pull deepseek-coder:6.7b
```

**Important**: The `mxbai-embed-large` model is required for generating embeddings. Without it, memories cannot be processed properly.

---

## 2. Install the MCP Client (npm)

The MCP Client is required for IDE integration and using MCP tools from your terminal. Install it globally:

```bash
npm install -g @minimemcp/mcp-client
```

### Verify Installation

```bash
minime-mcp --help
# or test connection to server (after Docker is running)
MINIME_SERVER_URL=http://localhost:8000 minime-mcp
```

---

## 3. Run the MiniMe-MCP Server (Docker)

Start the MiniMe-MCP server with Docker. The image is available on Docker Hub with support for both AMD64 and ARM64 architectures:

```bash
docker run -d \
  --name minimemcp \
  -p 5432:5432 \
  -p 8000:8000 \
  -p 9000:9000 \
  -v minime-mcp-v9:/data \
  -e POSTGRES_PASSWORD=minime_password \
  manujbawa/minimemcp:latest
```

**What this does:**
- Runs MiniMe-MCP in the background as a Docker container
- Automatically selects the correct architecture (AMD64 for Intel/AMD, ARM64 for Apple Silicon)
- Exposes ports: 5432 (PostgreSQL), 8000 (MCP API), 9000 (Web UI)
- Creates a persistent Docker volume `minime-mcp-v9` for your data
- Uses the default LLM (`deepseek-coder:6.7b`) and embedding model (`mxbai-embed-large`)
- Connects to Ollama running on your host at `http://host.docker.internal:11434`

---

## 4. IDE Integration

Configure your IDE to use MiniMe-MCP tools. See the configuration guides in `install/mcp-config/` for step-by-step setup:

- **[Cursor](mcp-config/cursor/README.md)** - Full MCP support
- **[VS Code](mcp-config/vscode/README.md)** - Awaiting MCP extension
- **[Claude Desktop](mcp-config/claude-code/README.md)** - Full MCP support

Once configured, you'll have access to tools like `store_memory`, `search_memories`, `get_insights`, and more directly in your IDE.

---

## 5. Advanced Configuration

You can customize MiniMe-MCP by setting environment variables in your Docker command:

### Override LLM Model
```bash
docker run -d \
  --name minimemcp \
  -e LLM_MODEL="llama2:13b" \
  -e POSTGRES_PASSWORD=minime_password \
  -p 5432:5432 \
  -p 8000:8000 \
  -p 9000:9000 \
  -v minime-mcp-v9:/data \
  manujbawa/minimemcp:latest
```

### Set Maximum Tokens
```bash
docker run -d \
  --name minimemcp \
  -e LLM_MAX_TOKENS="8000" \
  -e POSTGRES_PASSWORD=minime_password \
  -p 5432:5432 \
  -p 8000:8000 \
  -p 9000:9000 \
  -v minime-mcp-v9:/data \
  manujbawa/minimemcp:latest
```

### Change Ports
```bash
docker run -d \
  --name minimemcp \
  -e MCP_PORT="8080" \
  -e UI_PORT="3000" \
  -e POSTGRES_PASSWORD=minime_password \
  -p 5432:5432 \
  -p 8080:8080 \
  -p 3000:3000 \
  -v minime-mcp-v9:/data \
  manujbawa/minimemcp:latest
```

### Use Custom Volume
```bash
docker run -d \
  --name minimemcp \
  -e POSTGRES_PASSWORD=minime_password \
  -p 5432:5432 \
  -p 8000:8000 \
  -p 9000:9000 \
  -v my_custom_volume:/data \
  manujbawa/minimemcp:latest
```

### Combined Example
```bash
docker run -d \
  --name minimemcp \
  -e LLM_MODEL="llama2:13b" \
  -e LLM_MAX_TOKENS="8000" \
  -e MCP_PORT="8080" \
  -e UI_PORT="3000" \
  -e POSTGRES_PASSWORD=minime_password \
  -p 5432:5432 \
  -p 8080:8080 \
  -p 3000:3000 \
  -v my_minime_data:/data \
  manujbawa/minimemcp:latest
```

---

## 6. Troubleshooting

### Container can't connect to Ollama
- Ensure Ollama is running: `ollama serve`
- Check that both models are downloaded: `ollama list`
- Verify the container can reach the host: `docker exec minimemcp ping host.docker.internal`

### MCP Client not found
```bash
# Check if globally installed
which minime-mcp

# Reinstall if missing
npm uninstall -g @minimemcp/mcp-client
npm install -g @minimemcp/mcp-client
```

### Memory processing errors
- Ensure the embedding model is installed: `ollama pull mxbai-embed-large`
- Check container logs: `docker logs minimemcp | grep embed`

### Connection issues
```bash
# Test server health
curl http://localhost:8000/health

# Test MCP client connection
MINIME_SERVER_URL=http://localhost:8000 MINIME_DEBUG=true minime-mcp
```

### General debugging
```bash
# Check container status
docker ps -f name=minimemcp

# View container logs
docker logs minimemcp -f

# Restart container
docker restart minimemcp
```

For more help, check the container logs and ensure all prerequisites (Ollama, npm client, Docker) are properly installed and running.