# MiniMe-MCP v0.2.5

# 🚀 **The IDE Agent upgrade that creates your developer digital twin—across all your projects.**

Everyone's doing it now—**vibe coding** with AI assistants. That magical flow where you're thinking out loud, the AI gets it, and code just happens. But here's the problem: your AI has amnesia. Every conversation starts from zero. Every project feels like explaining yourself to a stranger.

**What if your AI could actually *remember*?**

---

## 🧠 **MiniMe-MCP: Your AI's Persistent Brain**

**Context Engineering for the Intelligence Age**

This isn't just another MCP server. This is your AI assistant's **digital hippocampus**—storing, connecting, and evolving with every interaction. While others ship features, you'll be **shipping intelligence.**

### **The Problem with Vibe Coding Today:**
- 🔄 **Endless repetition** — "Here's how we handle auth..." (for the 50th time)
- 🤷 **Context amnesia** — AI forgets your patterns, preferences, and decisions
- 🏝️ **Project islands** — Learning from one project never benefits another
- 📚 **Knowledge leakage** — Insights evaporate between sessions

### **The MiniMe-MCP Solution:**
```javascript
// Instead of this painful cycle:
"Hey AI, remember we use PostgreSQL with..."
"Oh, and we prefer functional components..."
"Also, we decided against Redis because..."

// You get this magical experience:
AI: "Based on your auth patterns from Project A and the scalability 
     lessons from Project B, here's how I'd approach this..."
```

---

## 🔮 **How Intelligence-First Development Works**

### **1. Memory That Actually Matters**
Your AI doesn't just remember—it **understands context**:
- **Decisions & Rationale**: Why you chose React over Vue (and when that changes)
- **Code Patterns**: Your team's conventions that make review faster
- **Architecture Evolution**: How your system design thinking has matured
- **Bug Solutions**: That tricky CORS fix from 6 months ago

### **2. Cross-Project Pattern Recognition**
The real magic happens when your AI connects dots across projects:

```markdown
💡 "I notice you're implementing JWT auth again. In your last 3 projects, 
   you always hit the same refresh token edge case around day 3. 
   Want me to handle that proactively this time?"

💡 "Your database connection patterns from ProjectA would solve the 
   performance issue you're seeing here. Should I adapt that approach?"

💡 "Based on your deployment history, this looks like the same nginx 
   config issue that blocked ProjectC. Here's the fix that worked..."
```

### **3. Context Engineering in Action**
Watch your AI assistant evolve from generic helper to **project-native intelligence**:

**Session 1**: Basic assistance  
**Session 10**: Knows your preferences  
**Session 100**: Predicts your needs  
**Session 1000**: **Thinks like your team**

---

## 🎯 **Real Benefits, Real Fast**

### **For Solo Developers:**
- **Instant Context Switching** — Jump between projects without losing momentum
- **Personal Documentation** — Your AI becomes your external brain
- **Pattern Evolution** — Improve your architecture thinking over time

### **For Teams:**
- **Shared Intelligence** — New team members inherit collective wisdom
- **Consistent Patterns** — AI enforces team conventions automatically  
- **Decision History** — Never wonder "why did we build it this way?"

### **For Organizations:**
- **Cross-Team Learning** — Best practices spread naturally
- **Knowledge Retention** — Insights survive team changes
- **Intelligent Onboarding** — New hires get context-aware assistance

---

## 🛠️ **Universal IDE Intelligence**

Works seamlessly across the entire development ecosystem:

**🎨 VS Code** → Enhanced Copilot with persistent memory  
**🚀 Cursor** → AI pair programming that actually remembers  
**⚡ Claude Desktop** → Conversations that build on each other  
**🌊 Windsurf** → Collaborative coding with shared context  
**🔗 Any MCP Client** → Future-proof intelligence layer

---

## ⚡ **The Intelligence Advantage**

```bash
# Traditional AI Development
You: "How should I structure this API?"
AI: "Here are some general patterns..."
Result: Generic advice, repeated research

# Intelligence-First Development  
You: "How should I structure this API?"
AI: "Based on your 3 previous APIs, scaling issues you hit with 
     ServiceX, and the clean architecture you loved in ProjectY, 
     here's an approach that fits your patterns..."
Result: Personalized, battle-tested guidance
```

---

## 🚀 **Ready to Upgrade Your Vibe?**

Stop explaining yourself to your AI. Start building with an assistant that **gets it.**

**MiniMe-MCP transforms every IDE session from:**
- ❌ "Let me explain our setup again..."  
- ✅ "You know what I'm trying to do. Let's build."

The future of development isn't just AI-assisted—it's **intelligence-amplified.**  
Your code. Your patterns. Your decisions. **Remembered. Connected. Evolved.**

**Welcome to vibe coding with a brain. 🧠**

---

*Built for the Model Context Protocol. Compatible with VS Code, Cursor, Claude Desktop, Windsurf, and the expanding universe of AI-powered development tools.*

## 🆕 What's New in v0.2.5

### Memory Type Restructuring
- **Clear separation** between working memories and project documents
- **Working memories**: notes, decisions, rules, code snippets, learnings, research, discussions, progress, tasks, debug logs
- **Project documents**: briefs, PRDs, implementation plans (use `manage_project` tool)

### Project Linkage System
- Create relationships between projects (parent/child, dependencies, forks)
- Visualize project connections with interactive graphs
- Share memories across linked projects with visibility controls

### Bug Fixes
- Fixed project link creation type errors
- Corrected SQL functions for relationship detection
- Improved tool descriptions to prevent confusion

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
  --restart unless-stopped \
  -p 5432:5432 \
  -p 8000:8000 \
  -p 9090:9000 \
  -v minime-mcp-v9:/data \
  -e POSTGRES_PASSWORD=minime_password \
  manujbawa/minimemcp:latest
```

**That's it!** MiniMe-MCP is now running:
- 📍 **MCP API**: http://localhost:8000
- 📍 **Web UI**: http://localhost:9090
- 🏥 **Health Check**: http://localhost:8000/health

## 🛠️ MCP Tools for Your IDE

### Install the MCP Client
```bash
npm install -g @minimemcp/mcp-client
```

### Available MCP Tools
- `store_memory` - Store working memories (notes, learnings, progress) with auto-tagging
- `search_memories` - Hybrid semantic/keyword search across all memories
- `get_insights` - AI-powered pattern analysis and trend detection
- `start_thinking` - Structured reasoning sequences for complex problems
- `manage_tasks` - Project task tracking and management
- `manage_project` - Create/update formal project documents (briefs, PRDs, plans)

## 🎯 IDE Integration

Configure your IDE to use MiniMe-MCP tools:

- **[Claude Desktop](install/mcp-config/claude-code/README.md)** - Full MCP support
- **[Cursor](install/mcp-config/cursor/README.md)** - Full MCP support
- **[VS Code](install/mcp-config/vscode/README.md)** - Supported with GitHub Copilot Chat v0.29+ (requires VS Code 1.102+)
- **[Windsurf](install/mcp-config/windsurf/README.md)** - Full MCP support

**Note for GitHub Organization users**: Your administrator must enable MCP in the organization's Copilot settings on GitHub.

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
  -p 5432:5432 -p 8000:8000 -p 9090:9000 \
  -v minime-mcp-v9:/data \
  manujbawa/minimemcp:latest
```

### Custom Ports
```bash
# Example: Run MCP API on port 8080 locally
docker run -d \
  --name minimemcp \
  -e POSTGRES_PASSWORD=minime_password \
  -p 5432:5432 -p 8080:8000 -p 9090:9000 \
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