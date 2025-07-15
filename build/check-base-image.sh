#!/bin/bash
set -e

# Check if base image needs rebuilding
# Returns 0 if base image is up to date, 1 if it needs rebuilding

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[CHECK-BASE]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[CHECK-BASE] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[CHECK-BASE] ERROR:${NC} $1" >&2
}

info() {
    echo -e "${BLUE}[CHECK-BASE] INFO:${NC} $1"
}

BASE_IMAGE_NAME="minimcp-base:latest"
FORCE_REBUILD="${1:-false}"

check_base_image() {
    log "🔍 Checking base image status..."
    
    # Force rebuild if requested
    if [ "$FORCE_REBUILD" = "true" ] || [ "$FORCE_REBUILD" = "--force" ]; then
        warn "🔄 Force rebuild requested"
        return 1
    fi
    
    # Check if base image exists
    if ! docker images --format '{{.Repository}}:{{.Tag}}' | grep -q "^${BASE_IMAGE_NAME}$"; then
        warn "❌ Base image ${BASE_IMAGE_NAME} not found"
        info "💡 Run 'make build-base' to create the base image"
        return 1
    fi
    
    info "✅ Base image ${BASE_IMAGE_NAME} exists"
    
    # Get base image creation time
    local base_created=$(docker images --format '{{.CreatedAt}}' --filter "reference=${BASE_IMAGE_NAME}" | head -1)
    info "📅 Base image created: $base_created"
    
    # Check if critical files have changed since base image was created
    local files_to_check=(
        "build/Dockerfile.base"
        "build/update-ollama.sh" 
        "build/vendor-dependencies.sh"
        "build/prepare-local-models.sh"
    )
    
    local needs_rebuild=false
    local base_timestamp=$(docker inspect --format='{{.Created}}' "${BASE_IMAGE_NAME}" 2>/dev/null | cut -d'T' -f1 | tr -d '-')
    
    for file in "${files_to_check[@]}"; do
        if [ -f "$file" ]; then
            # Get file modification time in YYYYMMDD format
            local file_timestamp
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                file_timestamp=$(stat -f "%Sm" -t "%Y%m%d" "$file" 2>/dev/null || echo "00000000")
            else
                # Linux
                file_timestamp=$(stat -c "%Y" "$file" 2>/dev/null | xargs -I {} date -d "@{}" +"%Y%m%d" || echo "00000000")
            fi
            
            if [ "$file_timestamp" -gt "$base_timestamp" ]; then
                warn "🔄 $file modified after base image creation"
                needs_rebuild=true
            else
                info "✅ $file is up to date"
            fi
        else
            warn "⚠️  $file not found"
        fi
    done
    
    # Check if vendor directory exists and is populated
    if [ ! -d "vendor" ] || [ -z "$(find vendor -name '*.sh' -o -name 'ollama-*' | head -1)" ]; then
        warn "📦 Vendor dependencies missing or incomplete"
        info "💡 Run 'make vendor-deps' first"
        return 1
    fi
    
    # Check if local models are available
    if [ ! -d "local-ollama-models" ] || [ ! -f "local-ollama-models/model-inventory.json" ]; then
        warn "🤖 Local models not prepared"
        info "💡 Local models will be downloaded at runtime"
        # This is not a hard requirement, so don't force rebuild
    fi
    
    # Check Ollama version on host vs what might be in base image
    local host_ollama_version=""
    if command -v ollama >/dev/null 2>&1; then
        host_ollama_version=$(ollama --version 2>/dev/null | head -1 | cut -d' ' -f3 || echo "unknown")
        info "🤖 Host Ollama version: $host_ollama_version"
    else
        warn "🤖 Ollama not found on host"
    fi
    
    if [ "$needs_rebuild" = true ]; then
        warn "🔄 Base image rebuild recommended due to file changes"
        return 1
    fi
    
    log "✅ Base image is up to date"
    return 0
}

show_status() {
    log "📊 Base Image Status Report"
    echo ""
    
    # Image info
    if docker images --format '{{.Repository}}:{{.Tag}}' | grep -q "^${BASE_IMAGE_NAME}$"; then
        local image_info=$(docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}' --filter "reference=${BASE_IMAGE_NAME}")
        echo "$image_info"
    else
        echo "❌ Base image not found"
    fi
    
    echo ""
    
    # Dependencies status
    echo "📦 Dependencies:"
    if [ -d "vendor" ]; then
        local vendor_size=$(du -sh vendor 2>/dev/null | cut -f1 || echo "unknown")
        echo "  ✅ Vendor directory: $vendor_size"
    else
        echo "  ❌ Vendor directory missing"
    fi
    
    if [ -d "local-ollama-models" ]; then
        local models_size=$(du -sh local-ollama-models 2>/dev/null | cut -f1 || echo "unknown")
        echo "  ✅ Local models: $models_size"
    else
        echo "  ⚠️  Local models not prepared (will download at runtime)"
    fi
    
    echo ""
    
    # Recommendations
    echo "💡 Next Steps:"
    if ! docker images --format '{{.Repository}}:{{.Tag}}' | grep -q "^${BASE_IMAGE_NAME}$"; then
        echo "  1. Run 'make vendor-deps' to prepare dependencies"
        echo "  2. Run 'make build-base' to create base image"
    else
        echo "  1. Run 'make build-fast' for quick app builds"
        echo "  2. Run 'make quick-rebuild' for code changes"
        echo "  3. Run '$0 --force' to force base image rebuild"
    fi
}

main() {
    local action="${1:-check}"
    
    case "$action" in
        "check")
            if check_base_image; then
                exit 0
            else
                exit 1
            fi
            ;;
        "status")
            show_status
            ;;
        "--force"|"force")
            log "🔄 Force rebuild mode"
            exit 1
            ;;
        *)
            echo "Usage: $0 [check|status|--force]"
            echo ""
            echo "Commands:"
            echo "  check   - Check if base image needs rebuilding (default)"
            echo "  status  - Show detailed base image status"
            echo "  --force - Force base image rebuild"
            echo ""
            echo "Exit codes:"
            echo "  0 - Base image is up to date"
            echo "  1 - Base image needs rebuilding"
            exit 1
            ;;
    esac
}

main "$@"