.DEFAULT_GOAL := help

SHELL := /bin/bash
COMPOSE := docker compose

.PHONY: help install setup dev dev-backend dev-frontend build build-frontend \
        build-backend typecheck start clean test test-cov test-all integration-test \
        _ensure-floci \
        up up-bg down restart rebuild logs logs-floci logs-dashboard \
        ps shell shell-floci prod prod-bg prod-down \
        typecheck-docker build-docker clean-all

help: ## Show this help
	@echo ""
	@echo "  Floci Dash"
	@echo "  ──────────────"
	@echo ""
	@echo "  Native (requires Node.js 22+):"
	@grep -E '^[a-z][a-z_-]*:.*?## .*$$' $(MAKEFILE_LIST) | grep -vE '^(up|up-bg|down|restart|rebuild|logs|ps|shell|prod|typecheck-docker|build-docker|clean-all)' | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "    \033[36m%-24s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "  Docker (all you need is Docker):"
	@grep -E '^(up|up-bg|down|restart|rebuild|logs|logs-floci|logs-dashboard|ps|shell|shell-floci|prod|prod-bg|prod-down|typecheck-docker|build-docker|clean-all):.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "    \033[36m%-24s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ─── Native Targets (requires Node.js 22+) ──────────

# Port for Floci — matches docker-compose.yml default
FLOCI_PORT ?= 9878

install: ## Install dependencies
	pnpm install

setup: install typecheck ## First-time setup (install + typecheck)
	@echo "✓ Setup complete."

dev: ## Start dev servers (backend :3000, frontend :5173)
	pnpm run dev

dev-backend: ## Start backend only (tsx watch, port 3000)
	pnpm run dev:backend

dev-frontend: ## Start frontend only (Vite HMR, port 5173)
	pnpm run dev:frontend

build: typecheck ## Build frontend + backend for production
	pnpm run build

build-frontend: ## Build frontend only (vite build)
	pnpm run build:frontend

build-backend: ## Build backend only (tsc)
	pnpm run build:backend

typecheck: ## Run TypeScript type checking
	pnpm run typecheck

start: ## Start production server (needs build first)
	pnpm run start

clean: ## Remove node_modules and dist
	rm -rf node_modules dist

test: ## Run unit tests only (fast, no Floci needed)
	pnpm run test:unit

test-cov: ## Run unit tests with coverage report (no Floci needed)
	pnpm run test:cov

test-all: ## Run all tests including integration (requires Floci)
	$(MAKE) _ensure-floci
	FLOCI_URL=http://localhost:$(FLOCI_PORT) pnpm run test

integration-test: ## Run integration tests against Floci (starts Floci if not running)
	$(MAKE) _ensure-floci
	FLOCI_URL=http://localhost:$(FLOCI_PORT) pnpm exec vitest run src/backend/integration.test.ts

_ensure-floci:
	@echo "Checking Floci availability..."
	@if ! curl -s http://localhost:$(FLOCI_PORT)/_floci/health > /dev/null 2>&1; then \
		echo "Floci not running. Starting Floci via Docker..."; \
		FLOCI_PORT=$(FLOCI_PORT) $(COMPOSE) up -d floci; \
		echo "Waiting up to 90s for Floci to be healthy..."; \
		for i in $$(seq 1 45); do \
			if curl -s http://localhost:$(FLOCI_PORT)/_floci/health > /dev/null 2>&1; then \
				echo "✓ Floci is ready!"; \
				exit 0; \
			fi; \
			sleep 2; \
		done; \
		echo "✗ Timed out waiting for Floci"; \
		exit 1; \
	fi; \
	echo "✓ Floci is already running."

# ─── Docker Targets ─────────────────────────────────
# All Docker targets use docker-compose.yml (production stack).
# Floci uses the official ghcr.io image — no local build needed.

up: ## Start Floci + Dashboard (build if needed, foreground)
	$(COMPOSE) up --build

up-bg: ## Start Floci + Dashboard in background
	$(COMPOSE) up --build -d

down: ## Stop and remove all containers
	$(COMPOSE) down

restart: down up-bg ## Stop, then start in background

rebuild: ## Force rebuild Dashboard image (no cache)
	$(COMPOSE) build --no-cache dashboard
	$(COMPOSE) up -d dashboard

logs: ## Tail all container logs
	$(COMPOSE) logs -f

logs-floci: ## Tail Floci container logs
	$(COMPOSE) logs -f floci

logs-dashboard: ## Tail Dashboard container logs
	$(COMPOSE) logs -f dashboard

ps: ## Show container status
	$(COMPOSE) ps

shell: ## Open shell in dashboard container
	$(COMPOSE) exec dashboard sh

shell-floci: ## Open shell in Floci container
	$(COMPOSE) exec floci sh

prod: up ## Alias for 'up' (production is the default)

prod-bg: up-bg ## Alias for 'up-bg'

prod-down: down ## Alias for 'down'

typecheck-docker: ## Run typecheck inside Docker container
	$(COMPOSE) run --rm --no-deps dashboard pnpm run typecheck

build-docker: ## Run build inside Docker container
	$(COMPOSE) run --rm --no-deps dashboard pnpm run build

clean-all: down ## Stop containers + remove volumes + local artifacts
	$(COMPOSE) down -v --rmi local
	rm -rf node_modules dist
	@echo "✓ Cleaned everything."
