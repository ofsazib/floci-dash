.DEFAULT_GOAL := help

SHELL := /bin/bash
COMPOSE_DEV := docker compose -f docker-compose.dev.yml
COMPOSE_PROD := docker compose

.PHONY: help install setup dev dev-backend dev-frontend build build-frontend \
        build-backend typecheck start clean test \
        docker-dev docker-dev-bg docker-down docker-clean docker-restart \
        docker-build docker-typecheck docker-prod docker-prod-bg docker-prod-down \
        docker-logs docker-logs-floci docker-logs-dashboard docker-ps \
        docker-shell docker-shell-floci

# ─────────────────────────────────────────────────────
#  Floci Dashboard — Makefile
#  Native targets run on host (need Node.js).
#  Docker targets run everything in containers.
# ─────────────────────────────────────────────────────

help: ## Show this help
	@echo ""
	@echo "  Floci Dashboard"
	@echo "  ──────────────"
	@echo ""
	@echo "  Native (no Docker):"
	@grep -E '^[a-z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -v '^docker-' | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "  Docker:"
	@grep -E '^docker-[a-z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ─── Native Targets (no Docker required) ────────────

install: ## Install npm dependencies
	npm install

setup: install typecheck ## First-time setup (install + typecheck)
	@echo "Setup complete."

dev: ## Start dev server (backend on :3000, frontend on :5173)
	npm run dev

dev-backend: ## Start backend only (tsx watch, port 3000)
	npm run dev:backend

dev-frontend: ## Start frontend only (Vite HMR, port 5173)
	npm run dev:frontend

build: ## Build frontend + backend for production
	npm run build

build-frontend: ## Build frontend only (vite build)
	npm run build:frontend

build-backend: ## Build backend only (tsc)
	npm run build:backend

typecheck: ## Run TypeScript type checking
	npm run typecheck

start: ## Start production server (needs build first)
	npm run start

clean: ## Remove node_modules and dist
	rm -rf node_modules dist

test: ## Run tests
	@echo "No tests defined yet."

# ─── Docker Targets ─────────────────────────────────

docker-dev: ## Start dev environment (Floci + Dashboard, hot reload)
	$(COMPOSE_DEV) up --build

docker-dev-bg: ## Start dev environment in background
	$(COMPOSE_DEV) up --build -d

docker-down: ## Stop all containers
	$(COMPOSE_DEV) down

docker-clean: ## Stop containers and remove volumes
	$(COMPOSE_DEV) down -v

docker-restart: ## Restart dev environment
	$(COMPOSE_DEV) down
	$(COMPOSE_DEV) up --build -d

docker-build: ## Compile project inside Docker container
	$(COMPOSE_DEV) run --rm --no-deps dashboard npm run build

docker-typecheck: ## Run typecheck inside container
	$(COMPOSE_DEV) run --rm --no-deps dashboard npm run typecheck

docker-prod: ## Start production stack (Floci + built Dashboard)
	$(COMPOSE_PROD) up --build

docker-prod-bg: ## Start production stack in background
	$(COMPOSE_PROD) up --build -d

docker-prod-down: ## Stop production stack
	$(COMPOSE_PROD) down

docker-logs: ## Tail all logs
	$(COMPOSE_DEV) logs -f

docker-logs-floci: ## Tail Floci logs
	$(COMPOSE_DEV) logs -f floci

docker-logs-dashboard: ## Tail dashboard logs
	$(COMPOSE_DEV) logs -f dashboard

docker-ps: ## Show container status
	$(COMPOSE_DEV) ps

docker-shell: ## Open shell in dashboard container
	$(COMPOSE_DEV) exec dashboard sh

docker-shell-floci: ## Open shell in Floci container
	$(COMPOSE_DEV) exec floci sh
