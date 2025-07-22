#!/bin/bash
# Version management script for MiniMe-MCP
# Single source of truth: ./VERSION file

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
VERSION_FILE="$PROJECT_ROOT/VERSION"

# Function to display usage
usage() {
    echo "Usage: $0 [major|minor|patch|set <version>|current]"
    echo ""
    echo "Commands:"
    echo "  major    - Increment major version (X.0.0)"
    echo "  minor    - Increment minor version (0.X.0)"
    echo "  patch    - Increment patch version (0.0.X)"
    echo "  set      - Set specific version (e.g., set 1.2.3)"
    echo "  current  - Display current version"
    echo ""
    echo "Examples:"
    echo "  $0 patch                # 0.2.0 -> 0.2.1"
    echo "  $0 minor                # 0.2.1 -> 0.3.0"
    echo "  $0 major                # 0.3.0 -> 1.0.0"
    echo "  $0 set 2.0.0-beta.1     # Set to 2.0.0-beta.1"
    exit 1
}

# Function to read current version
get_current_version() {
    if [ ! -f "$VERSION_FILE" ]; then
        echo "0.1.0"
    else
        cat "$VERSION_FILE"
    fi
}

# Function to validate version format
validate_version() {
    local version=$1
    if ! echo "$version" | grep -E '^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?$' > /dev/null; then
        echo -e "${RED}Error: Invalid version format: $version${NC}"
        echo "Version must be in format: MAJOR.MINOR.PATCH or MAJOR.MINOR.PATCH-PRERELEASE"
        exit 1
    fi
}

# Function to increment version
increment_version() {
    local version=$1
    local type=$2
    
    # Extract base version (without prerelease)
    local base_version=$(echo "$version" | cut -d'-' -f1)
    local major=$(echo "$base_version" | cut -d'.' -f1)
    local minor=$(echo "$base_version" | cut -d'.' -f2)
    local patch=$(echo "$base_version" | cut -d'.' -f3)
    
    case "$type" in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
    esac
    
    echo "$major.$minor.$patch"
}

# Function to update version in a file
update_file_version() {
    local file=$1
    local old_version=$2
    local new_version=$3
    local pattern=$4
    
    if [ -f "$file" ]; then
        # Create backup
        cp "$file" "$file.bak"
        
        # Update version based on pattern
        case "$pattern" in
            "makefile")
                sed -i '' "s/VERSION := $old_version/VERSION := $new_version/g" "$file"
                ;;
            "package.json")
                sed -i '' "s/\"version\": \"$old_version\"/\"version\": \"$new_version\"/g" "$file"
                ;;
            "dockerfile")
                sed -i '' "s/version=\"$old_version\"/version=\"$new_version\"/g" "$file"
                ;;
            "javascript")
                sed -i '' "s/version: \"$old_version\"/version: \"$new_version\"/g" "$file"
                sed -i '' "s/version: '$old_version'/version: '$new_version'/g" "$file"
                ;;
            "ui")
                sed -i '' "s/v$old_version/v$new_version/g" "$file"
                sed -i '' "s/MiniMe MCP v$old_version/MiniMe MCP v$new_version/g" "$file"
                ;;
        esac
        
        # Check if update was successful
        if grep -q "$new_version" "$file"; then
            rm "$file.bak"
            echo -e "${GREEN}✓${NC} Updated $file"
        else
            mv "$file.bak" "$file"
            echo -e "${YELLOW}⚠${NC} No changes in $file"
        fi
    fi
}

# Main logic
case "${1:-current}" in
    current)
        CURRENT_VERSION=$(get_current_version)
        echo "Current version: $CURRENT_VERSION"
        ;;
    major|minor|patch)
        CURRENT_VERSION=$(get_current_version)
        NEW_VERSION=$(increment_version "$CURRENT_VERSION" "$1")
        ;;
    set)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Version number required${NC}"
            usage
        fi
        NEW_VERSION="$2"
        validate_version "$NEW_VERSION"
        CURRENT_VERSION=$(get_current_version)
        ;;
    *)
        usage
        ;;
esac

# If we have a new version, update all files
if [ ! -z "$NEW_VERSION" ] && [ "$NEW_VERSION" != "$CURRENT_VERSION" ]; then
    echo -e "${YELLOW}Updating version from $CURRENT_VERSION to $NEW_VERSION${NC}"
    echo ""
    
    # Update VERSION file first
    echo "$NEW_VERSION" > "$VERSION_FILE"
    echo -e "${GREEN}✓${NC} Updated VERSION file"
    
    # Update Makefile
    update_file_version "$PROJECT_ROOT/build/Makefile" "$CURRENT_VERSION" "$NEW_VERSION" "makefile"
    
    # Update package.json files
    update_file_version "$PROJECT_ROOT/src/package.json" "$CURRENT_VERSION" "$NEW_VERSION" "package.json"
    update_file_version "$PROJECT_ROOT/ui/package.json" "$CURRENT_VERSION" "$NEW_VERSION" "package.json"
    
    # Update Dockerfile
    update_file_version "$PROJECT_ROOT/build/Dockerfile.fast.v2.multiarch" "$CURRENT_VERSION" "$NEW_VERSION" "dockerfile"
    
    # Update JavaScript files
    update_file_version "$PROJECT_ROOT/src/routes/mcp.js" "$CURRENT_VERSION" "$NEW_VERSION" "javascript"
    update_file_version "$PROJECT_ROOT/src/services/mcp-resources.js" "$CURRENT_VERSION" "$NEW_VERSION" "javascript"
    update_file_version "$PROJECT_ROOT/src/mcp-server/index.js" "$CURRENT_VERSION" "$NEW_VERSION" "javascript"
    
    # UI files now get version from environment variable at build time - no need to update them
    
    echo ""
    echo -e "${GREEN}Version updated successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run 'cd $PROJECT_ROOT/src && npm install' to update package-lock.json"
    echo "2. Run 'cd $PROJECT_ROOT/ui && npm install' to update package-lock.json"
    echo "3. Commit all changes with: git commit -am \"Bump version to $NEW_VERSION\""
    echo "4. Tag the release: git tag v$NEW_VERSION"
    echo "5. Build and publish: make build-fast-v2 && make publish-multiarch-v2"
fi