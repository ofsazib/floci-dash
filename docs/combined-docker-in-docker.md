# Combined Image with Docker-in-Docker

This guide explains how to run the Floci Dash combined image with an internal Docker daemon, enabling real OpenSearch (and other container-based services) without mounting the host Docker socket.

## Overview

The combined image includes:
- **Docker daemon** (internal, no host socket required)
- **Floci** (AWS emulator, port 4566)
- **Floci Dash** (management UI, port 3000)

OpenSearch domains run as real Docker containers inside the combined container, managed by the internal daemon.

## Requirements

- **Docker** with `--privileged` mode enabled
- **Volumes** for data persistence
- **Network** access for OpenSearch proxy ports

### Why `--privileged` is Required

The combined image runs a Docker daemon inside the container. This requires:
- Access to kernel capabilities (CAP_SYS_ADMIN)
- Access to cgroups
- Access to storage drivers (overlay2)

Without `--privileged`, the internal Docker daemon cannot start, and OpenSearch cannot run in real mode.

### What `--privileged` Does NOT Mean

- The internal Docker daemon is isolated from the host
- No host Docker socket is mounted
- Container ports are still subject to Docker networking rules
- Data is contained within the named volumes

## Quick Start

```bash
# Build the combined image
docker build -f docker/Dockerfile.combined -t floci-dash:combined .

# Run with Docker-in-Docker
docker run -d \
    --name floci-dash \
    --privileged \
    -p 3000:3000 \
    -p 4566:4566 \
    -p 9400-9499:9400-9499 \
    -v floci-data:/app/data \
    -v floci-docker:/var/lib/docker \
    floci-dash:combined
```

## Using Docker Compose

```yaml
# docker-compose.yml
services:
  floci:
    image: floci-dash:combined
    privileged: true
    ports:
      - "3000:3000"
      - "4566:4566"
      - "9400-9499:9400-9499"
    environment:
      - FLOCI_HOSTNAME=floci
      - FLOCI_STORAGE_MODE=hybrid
      - FLOCI_SERVICES_OPENSEARCH_MOCK=false
      - FLOCI_SERVICES_OPENSEARCH_PROXY_BASE_PORT=9400
      - FLOCI_SERVICES_OPENSEARCH_PROXY_MAX_PORT=9499
    volumes:
      - floci-data:/app/data
      - floci-docker:/var/lib/docker

volumes:
  floci-data:
  floci-docker:
```

## Creating an OpenSearch Domain

```bash
# Set environment
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566

# Create domain
aws opensearch create-domain \
    --domain-name my-search \
    --engine-version OpenSearch_2.19 \
    --cluster-config InstanceType=m5.large.search,InstanceCount=1 \
    --ebs-options EBSEnabled=true,VolumeType=gp2,VolumeSize=10

# Wait for domain to be ready (check Created=true)
aws opensearch describe-domain --domain-name my-search
```

## Using the Domain

```bash
# Get the domain endpoint from describe-domain
ENDPOINT=$(aws opensearch describe-domain --domain-name my-search \
    --query 'DomainStatus.Endpoint' --output text)

# Index a document
curl -X PUT "http://localhost:9400/my-index/_doc/1" \
    -H "Content-Type: application/json" \
    -d '{"title": "Hello", "content": "World"}'

# Search
curl -X GET "http://localhost:9400/my-index/_search" \
    -H "Content-Type: application/json" \
    -d '{"query": {"match": {"title": "Hello"}}}'
```

## Data Persistence

Two volumes ensure data survives container restarts:

| Volume | Path | Purpose |
|--------|------|---------|
| `floci-data` | `/app/data` | Floci metadata, S3 objects, SQS queues |
| `floci-docker` | `/var/lib/docker` | Docker images, containers, OpenSearch volumes |

### What Survives Restart

- ✅ S3 objects
- ✅ SQS queues and messages
- ✅ OpenSearch domain metadata
- ✅ Indexed OpenSearch documents

### Reset OpenSearch Data Only

```bash
# Stop container
docker stop floci-dash

# Remove Docker volume (contains OpenSearch data)
docker volume rm floci-docker

# Start container
docker start floci-dash
```

### Reset All Data

```bash
# Stop and remove container + volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

## Health Checks

The container health check verifies:
1. Docker daemon is responsive
2. Floci is healthy (port 4566)
3. Dashboard is serving requests (port 3000)

```bash
# Check container health
docker inspect --format='{{json .State.Health}}' floci-dash
```

## Resource Requirements

| Component | CPU | Memory | Disk |
|-----------|-----|--------|------|
| Docker daemon | ~5% | ~100MB | Variable |
| Floci | ~10% | ~256MB | ~50MB |
| Dashboard | ~5% | ~128MB | ~100MB |
| OpenSearch (per domain) | ~20% | ~2GB | ~10GB |

**Recommended**: 4 CPU cores, 8GB RAM, 50GB disk

## Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| Linux (amd64) | ✅ Full support | Best performance |
| Linux (arm64) | ✅ Full support | Best performance |
| macOS (Docker Desktop) | ⚠️ Limited | Nested virtualization may affect performance |
| Windows (Docker Desktop) | ⚠️ Limited | Nested virtualization may affect performance |

## Security Considerations

### Why `--privileged` is Required

The combined image runs a Docker daemon inside the container. This requires:
- Access to kernel capabilities (CAP_SYS_ADMIN)
- Access to cgroups
- Access to storage drivers

### Security Best Practices

1. **Use named volumes** for data persistence (not bind mounts)
2. **Limit network exposure** by only exposing necessary ports
3. **Run in isolated environments** (separate VM or dedicated host)
4. **Monitor container logs** for unusual activity

## Troubleshooting

### Docker daemon fails to start

```bash
# Check logs
docker logs floci-dash 2>&1 | grep -i docker

# Verify privileged mode
docker inspect floci-dash | grep -i privileged
```

### OpenSearch domain not becoming ready

```bash
# Check domain status
aws opensearch describe-domain --domain-name my-search

# Check OpenSearch container
docker exec floci-dash docker ps

# Check OpenSearch logs
docker exec floci-dash docker logs <opensearch-container-id>
```

### Floci not starting

```bash
# Check Floci logs
docker exec floci-dash cat /var/log/floci.log

# Verify Docker daemon is ready
docker exec floci-dash docker info
```

## Comparison with Host Socket Mode

| Feature | Host Socket Mode | Docker-in-Docker Mode |
|---------|------------------|------------------------|
| Security | Access to host Docker | Isolated daemon |
| Performance | Native | Slight overhead |
| Complexity | Simple setup | Requires `--privileged` |
| Isolation | Shared host | Container-isolated |
| Persistence | Host volumes | Named volumes |

## Advanced Configuration

### Custom Docker Network

```bash
# Create custom network inside container
docker exec floci-dash docker network create floci-net

# Configure Floci to use it
docker exec -e FLOCI_SERVICES_DOCKER_NETWORK=floci-net floci-dash ...
```

### Private Registry Access

```bash
# Copy Docker config to container
docker cp ~/.docker/config.json floci-dash:/root/.docker/config.json

# Set config path
docker exec -e FLOCI_DOCKER_DOCKER_CONFIG_PATH=/root/.docker floci-dash ...
```

### Resource Limits

```bash
# Limit container resources
docker run -d \
    --privileged \
    --cpus=4 \
    --memory=8g \
    --storage-opt size=50G \
    floci-dash:combined
```
