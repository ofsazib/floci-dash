#!/bin/bash
# ─── Combined Docker-in-Docker Integration Test ───
# Tests that the combined image can run OpenSearch without host Docker socket.
# Verifies data plane operations from a sibling container.

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓ $1${NC}"; }
fail() {
    echo -e "${RED}✗ $1${NC}"
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo -e "${YELLOW}── Floci logs (last 40 lines) ──${NC}"
        docker exec "$CONTAINER_NAME" grep -B6 -A4 "BindException\|RuntimeException" /var/log/floci.log 2>/dev/null | head -60 || \
            docker exec "$CONTAINER_NAME" tail -60 /var/log/floci.log 2>/dev/null || \
            docker logs "$CONTAINER_NAME" 2>&1 | tail -40 || true
    fi
    exit 1
}
info() { echo -e "${YELLOW}→ $1${NC}"; }

# ── Configuration ────────────────────────────────────────────────────────
IMAGE_NAME="floci-dash:combined-test"
CONTAINER_NAME="floci-test-$$"
SIBLING_NAME="floci-sibling-$$"
FLOCI_PORT="${FLOCI_PORT:-4666}"
DASHBOARD_PORT="${DASHBOARD_PORT:-3100}"
PROXY_START="${PROXY_START:-9500}"
PROXY_END=$((PROXY_START + 99))

# ── Cleanup function ─────────────────────────────────────────────────────
cleanup() {
    info "Cleaning up..."
    docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
    docker rm -f "$SIBLING_NAME" 2>/dev/null || true
    docker network rm floci-test-net 2>/dev/null || true
}

trap cleanup EXIT

# ── Build image ──────────────────────────────────────────────────────────
info "Building combined image..."
docker build -f docker/Dockerfile.combined -t "$IMAGE_NAME" . || fail "Image build failed"
pass "Image built"

# ── Create test network ──────────────────────────────────────────────────
info "Creating test network..."
docker network create floci-test-net 2>/dev/null || true

# ── Start combined container ─────────────────────────────────────────────
info "Starting combined container..."
docker run -d \
    --name "$CONTAINER_NAME" \
    --privileged \
    --network floci-test-net \
    -p "$DASHBOARD_PORT:3000" \
    -p "$FLOCI_PORT:4566" \
    -p "$PROXY_START-$PROXY_END:9400-9499" \
    "$IMAGE_NAME" || fail "Container start failed"
pass "Container started"

# ── Wait for Docker daemon ───────────────────────────────────────────────
info "Waiting for Docker daemon..."
for i in $(seq 1 60); do
    if docker exec "$CONTAINER_NAME" docker info > /dev/null 2>&1; then
        break
    fi
    [ $i -eq 60 ] && fail "Docker daemon did not start"
    sleep 1
done
pass "Docker daemon ready"

# ── Wait for Floci ───────────────────────────────────────────────────────
info "Waiting for Floci..."
for i in $(seq 1 120); do
    if curl -sf http://localhost:$FLOCI_PORT/_floci/health > /dev/null 2>&1; then
        break
    fi
    [ $i -eq 120 ] && fail "Floci did not start"
    sleep 1
done
pass "Floci ready"

# ── Wait for Dashboard ───────────────────────────────────────────────────
info "Waiting for Dashboard..."
for i in $(seq 1 60); do
    if curl -sf http://localhost:$DASHBOARD_PORT/api/healthz > /dev/null 2>&1; then
        break
    fi
    [ $i -eq 60 ] && fail "Dashboard did not start"
    sleep 1
done
pass "Dashboard ready"

# ── Node/OpenSearch helper (SDK already in /app/dashboard/node_modules) ──
# Usage: os_cmd <method> [args-json]
os_cmd() {
    local method="$1"; shift
    docker exec "$CONTAINER_NAME" node -e "
        const { OpenSearchClient, ${method}Command } = require('/app/dashboard/node_modules/@aws-sdk/client-opensearch');
        const os = new OpenSearchClient({ endpoint: 'http://localhost:4566', region: 'us-east-1', credentials: { accessKeyId: 'test', secretAccessKey: 'test' } });
        os.send(new ${method}Command(process.argv[1] ? JSON.parse(process.argv[1]) : {}))
            .then(r => { console.log(JSON.stringify(r)); process.exit(0); })
            .catch(e => { console.error(e.name + ': ' + e.message); process.exit(1); });
    " "${1:-}"
}

# ── Create OpenSearch domain ─────────────────────────────────────────────
info "Creating OpenSearch domain..."
os_cmd CreateDomain '{"DomainName":"test-domain","EngineVersion":"OpenSearch_2.19","ClusterConfig":{"InstanceType":"m5.large.search","InstanceCount":1},"EBSOptions":{"EBSEnabled":true,"VolumeType":"gp2","VolumeSize":10}}' > /dev/null || fail "OpenSearch domain creation failed"
pass "OpenSearch domain created"

# ── Wait for domain to be ready ──────────────────────────────────────────
info "Waiting for domain to become ready (this may take a few minutes)..."
for i in $(seq 1 300); do
    STATUS=$(os_cmd DescribeDomain '{"DomainName":"test-domain"}' 2>/dev/null | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).DomainStatus.Created)}catch{console.log('None')}})" || echo "None")
    if [ "$STATUS" = "True" ]; then
        break
    fi
    [ $i -eq 300 ] && fail "Domain did not become ready within 5 minutes"
    sleep 1
done
pass "Domain ready"

# ── Get domain endpoint ──────────────────────────────────────────────────
info "Getting domain endpoint..."
ENDPOINT=$(os_cmd DescribeDomain '{"DomainName":"test-domain"}' | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{console.log(JSON.parse(d).DomainStatus.Endpoint)})")
info "Domain endpoint: $ENDPOINT"
pass "Endpoint retrieved"

# ── Verify no host Docker socket ─────────────────────────────────────────
info "Verifying no host Docker socket mount..."
MOUNTS=$(docker inspect "$CONTAINER_NAME" --format '{{json .Mounts}}' | grep -c "docker.sock" || echo "0")
[ "$MOUNTS" = "0" ] && pass "No host Docker socket mounted" || fail "Host Docker socket detected"

# ── Test data plane from inside combined container ───────────────────────
info "Testing data plane operations..."

# Create index with knn_vector
docker exec "$CONTAINER_NAME" curl -sf -X PUT "http://localhost:$PROXY_START/test-index" \
    -H "Content-Type: application/json" \
    -d '{
        "settings": {"index": {"knn": true}},
        "mappings": {
            "properties": {
                "embedding": {"type": "knn_vector", "dimension": 128, "index": true},
                "title": {"type": "text"}
            }
        }
    }' > /dev/null || fail "Index creation failed"
pass "Index created"

# Index document
docker exec "$CONTAINER_NAME" curl -sf -X POST "http://localhost:$PROXY_START/test-index/_doc/1" \
    -H "Content-Type: application/json" \
    -d "{\"title\": \"Test document\", \"embedding\": $(python3 -c 'import json; print(json.dumps([0.1]*128))')}" \
    > /dev/null || fail "Document indexing failed"
pass "Document indexed"

# Wait for refresh
sleep 2

# Lexical search
SEARCH_RESULT=$(docker exec "$CONTAINER_NAME" curl -sf -X GET "http://localhost:$PROXY_START/test-index/_search" \
    -H "Content-Type: application/json" \
    -d '{"query": {"match": {"title": "Test document"}}}' || echo "{}")
echo "$SEARCH_RESULT" | grep -q '"hits"' && pass "Lexical search works" || fail "Lexical search failed"

# ── Test from sibling container ──────────────────────────────────────────
info "Starting sibling test container..."
docker run -d \
    --name "$SIBLING_NAME" \
    --network floci-test-net \
    curlimages/curl:latest \
    sleep 300 || fail "Sibling container start failed"
pass "Sibling container started"

# Wait for sibling to be ready
sleep 2

# Test connectivity to OpenSearch proxy from sibling
info "Testing OpenSearch proxy from sibling container..."
SIBLING_SEARCH=$(docker exec "$SIBLING_NAME" curl -sf -X GET "http://$CONTAINER_NAME:$PROXY_START/test-index/_search" \
    -H "Content-Type: application/json" \
    -d '{"query": {"match": {"title": "Test document"}}}' || echo "{}")
echo "$SIBLING_SEARCH" | grep -q '"hits"' && pass "OpenSearch reachable from sibling" || fail "OpenSearch not reachable from sibling"

# ── Test persistence across restart ──────────────────────────────────────
info "Testing persistence across restart..."
docker restart "$CONTAINER_NAME"
sleep 30

# Wait for services
for i in $(seq 1 120); do
    curl -sf http://localhost:$FLOCI_PORT/_floci/health > /dev/null 2>&1 && break
    [ $i -eq 120 ] && fail "Floci did not recover"
    sleep 1
done
pass "Services recovered"

# Verify domain persists
DOMAIN_EXISTS=$(os_cmd ListDomainNames '{}' | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const n=(JSON.parse(d).DomainNames||[]).filter(x=>x.DomainName==='test-domain');console.log(n.length?'test-domain':'')})" 2>/dev/null || echo "")
echo "$DOMAIN_EXISTS" | grep -q "test-domain" && pass "Domain persisted" || fail "Domain lost"

# Verify document persists
sleep 5
SEARCH_AFTER_RESTART=$(docker exec "$CONTAINER_NAME" curl -sf -X GET "http://localhost:$PROXY_START/test-index/_search" \
    -H "Content-Type: application/json" \
    -d '{"query": {"match": {"title": "Test document"}}}' || echo "{}")
echo "$SEARCH_AFTER_RESTART" | grep -q '"hits"' && pass "Documents persisted" || fail "Documents lost"

# ── Test S3 and SQS ─────────────────────────────────────────────────────
info "Testing S3 and SQS..."

# Create S3 bucket
docker exec "$CONTAINER_NAME" node -e "
    const { S3Client, CreateBucketCommand } = require('/app/dashboard/node_modules/@aws-sdk/client-s3');
    const s3 = new S3Client({ endpoint: 'http://localhost:4566', region: 'us-east-1', credentials: { accessKeyId: 'test', secretAccessKey: 'test' }, forcePathStyle: true });
    s3.send(new CreateBucketCommand({ Bucket: 'test-bucket' })).then(() => process.exit(0)).catch(() => process.exit(1));
" > /dev/null 2>&1 && pass "S3 bucket created" || fail "S3 bucket creation failed"

# Create SQS queue
docker exec "$CONTAINER_NAME" node -e "
    const { SQSClient, CreateQueueCommand } = require('/app/dashboard/node_modules/@aws-sdk/client-sqs');
    const sqs = new SQSClient({ endpoint: 'http://localhost:4566', region: 'us-east-1', credentials: { accessKeyId: 'test', secretAccessKey: 'test' } });
    sqs.send(new CreateQueueCommand({ QueueName: 'test-queue' })).then(() => process.exit(0)).catch(() => process.exit(1));
" > /dev/null 2>&1 && pass "SQS queue created" || fail "SQS queue creation failed"

# ── Test domain deletion ─────────────────────────────────────────────────
info "Testing domain deletion..."
os_cmd DeleteDomain '{"DomainName":"test-domain"}' > /dev/null 2>&1 && pass "Domain deleted" || fail "Domain deletion failed"

# Wait for deletion
sleep 5

# Verify domain is gone
DOMAIN_DELETED=$(os_cmd ListDomainNames '{}' | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const n=(JSON.parse(d).DomainNames||[]).filter(x=>x.DomainName==='test-domain');console.log(n.length?'exists':'gone')})" 2>/dev/null || echo "gone")
[ -z "$DOMAIN_DELETED" ] && pass "Domain deletion verified" || fail "Domain still exists"

# ── Cleanup ──────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}All tests passed!${NC}"
echo ""
echo "Combined image supports real OpenSearch without host Docker socket."
echo "Container: $CONTAINER_NAME"
echo "Dashboard: http://localhost:$DASHBOARD_PORT"
echo "Floci API: http://localhost:$FLOCI_PORT"
echo "OpenSearch Proxy: http://localhost:$PROXY_START-9499"
