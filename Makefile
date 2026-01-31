.PHONY: help install dev build test docker-up docker-down docker-logs db-migrate db-push clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	npm install

dev: ## Start development server
	npm run dev

build: ## Build production bundle
	npm run build

start: ## Start production server
	npm run start

test: ## Run unit tests
	npm run test

test:coverage: ## Run tests with coverage
	npm run test:coverage

test:e2e: ## Run E2E tests
	npm run test:e2e

lint: ## Run ESLint
	npm run lint

lint:fix: ## Fix ESLint errors
	npm run lint:fix

format: ## Format code with Prettier
	npm run format

# Docker Commands
docker-up: ## Start all Docker services
	docker-compose up -d

docker-down: ## Stop all Docker services
	docker-compose down

docker-logs: ## Show Docker logs
	docker-compose logs -f

docker-ps: ## Show Docker containers status
	docker-compose ps

docker-restart: ## Restart Docker services
	docker-compose restart

docker-rebuild: ## Rebuild and restart Docker services
	docker-compose up -d --build

docker-clean: ## Stop and remove Docker containers, volumes, and networks
	docker-compose down -v

# Database Commands
db-migrate: ## Run database migrations
	npm run db:migrate

db-push: ## Push database schema
	npm run db:push

db-studio: ## Open Drizzle Studio
	npm run db:studio

db-generate: ## Generate migration files
	npm run db:generate

# Development Workflow
dev:full: docker-up ## Start full development environment (Docker + Next.js)
	@echo "Waiting for services to be ready..."
	@sleep 5
	@echo "Starting Next.js development server..."
	npm run dev

setup: install docker-up db-migrate ## Complete project setup
	@echo "✅ Setup complete! Run 'make dev' to start development"

clean: ## Clean build artifacts and node_modules
	rm -rf .next
	rm -rf node_modules
	rm -rf drizzle
	rm -rf coverage
	rm -rf test-results
	rm -rf playwright-report
