#!/bin/bash
# ─── Health Check Script for Combined Container ───
# Verifies all three services are running:
#   1. Docker daemon
#   2. Floci
#   3. Dashboard

set -euo pipefail

# Check Docker daemon
if ! docker info > /dev/null 2>&1; then
    echo "Docker daemon not ready"
    exit 1
fi

# Check Floci
if ! curl -sf http://localhost:4566/_floci/health > /dev/null 2>&1; then
    echo "Floci not ready"
    exit 1
fi

# Check Dashboard
if ! curl -sf http://localhost:3000/api/healthz > /dev/null 2>&1; then
    echo "Dashboard not ready"
    exit 1
fi

exit 0
