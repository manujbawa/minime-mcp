#!/bin/bash
set -e

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# Initialize PostgreSQL
init_postgresql() {
    log "Initializing PostgreSQL with pgvector..."
    
    export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-minime_password}"
    export POSTGRES_USER="${POSTGRES_USER:-minime}"
    export POSTGRES_DB="${POSTGRES_DB:-minime_memories}"
    export PGDATA="${PGDATA:-/data/postgres}"
    
    # Initialize database if needed
    if [ ! -d "$PGDATA" ] || [ -z "$(ls -A "$PGDATA" 2>/dev/null)" ]; then
        log "Creating new PostgreSQL cluster..."
        
        echo "$POSTGRES_PASSWORD" > /tmp/pgpass.tmp
        chmod 600 /tmp/pgpass.tmp
        
        /usr/lib/postgresql/15/bin/initdb -D "$PGDATA" \
            --auth-local=trust \
            --auth-host=scram-sha-256 \
            --username="$POSTGRES_USER" \
            --pwfile=/tmp/pgpass.tmp \
            --no-locale \
            --encoding=UTF8
            
        rm -f /tmp/pgpass.tmp
        
        # Basic PostgreSQL configuration
        cat >> "$PGDATA/postgresql.conf" <<EOF
listen_addresses = '*'
port = 5432
max_connections = 50
shared_buffers = 64MB
EOF

        cat > "$PGDATA/pg_hba.conf" <<EOF
local   all             all                                     trust
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             0.0.0.0/0               scram-sha-256
EOF
        
        log "PostgreSQL cluster initialized"
    fi
    
    # Start PostgreSQL
    log "Starting PostgreSQL server..."
    /usr/lib/postgresql/15/bin/pg_ctl -D "$PGDATA" -l /data/postgres.log -w -o "-F" start
    
    # Wait for PostgreSQL
    local attempt=1
    while [ $attempt -le 30 ]; do
        if /usr/lib/postgresql/15/bin/pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; then
            log "PostgreSQL is ready!"
            break
        fi
        if [ $attempt -eq 30 ]; then
            error "PostgreSQL failed to start"
            cat /data/postgres.log
            exit 1
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
    
    # Create database
    if ! /usr/lib/postgresql/15/bin/psql -U "$POSTGRES_USER" -lqt | cut -d \| -f 1 | grep -qw "$POSTGRES_DB"; then
        log "Creating database: $POSTGRES_DB"
        /usr/lib/postgresql/15/bin/createdb -U "$POSTGRES_USER" "$POSTGRES_DB"
        log "Database $POSTGRES_DB created"
    fi
    
    # Initialize database schema
    log "Initializing database schema with pgvector..."
    if /usr/lib/postgresql/15/bin/psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1 FROM information_schema.tables WHERE table_name = 'projects' LIMIT 1;" | grep -q "1 row"; then
        log "Database schema already exists, checking for new migrations..."
        
        # Always run migration check for existing databases
        if /usr/lib/postgresql/15/bin/psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /app/database/run-migrations.sql >/dev/null 2>&1; then
            log "Migration check completed"
        else
            warn "Migration check failed, but continuing..."
        fi
        
        # Sample data is now included in minime-startup.sql
        if [ "$LOAD_SAMPLE_DATA" = "true" ] || [ "$LOAD_SAMPLE_DATA" = "1" ]; then
            log "Sample data is included in the main initialization script"
        fi
    else
        log "Running database initialization scripts..."
        
        # Concatenate all SQL files into one to run in a single transaction
        log "Concatenating SQL files for single transaction execution..."
        cat /app/database/MINIME_TABLES_CREATE_01.sql > /tmp/complete_init.sql
        echo -e "\n\n-- =====================================================\n-- DATA INSERTION FROM MINIME_DATA_INSERT_02.sql\n-- =====================================================\n" >> /tmp/complete_init.sql
        cat /app/database/MINIME_DATA_INSERT_02.sql >> /tmp/complete_init.sql
        echo -e "\n\n-- =====================================================\n-- TEMPLATES INSERTION FROM MINIME_INSIGHT_TEMPLATES_INSERT_03.sql\n-- =====================================================\n" >> /tmp/complete_init.sql
        cat /app/database/MINIME_INSIGHT_TEMPLATES_INSERT_03.sql >> /tmp/complete_init.sql
        echo -e "\n\n-- =====================================================\n-- COMPLETION MARKER FROM MINIME_DATA_INSERTS_COMPLETE_MARKER_04.sql\n-- =====================================================\n" >> /tmp/complete_init.sql
        cat /app/database/MINIME_DATA_INSERTS_COMPLETE_MARKER_04.sql >> /tmp/complete_init.sql
        
        log "Executing complete initialization script..."
        /usr/lib/postgresql/15/bin/psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -e -f /tmp/complete_init.sql 2>&1 | tee /tmp/sql_complete.log
        if [ ${PIPESTATUS[0]} -eq 0 ]; then
            log "Database initialization completed successfully"
            
            # Sample data is loaded automatically by the SQL files
            if [ "$LOAD_SAMPLE_DATA" != "false" ] && [ "$LOAD_SAMPLE_DATA" != "0" ]; then
                log "Sample data loaded as part of initialization"
            fi
        else
            error "Database initialization failed. Check /tmp/sql_complete.log for details"
            tail -50 /tmp/sql_complete.log
            exit 1
        fi
    fi
    
    log "PostgreSQL with pgvector is ready and configured"
}

# Ollama is now running on host machine - no local initialization needed
init_ollama() {
    log "Skipping Ollama initialization - using host machine instance"
    log "Ollama host: ${OLLAMA_HOST_URL:-http://host.docker.internal:11434}"
}

# Health check for all services
check_services_health() {
    log "Performing health checks..."
    
    # Check PostgreSQL
    if /usr/lib/postgresql/15/bin/pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; then
        log "✓ PostgreSQL is healthy"
    else
        error "✗ PostgreSQL health check failed"
        return 1
    fi
    
    # Check Host Ollama
    OLLAMA_HOST_URL="${OLLAMA_HOST_URL:-http://host.docker.internal:11434}"
    if curl -s "$OLLAMA_HOST_URL/api/version" >/dev/null 2>&1; then
        log "✓ Host Ollama is healthy ($OLLAMA_HOST_URL)"
    else
        warn "⚠ Host Ollama health check failed - ensure Ollama is running on host machine"
    fi
    
    # Check embedding model availability on host
    if curl -s -X POST "$OLLAMA_HOST_URL/api/embeddings" \
        -H "Content-Type: application/json" \
        -d '{"model": "mxbai-embed-large:latest", "prompt": "health check"}' >/dev/null 2>&1; then
        log "✓ Host embedding model (mxbai-embed-large:latest) is healthy"
    else
        warn "⚠ Host embedding model check failed - ensure mxbai-embed-large:latest is available on host"
    fi
    
    log "Health checks complete"
}

# Start UI Server
start_ui_server() {
    log "Starting UI Server..."
    
    export UI_PORT="${UI_PORT:-9000}"
    export MCP_SERVER_URL="http://localhost:${MCP_PORT:-8000}"
    export NODE_ENV="${NODE_ENV:-production}"
    
    log "UI Server Environment:"
    log "  UI Port: $UI_PORT"
    log "  MCP Server URL: $MCP_SERVER_URL"
    
    cd /app/ui
    node server.js &
    UI_PID=$!
    log "UI Server started with PID: $UI_PID"
    echo $UI_PID > /tmp/ui-server.pid
}

# Start MCP Server
start_mcp_server() {
    log "Starting MCP Server..."
    
    export DATABASE_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:5432/$POSTGRES_DB"
    export MCP_PORT="${MCP_PORT:-8000}"
    export UI_PORT="${UI_PORT:-8080}"
    export NODE_ENV="${NODE_ENV:-production}"
    export DOCKER_ENV="true"
    export OLLAMA_HOST_URL="${OLLAMA_HOST_URL:-http://host.docker.internal:11434}"
    
    log "MCP Server Environment:"
    log "  Database: postgresql://***@localhost:5432/$POSTGRES_DB"
    log "  MCP Port: $MCP_PORT"
    log "  UI Port: $UI_PORT"
    log "  Ollama: $OLLAMA_HOST_URL"
    log "  Use Local Models: ${USE_LOCAL_MODELS:-false}"
    
    cd /app
    node src/server.js &
    MCP_PID=$!
    log "MCP Server started with PID: $MCP_PID"
    echo $MCP_PID > /tmp/mcp-server.pid
}

# Start both servers and wait
start_servers() {
    log "🚀 Starting both MCP and UI servers..."
    
    # Start MCP server first
    start_mcp_server
    sleep 3
    
    # Wait for MCP server to be fully ready
    log "⏳ Waiting for MCP server to be ready..."
    local attempt=1
    while [ $attempt -le 30 ]; do
        if curl -s http://localhost:${MCP_PORT:-8000}/health >/dev/null 2>&1; then
            log "✅ MCP server is ready!"
            break
        fi
        if [ $attempt -eq 30 ]; then
            warn "MCP server health check timeout"
            break
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
    
    # Start UI server after MCP is ready
    start_ui_server
    sleep 2
    
    log "✅ Both servers started successfully"
    log "📍 MCP Server: http://localhost:${MCP_PORT:-8000}"
    log "📍 UI Server: http://localhost:${UI_PORT:-9000}"
    
    # Wait for both processes
    wait $UI_PID $MCP_PID
}

# Cleanup function
cleanup() {
    log "Shutting down services..."
    
    # Stop UI server
    if [ -f "/tmp/ui-server.pid" ]; then
        UI_PID=$(cat /tmp/ui-server.pid)
        log "Stopping UI server (PID: $UI_PID)..."
        kill -TERM $UI_PID 2>/dev/null || true
        rm -f /tmp/ui-server.pid
    fi
    
    # Stop MCP server
    if [ -f "/tmp/mcp-server.pid" ]; then
        MCP_PID=$(cat /tmp/mcp-server.pid)
        log "Stopping MCP server (PID: $MCP_PID)..."
        kill -TERM $MCP_PID 2>/dev/null || true
        rm -f /tmp/mcp-server.pid
    fi
    
    # Stop PostgreSQL
    if [ -d "$PGDATA" ] && [ -f "$PGDATA/postmaster.pid" ]; then
        /usr/lib/postgresql/15/bin/pg_ctl -D "$PGDATA" stop -m smart -w
    fi
    exit 0
}

trap cleanup TERM INT

# Main execution
main() {
    log "🚀 Starting MiniMe-MCP with Local Models Support"
    log "Running as user: $(id -u):$(id -g)"
    
    export POSTGRES_USER="${POSTGRES_USER:-minime}"
    export POSTGRES_DB="${POSTGRES_DB:-minime_memories}"
    export PGDATA="${PGDATA:-/data/postgres}"
    
    # Show configuration
    info "Configuration:"
    info "  Host Ollama: ${OLLAMA_HOST_URL:-http://host.docker.internal:11434}"
    info "  PostgreSQL Data: $PGDATA"
    info "  MCP Port: ${MCP_PORT:-8000}"
    info "  UI Port: ${UI_PORT:-9000}"
    
    # Initialize services in order (database first, then ollama, then both servers)
    init_postgresql
    init_ollama
    check_services_health
    start_servers
}

main "$@"