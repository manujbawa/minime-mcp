# MiniMe-MCP v0.1.7-v2

🧠 **Intelligence-First Memory and Context Protocol Server**

A sophisticated MCP (Model Context Protocol) server that transforms AI interactions with intelligent memory, project insights, and pattern recognition.

## 🚀 Quick Start

```bash
# Clone and start
git clone <repository-url>
cd MiniMe-MCP
make all
```

**Access Points:**
- 📍 **MCP Server**: http://localhost:8000  
- 📍 **UI Interface**: http://localhost:9000  
- 🏥 **Health Check**: http://localhost:8000/health  

## ✨ Key Features

### 🧠 Intelligence-First Framework
- **Mandatory Session Startup**: Automatic project context loading
- **Aggressive Memory Storage**: Everything stored automatically
- **Pattern Recognition**: AI-powered insights and learning
- **Universal IDE Support**: VS Code, Claude Desktop, Cursor, Windsurf

### 🛠️ MCP Tools
- `store_memory` - Intelligent memory storage with auto-tagging
- `search_memories` - Hybrid semantic/keyword search
- `get_insights` - AI-powered pattern analysis  
- `start_thinking` - Structured reasoning sequences
- `manage_tasks` - Project task management
- `manage_project` - Documentation and project management

### 🚀 Technology Stack
- **Database**: PostgreSQL with pgvector for embeddings
- **AI Models**: Local Ollama (mxbai-embed-large, qwen3:8b)
- **Frontend**: React with Material-UI
- **Backend**: Node.js with Express
- **Container**: Single Docker container for easy deployment

## 📋 Project Structure

```
MiniMe-MCP/
├── build/           # Docker build files and scripts
├── src/            # Main server source code
├── ui/             # React frontend application  
├── mcp-client/     # NPM package for MCP client
├── install/        # IDE configuration files
├── .claude/        # Claude Desktop settings
├── .vscode/        # VS Code configuration
└── Makefile        # Root delegator to build/Makefile
```

## 🔧 Development

```bash
# Development mode with hot reload
make dev-hot

# Debug mode with extensive logging  
make debug

# Run tests
make test

# Check system health
make health
```

## 📦 Builds

```bash
# Fast build (requires base image)
make build-fast-v2

# Full build with base image
make build-base && make build-fast-v2

# Clean build
make clean && make build-fast-v2
```

## 🎯 IDE Integration

Pre-configured for multiple IDEs:
- **Claude Desktop**: `install/mcp-config/claude-code/`
- **VS Code**: `install/mcp-config/vscode/`  
- **Cursor**: `install/mcp-config/cursor/`

See `install/INSTALL.md` for setup instructions.

## 📚 Documentation

- **Installation**: `install/INSTALL.md`
- **MCP Configuration**: `install/mcp-config/README.md`
- **API Documentation**: Available at `/api/docs` when running

## 🧪 Testing Fresh Installation

The system includes comprehensive test endpoints and health checks. See build logs for verification of:
- Database initialization
- AI model loading  
- MCP tool availability
- UI functionality

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