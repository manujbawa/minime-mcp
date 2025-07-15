# MiniMe-MCP Docker Management Makefile

# Container configuration
CONTAINER_NAME := minimemcp
VERSION := 0.2.0
VOLUME_NAME := mineme-mcp-v9
DOCKERHUB_ORG := manujbawa
IMAGE_NAME := $(CONTAINER_NAME):$(VERSION)
IMAGE_LATEST := $(CONTAINER_NAME):latest
BASE_IMAGE_NAME := $(CONTAINER_NAME)-base:latest
DOCKERHUB_IMAGE := $(DOCKERHUB_ORG)/$(CONTAINER_NAME):$(VERSION)
DOCKERHUB_LATEST := $(DOCKERHUB_ORG)/$(CONTAINER_NAME):latest
DOCKERHUB_BASE := $(DOCKERHUB_ORG)/$(CONTAINER_NAME)-base:latest

.PHONY: help up down build build-ui build-docker build-base build-fast build-fast-v2 lint-ui logs shell status clean restart health test publish tag-hub login-hub init-volume clean-volume fresh-start seed-database

# Default target - do everything!
all: setup-env vendor-deps build up status
	@echo ""
	@echo "🎉 MiniMe-MCP is ready!"
	@echo "📍 Access: http://localhost:${MCP_PORT:-8000}"
	@echo "🏥 Health: http://localhost:${MCP_PORT:-8000}/health"
	@echo "🛠️ MCP Tools: http://localhost:9000/mcp-tools"
	@echo ""
	@echo "Use 'make logs' to watch startup progress"
	@echo "Use 'make test' to run comprehensive tests"

help:
	@echo "MiniMe-MCP Docker Management"
	@echo ""
	@echo "🚀 QUICK START:"
	@echo "  make all        - Setup, build, and start everything (one command!)"
	@echo "  make dev-hot    - Start development mode with UI hot reload"
	@echo ""
	@echo "Available targets:"
	@echo "  up          - Start all services (auto-creates volume)"
	@echo "  down        - Stop all services"
	@echo "  build       - Build fast app image (requires base image)"
	@echo "  build-base  - Build base image with Ollama, models, dependencies"
	@echo "  build-fast  - Build fast app image using base image"
	@echo "  build-fast-v2 - Build with Unified Insights v2 (pattern detection, LLM)"
	@echo "  vendor-deps - Download and cache external dependencies locally"
	@echo "  build-ui    - Build fresh UI assets only (includes ESLint)"
	@echo "  build-docker- Build Docker image with fresh UI (no cache)"
	@echo "  lint-ui     - Run ESLint checks only"
	@echo "  logs        - Show logs for all services"
	@echo "  shell       - Open shell in MCP server"
	@echo "  status      - Show services status and volume usage"
	@echo "  restart     - Restart all services"
	@echo "  clean       - Clean up everything (WARNING: deletes data)"
	@echo "  health      - Check health of all services"
	@echo "  test        - Run health checks and basic tests"
	@echo "  publish     - Tag and push to Docker Hub (requires login)"
	@echo "  tag-hub     - Tag local images for Docker Hub"
	@echo "  login-hub   - Login to Docker Hub"
	@echo ""
	@echo "🌍 Multi-platform builds (ARM64 + AMD64):"
	@echo "  build-multiarch-base - Build multi-platform base image locally"
	@echo "  build-multiarch-v2   - Build multi-platform v2 app image locally"
	@echo "  publish-multiarch-base - Build and push multi-platform base image"
	@echo "  publish-multiarch-v2 - Build and push multi-platform v2 app image"
	@echo "  publish-multiarch    - Publish all multi-platform images"
	@echo ""
	@echo "📦 Volume Management:"
	@echo "  init-volume    - Create data volume if it doesn't exist"
	@echo "  clean-volume   - Delete data volume (WARNING: deletes ALL data)"
	@echo "  fresh-start    - Delete volume + create new + start with sample data"
	@echo "  seed-database  - Add sample data to existing running container"
	@echo ""
	@echo "Service-specific targets:"
	@echo "  logs-db     - Show PostgreSQL logs"
	@echo "  logs-ollama - Show Ollama logs"
	@echo "  logs-mcp    - Show MCP server logs"
	@echo "  shell-db    - Open PostgreSQL shell"
	@echo "  shell-ollama- Open Ollama shell"
	@echo ""
	@echo "Development targets:"
	@echo "  dev-hot     - Start with UI hot reload (volume mounting)"
	@echo "  ui-rebuild  - Rebuild UI for hot reload mode (instant updates)"
	@echo "  dev-up      - Start development mode with local models"
	@echo ""
	@echo "Debug targets:"
	@echo "  debug       - Start with extensive MCP tool logging"
	@echo "  debug-rebuild - Rebuild and start with debug logging"  
	@echo "  debug-logs  - Watch debug logs (filtered)"
	@echo ""
	@echo "Setup targets:"
	@echo "  setup-env   - Create .env from template"
	@echo "  rebuild     - Complete rebuild (base + app images)"
	@echo "  quick-rebuild - Quick rebuild (app image only)"
	@echo "  update-ollama-host - Update Ollama on host and pull AI models"
	@echo "  check-base  - Check if base image needs rebuilding"
	@echo ""
	@echo "📦 NPM Package Management:"
	@echo "  mcp-build   - Build MCP client package"
	@echo "  mcp-test    - Test MCP client (includes build)"
	@echo "  mcp-publish - Publish to npm registry"
	@echo "  mcp-release - Full release process (test, publish, git tag)"
	@echo "  mcp-help    - Show all MCP client targets"
	@echo ""
	@echo "Environment:"
	@echo "  MCP_PORT=${MCP_PORT}"
	@echo "  POSTGRES_PASSWORD=${POSTGRES_PASSWORD}"

# Volume Management
init-volume:
	@echo "📦 Initializing data volume: $(VOLUME_NAME)"
	@docker volume create $(VOLUME_NAME) || true
	@echo "✅ Volume $(VOLUME_NAME) ready"

clean-volume:
	@echo "⚠️  This will DELETE ALL DATA in volume: $(VOLUME_NAME)"
	@read -p "Are you sure? (yes/no): " confirm && [ "$$confirm" = "yes" ]
	@make down || true
	@docker volume rm $(VOLUME_NAME) 2>/dev/null || true
	@echo "✅ Volume $(VOLUME_NAME) deleted"

fresh-start: clean-volume init-volume
	@echo "🆕 Starting with fresh database and data volume"
	@make up LOAD_SAMPLE_DATA=true
	@echo "✅ Fresh start complete with sample data!"

seed-database:
	@echo "ℹ️  Sample data is now automatically included in the database initialization"
	@echo "📌 The minime-startup.sql file contains both schema and seed data"
	@echo "✅ No manual seeding required - data is loaded on first startup"

# Main targets
up: init-volume
	docker run -d \
		--name $(CONTAINER_NAME) \
		-p 8000:8000 \
		-p 9000:9000 \
		-p 5432:5432 \
		-p 9229:9229 \
		-v $(VOLUME_NAME):/data \
		-e POSTGRES_PASSWORD=minime_password \
		-e MCP_PORT=8000 \
		-e UI_PORT=9000 \
		-e USE_LOCAL_MODELS=true \
		-e LOAD_SAMPLE_DATA=${LOAD_SAMPLE_DATA:-true} \
		-e MCP_DEBUG=${MCP_DEBUG:-false} \
		$(IMAGE_LATEST)
	@echo ""
	@echo "✅ MiniMe-MCP started!"
	@echo "📍 MCP Server: http://localhost:8000"
	@echo "📍 UI Server: http://localhost:9000"
	@echo "📍 Database: http://localhost:5432"
	@echo "🏥 Health check: http://localhost:8000/health"

# Run container with debug mode enabled
up-debug: init-volume
	docker run -d \
		--name $(CONTAINER_NAME) \
		-p 8000:8000 \
		-p 9000:9000 \
		-p 5432:5432 \
		-p 9229:9229 \
		-v $(VOLUME_NAME):/data \
		-e POSTGRES_PASSWORD=minime_password \
		-e MCP_PORT=8000 \
		-e UI_PORT=9000 \
		-e USE_LOCAL_MODELS=true \
		-e LOAD_SAMPLE_DATA=${LOAD_SAMPLE_DATA:-true} \
		-e MCP_DEBUG=${MCP_DEBUG:-false} \
		-e NODE_OPTIONS="--inspect=0.0.0.0:9229 --max-old-space-size=1024" \
		$(IMAGE_LATEST)
	@echo ""
	@echo "✅ MiniMe-MCP started!"
	@echo "📍 MCP Server: http://localhost:8000"
	@echo "📍 UI Server: http://localhost:9000"
	@echo "📍 Database: http://localhost:5432"
	@echo "🏥 Health check: http://localhost:8000/health"

down:
	docker stop $(CONTAINER_NAME) 2>/dev/null || true
	docker rm $(CONTAINER_NAME) 2>/dev/null || true

# Default build uses fast method (requires base image)
build: build-fast

# Build base image with all heavy dependencies (run this first or when dependencies change)
build-base:
	@echo "🔨 Building base image: $(BASE_IMAGE_NAME)..."
	@echo "⚠️  This downloads everything fresh (~6GB+ including Ollama + models)"
	@echo "📥 Will download: Node.js, pgvector, Ollama, mxbai-embed-large, qwen3:8b"
	docker build -f Dockerfile.base \
		--build-arg USER_ID=1001 \
		--build-arg GROUP_ID=1001 \
		--build-arg USE_LOCAL_MODELS=true \
		--no-cache \
		-t $(BASE_IMAGE_NAME) \
		..
	@echo "✅ Base image built: $(BASE_IMAGE_NAME)"

# Build fast application image using base image (quick builds for code changes)
build-fast:
	@echo "🔍 Checking if base image exists..."
	@if ! docker images --format '{{.Repository}}:{{.Tag}}' | grep -q "^$(BASE_IMAGE_NAME)$$"; then \
		echo "❌ Base image $(BASE_IMAGE_NAME) not found."; \
		echo "💡 Run 'make build-base' first to create the base image."; \
		exit 1; \
	fi
	@echo "🎨 Building UI assets..."
	@cd ../ui && npm run build
	@echo "🚀 Building fast app image: $(IMAGE_NAME)..."
	docker build -f Dockerfile.fast \
		--build-arg USER_ID=1001 \
		--build-arg GROUP_ID=1001 \
		-t $(IMAGE_NAME) \
		-t $(IMAGE_LATEST) \
		..
	@echo "✅ Fast build complete: $(IMAGE_NAME)"
	@echo "🔄 Restarting container with persistent data volume..."
	@make down 2>/dev/null || true
	@make up
	@echo "✅ Container restarted with minime-data volume mounted!"

# Build fast v2 application image with unified insights (requires base image)
build-fast-v2:
	@echo "🔍 Checking if base image exists..."
	@if ! docker images --format '{{.Repository}}:{{.Tag}}' | grep -q "^$(BASE_IMAGE_NAME)$$"; then \
		echo "❌ Base image $(BASE_IMAGE_NAME) not found."; \
		echo "💡 Run 'make build-base' first to create the base image."; \
		exit 1; \
	fi
	@echo "🎨 Building UI assets..."
	@cd ../ui && npm run build
	@echo "🚀 Building fast app image with Unified Insights v2: $(IMAGE_NAME)-v2..."
	@echo "✨ Features: Unified pattern detection, LLM category processing, smart enrichment"
	docker build -f Dockerfile.fast.v2 \
		--build-arg USER_ID=1001 \
		--build-arg GROUP_ID=1001 \
		-t $(IMAGE_NAME)-v2 \
		-t $(IMAGE_LATEST)-v2 \
		..
	@echo "✅ Fast v2 build complete: $(IMAGE_NAME)-v2"
	@echo "📊 Running database migrations for v2 schema..."
	@echo "🔄 Restarting container with v2 features enabled..."
	@make down 2>/dev/null || true
	@docker run -d \
		--name $(CONTAINER_NAME) \
		-p 8000:8000 \
		-p 9000:9000 \
		-p 5432:5432 \
		-v $(VOLUME_NAME):/data \
		-e POSTGRES_PASSWORD=minime_password \
		-e MCP_PORT=8000 \
		-e UI_PORT=9000 \
		-e USE_LOCAL_MODELS=true \
		-e LOAD_SAMPLE_DATA=${LOAD_SAMPLE_DATA:-true} \
		-e MCP_DEBUG=${MCP_DEBUG:-false} \
		-e INSIGHTS_VERSION=v2 \
		-e ENABLE_UNIFIED_INSIGHTS=true \
		$(IMAGE_LATEST)-v2
	@echo "✅ Container restarted with Unified Insights v2!"
	@echo "🎯 New v2 features enabled: Pattern detection, LLM categorization, Smart enrichment"

# Build with debug mode enabled
build-debug:
	@echo "🔍 Checking if base image exists..."
	@if ! docker images --format '{{.Repository}}:{{.Tag}}' | grep -q "^$(BASE_IMAGE_NAME)$$"; then \
		echo "❌ Base image $(BASE_IMAGE_NAME) not found."; \
		echo "💡 Run 'make build-base' first to create the base image."; \
		exit 1; \
	fi
	@echo "🎨 Building UI assets..."
	@cd ../ui && npm run build
	@echo "🚀 Building fast app image with debug: $(IMAGE_NAME)..."
	docker build -f Dockerfile.fast \
		--build-arg USER_ID=1001 \
		--build-arg GROUP_ID=1001 \
		-t $(IMAGE_NAME) \
		-t $(IMAGE_LATEST) \
		..
	@echo "✅ Fast build complete: $(IMAGE_NAME)"
	@echo "🔄 Restarting container with debug mode..."
	@make down 2>/dev/null || true
	@make up-debug
	@echo "✅ Container restarted in debug mode!"
	@echo "🔍 Node.js debugger available at: localhost:9229"
	@echo "📍 Use VS Code: Run 'Attach to Docker Container' configuration"


# Vendor external dependencies for offline builds
vendor-deps:
	@echo "📦 Vendoring external dependencies..."
	./vendor-dependencies.sh
	@echo "✅ Dependencies vendored successfully!"
	@echo "💡 Now you can use 'make build-optimized' for faster builds"

# Run ESLint checks only
lint-ui:
	@echo "🔍 Running ESLint checks..."
	@cd ../ui && npm run lint

# Build UI first (ensures fresh dist/ assets)
build-ui:
	@echo "🔍 Running ESLint checks..."
	@cd ../ui && npm run lint || (echo "❌ ESLint errors found, aborting build!" && exit 1)
	@echo "🎨 Building fresh UI assets..."
	@cd ../ui && npm run build
	@echo "✅ UI build complete"

# Build Docker image with no-cache to ensure fresh UI assets
build-docker: build-ui
	@echo "🔍 Checking vendored dependencies..."
	@if [ ! -d "vendor" ]; then \
		echo "❌ Vendored dependencies not found. Run 'make vendor-deps' first."; \
		exit 1; \
	fi
	@echo "🔍 Preparing local models..."
	./prepare-local-models.sh
	@echo "🔨 Building Docker image with fresh UI: $(IMAGE_NAME)..."
	docker build --no-cache -f Dockerfile \
		--build-arg USER_ID=1001 \
		--build-arg GROUP_ID=1001 \
		--build-arg USE_LOCAL_MODELS=true \
		-t $(IMAGE_NAME) \
		-t $(IMAGE_LATEST) \
		..
	@echo "✅ Docker build complete with fresh UI assets"

logs:
	docker logs -f $(CONTAINER_NAME)

shell:
	docker exec -it $(CONTAINER_NAME) /bin/sh

status:
	@echo "🔍 Container Status:"
	@docker ps -f name=$(CONTAINER_NAME) --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
	@echo ""
	@echo "💾 Volume Status:"
	@docker volume ls -f name=$(VOLUME_NAME)
	@echo ""
	@echo "📊 Volume Usage:"
	@if docker volume inspect $(VOLUME_NAME) >/dev/null 2>&1; then \
		echo "✅ Volume $(VOLUME_NAME) exists"; \
		if [ "$$(docker ps -q -f name=$(CONTAINER_NAME))" ]; then \
			echo "📁 Volume contents:"; \
			docker exec $(CONTAINER_NAME) sh -c "du -sh /data/* 2>/dev/null || echo 'Volume mounted but empty'"; \
		fi; \
	else \
		echo "❌ Volume $(VOLUME_NAME) does not exist"; \
	fi

restart:
	make down
	make up

clean:
	@echo "⚠️  This will delete ALL data including volumes!"
	@read -p "Are you sure? (yes/no): " confirm && [ "$$confirm" = "yes" ]
	make down
	docker rmi $(IMAGE_NAME) $(IMAGE_LATEST) 2>/dev/null || true
	docker volume rm $(VOLUME_NAME) 2>/dev/null || true

# Service-specific targets (single container)
logs-db:
	docker exec $(CONTAINER_NAME) tail -f /data/postgres.log

logs-ollama:
	docker exec $(CONTAINER_NAME) tail -f /var/log/ollama.log 2>/dev/null || echo "Ollama logs not available"

logs-mcp:
	docker logs $(CONTAINER_NAME) | grep "MCP"

shell-db:
	docker exec -it $(CONTAINER_NAME) /usr/lib/postgresql/15/bin/psql -U minime -d minime_memories

shell-ollama:
	docker exec -it $(CONTAINER_NAME) /bin/sh -c "ollama list"

# Health and testing
health:
	@echo "🔍 Checking service health..."
	@make status
	@echo ""
	@echo "🏥 Testing MCP health endpoint..."
	@curl -f http://localhost:${MCP_PORT:-8000}/health || echo "❌ Health check failed"

test: health
	@echo ""
	@echo "🧪 Running basic functionality tests..."
	@curl -s http://localhost:${MCP_PORT:-8000}/mcp/status | grep -q "MCP server ready" && echo "✅ MCP server is responding" || echo "❌ MCP server test failed"
	@echo ""
	@echo "📊 Testing database connection..."
	@docker exec $(CONTAINER_NAME) /usr/lib/postgresql/15/bin/pg_isready -U minime && echo "✅ Database is ready" || echo "❌ Database test failed"
	@echo ""
	@echo "🤖 Testing Ollama service..."
	@docker exec $(CONTAINER_NAME) curl -s http://localhost:11434/api/version > /dev/null && echo "✅ Ollama is responding" || echo "❌ Ollama test failed"

# Development targets
dev-up:
	@echo "🧪 Starting development mode with local models..."
	make build USE_LOCAL_MODELS=true
	make up USE_LOCAL_MODELS=true LOAD_SAMPLE_DATA=true

# Development mode with UI hot reload (volume mounting)
dev-hot: init-volume
	@echo "🔥 Starting development mode with UI hot reload..."
	@echo "📁 UI files will be served from local ui/dist/ directory"
	@echo "🔄 Run 'make ui-rebuild' to see changes instantly"
	@echo ""
	make down || true
	@cd ../ui && npm run build
	docker run -d \
		--name $(CONTAINER_NAME) \
		-p 8000:8000 \
		-p 9000:9000 \
		-p 5432:5432 \
		-v $(VOLUME_NAME):/data \
		-v $(shell cd .. && pwd)/ui/dist:/app/ui/dist \
		-e POSTGRES_PASSWORD=minime_password \
		-e MCP_PORT=8000 \
		-e UI_PORT=9000 \
		-e USE_LOCAL_MODELS=true \
		-e LOAD_SAMPLE_DATA=${LOAD_SAMPLE_DATA:-true} \
		-e NODE_ENV=development \
		-e MCP_DEBUG=${MCP_DEBUG:-false} \
		$(IMAGE_NAME)
	@echo ""
	@echo "✅ Development mode with UI hot reload started!"
	@echo "📍 MCP Server: http://localhost:8000"
	@echo "📍 UI Server: http://localhost:9000"
	@echo "🔥 UI hot reload: Volume mounted from local ui/dist/"
	@echo ""
	@echo "🚀 Quick workflow:"
	@echo "   make ui-rebuild  # Rebuild UI and see changes instantly"
	@echo "   make logs        # Watch container logs"

# Quick UI rebuild for hot reload mode
ui-rebuild:
	@echo "🔄 Rebuilding UI for hot reload..."
	@cd ../ui && npm run lint || (echo "❌ ESLint errors found!" && exit 1)
	@cd ../ui && npm run build
	@echo "✅ UI rebuilt! Refresh browser to see changes"
	@echo "📱 Access: http://localhost:9000"

dev-logs:
	docker logs -f $(CONTAINER_NAME)

# Debug mode - enables extensive MCP tool logging
debug:
	@echo "🐛 Starting debug mode with extensive logging..."
	make down || true
	MCP_DEBUG=true make up
	@echo ""
	@echo "🔍 Debug mode enabled! All MCP tool executions will be logged."
	@echo "📱 Use 'make logs' to see detailed execution traces"
	@echo "🛑 To disable debug mode, run: make restart"
	@echo ""
	@echo "⚠️  Note: If you made code changes, run 'make debug-rebuild' instead"

debug-rebuild:
	@echo "🔄 Rebuilding with debug mode enabled..."
	make down || true
	make build
	MCP_DEBUG=true make up
	@echo ""
	@echo "🔍 Debug mode enabled with fresh build!"
	@echo "📱 Use 'make debug-logs' to see detailed execution traces"

debug-logs:
	@echo "🐛 Watching debug logs..."
	docker logs -f $(CONTAINER_NAME) | grep -E "(DEBUG|TOOL-|MCP-|STORE_MEMORY)"

# Environment setup
setup-env:
	@if [ ! -f .env ]; then \
		cp .env.template .env && \
		echo "📝 Environment file created from template"; \
	else \
		echo "📝 Environment file already exists"; \
	fi

# Quick development workflow
dev-restart: down dev-up
	@echo "🔄 Development environment restarted"

# Complete rebuild (clean + build base + build app + start)
rebuild: down clean-images setup-env build-base build-fast up
	@echo "🔄 Complete rebuild finished!"

# Quick rebuild for code changes (uses existing base image)
quick-rebuild: down clean-app-images build-fast up
	@echo "🔄 Quick rebuild finished!"

# Update Ollama on host machine and pull AI models
update-ollama-host:
	@echo "🤖 Updating Ollama on host machine..."
	./update-ollama.sh host

clean-images:
	@echo "🧹 Cleaning old images..."
	@docker images | grep $(CONTAINER_NAME) | awk '{print $$3}' | xargs -r docker rmi --force || true

clean-app-images:
	@echo "🧹 Cleaning app images (keeping base image)..."
	@docker images --format '{{.Repository}}:{{.Tag}} {{.ID}}' | grep -E '^$(CONTAINER_NAME):(latest|$(VERSION))' | awk '{print $$2}' | xargs -r docker rmi --force || true

# Check if base image needs rebuilding
check-base:
	@echo "🔍 Checking base image status..."
	./check-base-image.sh status

# Watch logs during startup
watch-startup:
	@echo "👀 Watching startup logs (Ctrl+C to stop)..."
	@docker logs -f $(CONTAINER_NAME)

# Quick development workflow with logs
dev-start: setup-env build
	@echo "🚀 Starting development environment..."
	@make up
	@echo "📊 Checking status..."
	@sleep 5
	@make status
	@echo ""
	@echo "📱 Use 'make logs' to watch progress"

# Multi-platform builds
build-multiarch-base:
	@echo "🌍 Building multi-platform base image (AMD64 + ARM64)..."
	@echo "🔍 Setting up buildx..."
	docker buildx use multiarch-builder || docker buildx create --name multiarch-builder --use
	@echo "🔨 Building base image for multiple platforms..."
	docker buildx build -f Dockerfile.base \
		--platform linux/amd64,linux/arm64 \
		--build-arg USER_ID=1001 \
		--build-arg GROUP_ID=1001 \
		--build-arg USE_LOCAL_MODELS=true \
		-t $(BASE_IMAGE_NAME) \
		--load \
		..
	@echo "✅ Multi-platform base image built locally"

build-multiarch-v2:
	@echo "🌍 Building multi-platform app v2 image (AMD64 + ARM64)..."
	@echo "🎨 Building UI assets..."
	@cd ../ui && npm run build
	@echo "🔍 Using buildx builder..."
	docker buildx use multiarch-builder || docker buildx create --name multiarch-builder --use
	@echo "🔨 Building v2 image for multiple platforms..."
	docker buildx build -f Dockerfile.fast.v2 \
		--platform linux/amd64,linux/arm64 \
		--build-arg USER_ID=1001 \
		--build-arg GROUP_ID=1001 \
		-t $(IMAGE_NAME)-v2 \
		-t $(IMAGE_LATEST)-v2 \
		--load \
		..
	@echo "✅ Multi-platform v2 image built locally"

publish-multiarch-base:
	@echo "🌍 Building and pushing multi-platform base image to Docker Hub..."
	@echo "🔍 Using buildx builder..."
	docker buildx use multiarch-builder || docker buildx create --name multiarch-builder --use
	@echo "🔨 Building and pushing base image..."
	docker buildx build -f Dockerfile.base \
		--platform linux/amd64,linux/arm64 \
		--build-arg USER_ID=1001 \
		--build-arg GROUP_ID=1001 \
		--build-arg USE_LOCAL_MODELS=true \
		-t $(DOCKERHUB_BASE) \
		--push \
		..
	@echo "✅ Multi-platform base image pushed to Docker Hub"

publish-multiarch-v2:
	@echo "🌍 Building and pushing multi-platform v2 image to Docker Hub..."
	@echo "🎨 Building UI assets..."
	@cd ../ui && npm run build
	@echo "🔍 Using buildx builder..."
	docker buildx use multiarch-builder || docker buildx create --name multiarch-builder --use
	@echo "🔨 Building and pushing v2 image..."
	docker buildx build -f Dockerfile.fast.v2 \
		--platform linux/amd64,linux/arm64 \
		--build-arg USER_ID=1001 \
		--build-arg GROUP_ID=1001 \
		-t $(DOCKERHUB_IMAGE) \
		-t $(DOCKERHUB_LATEST) \
		--push \
		..
	@echo "✅ Multi-platform v2 image pushed to Docker Hub"
	@echo "🔗 Available at: https://hub.docker.com/r/$(DOCKERHUB_ORG)/$(CONTAINER_NAME)"
	@echo ""
	@echo "📋 Platforms supported: linux/amd64, linux/arm64"

publish-multiarch: publish-multiarch-base publish-multiarch-v2
	@echo "✅ All multi-platform images published!"

# Docker Hub Publishing
login-hub:
	@echo "🔐 Logging in to Docker Hub..."
	docker login

tag-hub:
	@echo "🏷️  Tagging images for Docker Hub..."
	docker tag $(IMAGE_NAME) $(DOCKERHUB_IMAGE)
	docker tag $(IMAGE_LATEST) $(DOCKERHUB_LATEST)
	@echo "✅ Images tagged:"
	@echo "   $(IMAGE_NAME) → $(DOCKERHUB_IMAGE)"
	@echo "   $(IMAGE_LATEST) → $(DOCKERHUB_LATEST)"

publish: tag-hub
	@echo "🚀 Publishing to Docker Hub..."
	@echo "📦 Pushing $(DOCKERHUB_IMAGE)..."
	docker push $(DOCKERHUB_IMAGE)
	@echo "📦 Pushing $(DOCKERHUB_LATEST)..."
	docker push $(DOCKERHUB_LATEST)
	@echo ""
	@echo "✅ Successfully published to Docker Hub!"
	@echo "🔗 Available at: https://hub.docker.com/r/$(DOCKERHUB_ORG)/$(CONTAINER_NAME)"
	@echo ""
	@echo "📋 To use published image:"
	@echo "   docker pull $(DOCKERHUB_IMAGE)"
	@echo "   docker run -d -p 8000:8000 -p 9000:9000 $(DOCKERHUB_IMAGE)"

# Legacy compatibility (from old Makefile)
run: up
stop: down

# ==========================================
# MCP Client NPM Package Management
# ==========================================

# MCP Client configuration
MCP_CLIENT_DIR := ../mcp-client
MCP_CLIENT_NAME := @minimemcp/mcp-client
MCP_CLIENT_VERSION := $(shell cd $(MCP_CLIENT_DIR) && node -p "require('./package.json').version")

# Build the MCP client
mcp-build:
	@echo "🔨 Building MCP client..."
	@cd $(MCP_CLIENT_DIR) && npm install
	@cd $(MCP_CLIENT_DIR) && npm run build || echo "No build script, skipping..."
	@echo "✅ MCP client build complete"

# Test the MCP client
mcp-test: mcp-build
	@echo "🧪 Testing MCP client..."
	@cd $(MCP_CLIENT_DIR) && npm test || echo "No test script, skipping..."
	@echo "📦 Creating test package..."
	@cd $(MCP_CLIENT_DIR) && npm pack
	@echo "🔍 Testing global installation..."
	@cd $(MCP_CLIENT_DIR) && npm install -g ./minimemcp-mcp-client-*.tgz
	@echo "✅ Testing CLI command..."
	@minime-mcp --version || echo "CLI test complete"
	@echo "🧹 Cleaning up test installation..."
	@npm uninstall -g $(MCP_CLIENT_NAME)
	@cd $(MCP_CLIENT_DIR) && rm -f ./minimemcp-mcp-client-*.tgz
	@echo "✅ MCP client tests complete"

# Check if ready to publish
mcp-check:
	@echo "🔍 Pre-publish checks for MCP client..."
	@echo "📋 Package: $(MCP_CLIENT_NAME)"
	@echo "📌 Version: $(MCP_CLIENT_VERSION)"
	@echo ""
	@echo "Checking npm login status..."
	@npm whoami || (echo "❌ Not logged in to npm. Run 'npm login' first" && exit 1)
	@echo ""
	@echo "Checking package.json..."
	@cd $(MCP_CLIENT_DIR) && npm pkg get name version description author repository
	@echo ""
	@echo "Files to be published:"
	@cd $(MCP_CLIENT_DIR) && npm pack --dry-run 2>&1 | grep -E "npm notice" | tail -n +2
	@echo ""
	@echo "✅ Pre-publish checks complete"

# Bump version (patch, minor, or major)
mcp-version:
	@echo "📝 Current version: $(MCP_CLIENT_VERSION)"
	@echo "Choose version bump type:"
	@echo "  make mcp-version-patch  - Bump patch version (x.x.X)"
	@echo "  make mcp-version-minor  - Bump minor version (x.X.x)"
	@echo "  make mcp-version-major  - Bump major version (X.x.x)"

mcp-version-patch:
	@echo "⬆️ Bumping patch version..."
	@cd $(MCP_CLIENT_DIR) && npm version patch
	@echo "✅ Version bumped to $$(cd $(MCP_CLIENT_DIR) && node -p \"require('./package.json').version\")"

mcp-version-minor:
	@echo "⬆️ Bumping minor version..."
	@cd $(MCP_CLIENT_DIR) && npm version minor
	@echo "✅ Version bumped to $$(cd $(MCP_CLIENT_DIR) && node -p \"require('./package.json').version\")"

mcp-version-major:
	@echo "⬆️ Bumping major version..."
	@cd $(MCP_CLIENT_DIR) && npm version major
	@echo "✅ Version bumped to $$(cd $(MCP_CLIENT_DIR) && node -p \"require('./package.json').version\")"

# Publish to npm (dry run)
mcp-publish-dry:
	@echo "🚀 Dry run: Publishing MCP client to npm..."
	@cd $(MCP_CLIENT_DIR) && npm publish --dry-run --access public

# Publish to npm (actual)
mcp-publish: mcp-test mcp-check
	@echo "🚀 Publishing MCP client to npm..."
	@echo "📦 Publishing $(MCP_CLIENT_NAME)@$(MCP_CLIENT_VERSION)..."
	@cd $(MCP_CLIENT_DIR) && npm publish --access public
	@echo ""
	@echo "✅ Successfully published to npm!"
	@echo "🔗 View at: https://www.npmjs.com/package/$(MCP_CLIENT_NAME)"
	@echo ""
	@echo "📋 Installation:"
	@echo "   npm install -g $(MCP_CLIENT_NAME)"
	@echo ""
	@echo "📋 Next steps:"
	@echo "   1. Create a git tag: git tag mcp-v$(MCP_CLIENT_VERSION)"
	@echo "   2. Push the tag: git push origin mcp-v$(MCP_CLIENT_VERSION)"

# Full release process
mcp-release: mcp-test mcp-check
	@echo "🎯 MCP Client Release Process"
	@echo "=============================="
	@echo "Current version: $(MCP_CLIENT_VERSION)"
	@echo ""
	@echo "This will:"
	@echo "  1. Run tests"
	@echo "  2. Publish to npm"
	@echo "  3. Create and push git tag"
	@echo ""
	@read -p "Continue? (y/N) " confirm && [ "$$confirm" = "y" ] || exit 1
	@echo ""
	@make mcp-publish
	@echo ""
	@echo "🏷️ Creating git tag..."
	@git tag "mcp-v$(MCP_CLIENT_VERSION)" -m "Release MCP client v$(MCP_CLIENT_VERSION)"
	@echo "📤 Pushing tag to origin..."
	@git push origin "mcp-v$(MCP_CLIENT_VERSION)"
	@echo ""
	@echo "🎉 Release complete!"

# Help for MCP targets
mcp-help:
	@echo ""
	@echo "📦 MCP CLIENT NPM TARGETS:"
	@echo "=========================="
	@echo "  make mcp-build         - Build the MCP client"
	@echo "  make mcp-test          - Test the MCP client (includes build)"
	@echo "  make mcp-check         - Pre-publish checks"
	@echo ""
	@echo "📌 Version Management:"
	@echo "  make mcp-version       - Show version options"
	@echo "  make mcp-version-patch - Bump patch version (1.0.X)"
	@echo "  make mcp-version-minor - Bump minor version (1.X.0)"
	@echo "  make mcp-version-major - Bump major version (X.0.0)"
	@echo ""
	@echo "🚀 Publishing:"
	@echo "  make mcp-publish-dry   - Dry run (see what would be published)"
	@echo "  make mcp-publish       - Publish to npm (runs tests first)"
	@echo "  make mcp-release       - Full release (test, publish, git tag)"
	@echo ""
	@echo "📋 Current Status:"
	@echo "  Package: $(MCP_CLIENT_NAME)"
	@echo "  Version: $(MCP_CLIENT_VERSION)"
	@echo "  Directory: $(MCP_CLIENT_DIR)"