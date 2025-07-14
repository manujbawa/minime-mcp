# MiniMe-MCP v0.1.7-v2

🧠 **Intelligence-First Memory and Context Protocol Server**

A sophisticated MCP (Model Context Protocol) server that transforms AI interactions with intelligent memory, project insights, and pattern recognition. MiniMe-MCP creates a persistent digital memory that enables AI assistants to remember context across sessions, learn from your codebase, and provide increasingly intelligent assistance over time.

## ✨ Why MiniMe-MCP?

- **Persistent Context**: Your AI assistant remembers everything - decisions, code patterns, project knowledge
- **Intelligent Analysis**: AI-powered insights that identify patterns and learning opportunities
- **Universal IDE Support**: Works seamlessly with VS Code, Claude Desktop, Cursor, Windsurf
- **Privacy-First**: Runs locally with your own Ollama models - your data never leaves your machine
- **Multi-Architecture**: Native support for both Intel/AMD (x64) and Apple Silicon (ARM64)

## 🚀 Quick Start (5 minutes)

### Prerequisites

1. **Install Docker** - [Get Docker](https://docs.docker.com/get-docker/)
2. **Install Ollama** - Required for AI models
   ```bash
   # macOS
   brew install ollama
   
   # Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Windows
   # Download from https://ollama.ai/download
   ```

3. **Pull Required Models**
   ```bash
   # Pull the embedding model (REQUIRED)
   ollama pull mxbai-embed-large
   
   # Pull the default LLM model
   ollama pull deepseek-coder:6.7b
   ```

### Run MiniMe-MCP

```bash
# Pull and run the Docker image (auto-selects ARM64 or AMD64)
docker run -d \
  --name minimemcp \
  -p 5432:5432 \
  -p 8000:8000 \
  -p 9000:9000 \
  -v minime-mcp-v9:/data \
  -e POSTGRES_PASSWORD=minime_password \
  manujbawa/minimemcp:latest
```

**That's it!** MiniMe-MCP is now running:
- 📍 **MCP API**: http://localhost:8000
- 📍 **Web UI**: http://localhost:9000
- 🏥 **Health Check**: http://localhost:8000/health

## 🛠️ MCP Tools for Your IDE

### Install the MCP Client
```bash
npm install -g @minimemcp/mcp-client
```

### Available MCP Tools
- `store_memory` - Intelligent memory storage with auto-tagging
- `search_memories` - Hybrid semantic/keyword search
- `get_insights` - AI-powered pattern analysis
- `start_thinking` - Structured reasoning sequences
- `manage_tasks` - Project task management
- `manage_project` - Documentation and project management

## 🎯 IDE Integration

Configure your IDE to use MiniMe-MCP tools:

- **[Claude Desktop](install/mcp-config/claude-code/README.md)** - Full MCP support
- **[Cursor](install/mcp-config/cursor/README.md)** - Full MCP support
- **[VS Code](install/mcp-config/vscode/README.md)** - Awaiting MCP extension
- **[Windsurf](install/mcp-config/windsurf/README.md)** - Full MCP support

Once configured, your AI assistant will have access to persistent memory and intelligent tools directly in your IDE.

## 🧠 Key Features

### Intelligence-First Framework
- **Mandatory Session Startup**: Automatic project context loading
- **Aggressive Memory Storage**: Everything important is stored automatically
- **Pattern Recognition**: AI identifies trends and learning opportunities
- **Structured Thinking**: Multi-step reasoning for complex problems

### Advanced Capabilities
- **Unified Insights v2**: Pattern detection with LLM-powered categorization
- **Sequential Thinking**: Branch and explore multiple solution paths
- **Project Intelligence**: Learns your codebase structure and conventions
- **Task Management**: Integrated task tracking with intelligent prioritization

## 🔧 Advanced Configuration

### Use Different LLM Models
```bash
docker run -d \
  --name minimemcp \
  -e LLM_MODEL="llama2:13b" \
  -e POSTGRES_PASSWORD=minime_password \
  -p 5432:5432 -p 8000:8000 -p 9000:9000 \
  -v minime-mcp-v9:/data \
  manujbawa/minimemcp:latest
```

### Custom Ports
```bash
docker run -d \
  --name minimemcp \
  -e MCP_PORT="8080" \
  -e UI_PORT="3000" \
  -e POSTGRES_PASSWORD=minime_password \
  -p 5432:5432 -p 8080:8080 -p 3000:3000 \
  -v minime-mcp-v9:/data \
  manujbawa/minimemcp:latest
```

## 📦 Building from Source

For development or customization:

```bash
# Clone the repository
git clone https://github.com/yourusername/MiniMe-MCP
cd MiniMe-MCP

# Quick start with everything
make all

# Development mode with hot reload
make dev-hot

# Build for production
make build-fast-v2
```

## 🐛 Troubleshooting

### Check Status
```bash
# Container status
docker ps -f name=minimemcp

# View logs
docker logs minimemcp -f

# Test health
curl http://localhost:8000/health
```

### Common Issues

**Ollama Connection**
- Ensure Ollama is running: `ollama serve`
- Verify models are downloaded: `ollama list`

**Memory Processing**
- Check embedding model: `ollama pull mxbai-embed-large`
- View logs: `docker logs minimemcp | grep embed`

## 📚 Documentation

- **[Installation Guide](install/INSTALL.md)** - Detailed setup instructions
- **[MCP Configuration](install/mcp-config/README.md)** - IDE integration guides
- **[API Documentation](http://localhost:8000/api/docs)** - Available when running

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with Intelligence-First principles for maximum AI productivity** 🚀

### Technology Stack
- **Database**: PostgreSQL with pgvector for embeddings
- **AI Models**: Local Ollama (mxbai-embed-large, deepseek-coder:6.7b)
- **Frontend**: React with Material-UI
- **Backend**: Node.js with Express
- **Container**: Single Docker container with multi-arch support (AMD64 + ARM64)