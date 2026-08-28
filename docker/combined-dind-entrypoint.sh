#!/bin/bash
# ─── Combined Floci + Dashboard Entry Point (Docker-in-Docker Mode) ───
# This script starts:
#   1. Docker daemon (internal, no host socket)
#   2. Floci AWS emulator
#   3. Floci Dash UI
#
# Requirements:
#   - Container must run with --privileged or appropriate capabilities
#   - Named volumes for /var/lib/docker and /app/data

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ── Signal handling ──────────────────────────────────────────────────────
DOCKERD_PID=""
FLOCI_PID=""
DASHBOARD_PID=""

cleanup() {
    log_info "Shutting down services..."
    
    # Stop in reverse order: Dashboard → Floci → Docker
    for PID_VAR in DASHBOARD_PID FLOCI_PID DOCKERD_PID; do
        eval "PID=\${$PID_VAR:-}"
        if [ -n "$PID" ]; then
            log_info "Stopping ${PID_VAR%_PID} (PID $PID)..."
            kill -TERM "$PID" 2>/dev/null || true
            wait "$PID" 2>/dev/null || true
        fi
    done
    
    log_info "Shutdown complete"
    exit 0
}

trap cleanup SIGTERM SIGINT SIGQUIT

# ── Start Docker daemon ──────────────────────────────────────────────────
log_info "Starting Docker daemon..."
dockerd \
    --host=unix:///var/run/docker.sock \
    --storage-driver=overlay2 \
    --data-root=/var/lib/docker \
    --iptables=false \
    --bridge=none \
    --pidfile=/var/run/docker.pid \
    &>/var/log/docker.log &
DOCKERD_PID=$!

# Wait for Docker daemon to be ready
log_info "Waiting for Docker daemon..."
for i in $(seq 1 60); do
    if docker info > /dev/null 2>&1; then
        break
    fi
    if [ $i -eq 60 ]; then
        log_error "Docker daemon failed to start"
        cat /var/log/docker.log
        exit 1
    fi
    sleep 1
done
log_info "Docker daemon ready"

# ── Give the floci user access to the Docker socket ─────────────────────
# The daemon creates the socket as root:root with default perms; Floci runs
# as uid 1001 (floci) via gosu and needs group access to spawn containers.
groupadd -f docker
usermod -aG docker floci 2>/dev/null || true
chown root:docker /var/run/docker.sock 2>/dev/null || chgrp docker /var/run/docker.sock 2>/dev/null || true
chmod 660 /var/run/docker.sock

# ── Create Docker network for Floci containers ───────────────────────────
# This network will be used by all containers spawned by Floci (OpenSearch, Lambda, etc.)
FLOCI_NETWORK="floci-net"
if ! docker network inspect "$FLOCI_NETWORK" > /dev/null 2>&1; then
    log_info "Creating Docker network: $FLOCI_NETWORK"
    docker network create "$FLOCI_NETWORK"
fi
export FLOCI_SERVICES_DOCKER_NETWORK="$FLOCI_NETWORK"

# ── DinD hostname shim ───────────────────────────────────────────────────
# Floci's domain readiness check connects to http://{containerName}:9200 from
# this container's network namespace. Nested containers live on the inner
# floci-net bridge, which this container cannot join, so their names are not
# resolvable and Created would never flip to true. Keep /etc/hosts in sync
# with the inner daemon's containers (managed block, rewritten every 3s).
(
    while true; do
        {
            docker ps --format '{{.Names}}' 2>/dev/null | while read -r name; do
                # Docker 29 renders empty IPAddress as the literal "invalid IP";
                # containers may sit on several networks, so keep the first IPv4.
                ip=$(docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$v.IPAddress}} {{end}}' "$name" 2>/dev/null | tr ' ' '\n' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)
                [ -n "$ip" ] && echo "$ip $name"
            done
        } > /tmp/floci-nested-hosts 2>/dev/null || true
        # /etc/hosts is a bind mount: sed -i cannot rename it, so rewrite in place
        grep -v '# floci-dind-' /etc/hosts > /tmp/floci-hosts-base 2>/dev/null || true
        {
            cat /tmp/floci-hosts-base 2>/dev/null
            echo "# floci-dind-begin"
            cat /tmp/floci-nested-hosts 2>/dev/null
            echo "# floci-dind-end"
        } > /etc/hosts || true
        sleep 3
    done
) &>/dev/null &

# ── Fix permissions ──────────────────────────────────────────────────────
chown -R floci:floci /app/data 2>/dev/null || true
chmod 770 /app/data 2>/dev/null || true

# ── Start Floci ──────────────────────────────────────────────────────────
log_info "Starting Floci..."
gosu floci /app/application &>/var/log/floci.log &
FLOCI_PID=$!

# Wait for Floci to be healthy
log_info "Waiting for Floci..."
for i in $(seq 1 120); do
    if curl -sf http://localhost:4566/_floci/health > /dev/null 2>&1; then
        break
    fi
    if ! kill -0 $FLOCI_PID 2>/dev/null; then
        log_error "Floci died during startup"
        cat /var/log/floci.log
        exit 1
    fi
    if [ $i -eq 120 ]; then
        log_error "Floci failed to become healthy"
        cat /var/log/floci.log
        exit 1
    fi
    sleep 1
done
log_info "Floci ready"

# ── Start Dashboard ──────────────────────────────────────────────────────
log_info "Starting Dashboard..."
cd /app/dashboard
gosu floci node dist/backend/index.js &>/var/log/dashboard.log &
DASHBOARD_PID=$!

# Wait for Dashboard to be ready
log_info "Waiting for Dashboard..."
for i in $(seq 1 60); do
    if curl -sf http://localhost:3000/api/healthz > /dev/null 2>&1; then
        break
    fi
    if ! kill -0 $DASHBOARD_PID 2>/dev/null; then
        log_error "Dashboard died during startup"
        cat /var/log/dashboard.log
        exit 1
    fi
    if [ $i -eq 60 ]; then
        log_error "Dashboard failed to become healthy"
        cat /var/log/dashboard.log
        exit 1
    fi
    sleep 1
done
log_info "Dashboard ready"

# ── All services started ─────────────────────────────────────────────────
log_info "=== All services started ==="
log_info "  Dashboard:  http://localhost:3000"
log_info "  Floci API:  http://localhost:4566"
log_info "  OpenSearch: http://localhost:9400-9499 (after domain creation)"
log_info "  Network:    $FLOCI_NETWORK"
log_info "============================"

# ── Monitor all processes ────────────────────────────────────────────────
while true; do
    for PID_VAR in DOCKERD_PID FLOCI_PID DASHBOARD_PID; do
        eval "PID=\${$PID_VAR}"
        if ! kill -0 $PID 2>/dev/null; then
            log_error "${PID_VAR%_PID} died unexpectedly"
            exit 1
        fi
    done
    sleep 5
done
