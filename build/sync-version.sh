#!/bin/bash
# Sync version to package-lock.json files after version update

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "🔄 Syncing version to package-lock.json files..."

# Update src package-lock.json
if [ -f "$PROJECT_ROOT/src/package.json" ]; then
    echo "📦 Updating src/package-lock.json..."
    cd "$PROJECT_ROOT/src" && npm install --package-lock-only
fi

# Update ui package-lock.json
if [ -f "$PROJECT_ROOT/ui/package.json" ]; then
    echo "📦 Updating ui/package-lock.json..."
    cd "$PROJECT_ROOT/ui" && npm install --package-lock-only
fi

echo "✅ Version sync complete!"