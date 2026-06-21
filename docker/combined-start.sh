#!/bin/sh
# ─── Combined Floci + Dashboard startup ───
# Runs as the `floci` user (Floci entrypoint handles gosu + docker socket).
# Starts Floci in the background, waits for its health check, then starts
# the Dashboard in the foreground (PID 1, so it receives Docker signals).

set -eu

# ── 1. Start Floci ────────────────────────────────────
echo "[combined] Starting Floci..."
/app/application &
FLOCI_PID=$!

# ── 2. Wait for Floci health ──────────────────────────
echo "[combined] Waiting for Floci to be healthy..."
i=0
while [ $i -lt 60 ]; do
    i=$((i + 1))
    if curl -sf http://localhost:4566/_floci/health > /dev/null 2>&1; then
        echo "[combined] Floci is ready!"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "[combined] ERROR: Timed out waiting for Floci to become healthy"
        kill "$FLOCI_PID" 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# ── 3. Start Dashboard ────────────────────────────────
echo "[combined] Starting Floci Dash..."
cd /app/dashboard
exec node dist/backend/index.js
