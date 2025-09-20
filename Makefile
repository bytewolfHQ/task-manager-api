# Makefile
.PHONY: help build up down logs clean install migrate seed test

# Default environment
ENV ?= dev

# Colors for pretty output
BLUE := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

## Show this help
help:
	@echo "$(BLUE)Task Manager API - Available Commands$(RESET)"
	@echo ""
	@echo "$(GREEN)Setup Commands:$(RESET)"
	@echo "  make build          Build Docker images"
	@echo "  make up             Start all containers"
	@echo "  make down           Stop all containers"
	@echo "  make install        Install dependencies (backend + frontend)"
	@echo ""
	@echo "$(GREEN)Development:$(RESET)"
	@echo "  make logs           Show container logs"
	@echo "  make shell-be       Access backend container shell"
	@echo "  make shell-fe       Access frontend container shell"
	@echo "  make migrate        Run database migrations"
	@echo "  make seed           Load test data"
	@echo ""
	@echo "$(GREEN)Testing:$(RESET)"
	@echo "  make test           Run backend tests"
	@echo "  make test-fe        Run frontend tests"
	@echo ""
	@echo "$(GREEN)Utility:$(RESET)"
	@echo "  make clean          Clean up containers and volumes"
	@echo "  make status         Show container status"

## Build Docker images
build:
	@echo "$(BLUE)Building Docker images...$(RESET)"
	docker compose build --no-cache

## Start all containers
up:
	@echo "$(BLUE)Starting containers...$(RESET)"
	docker compose up -d
	@echo "$(GREEN)✅ Services started!$(RESET)"
	@echo "$(YELLOW)Backend API:$(RESET)    http://localhost:3000"
	@echo "$(YELLOW)Frontend:$(RESET)       http://localhost:5173"
	@echo "$(YELLOW)pgAdmin:$(RESET)        http://localhost:8080"

## Stop all containers
down:
	@echo "$(BLUE)Stopping containers...$(RESET)"
	docker compose down

## Show container logs
logs:
	docker compose logs -f

## Install all dependencies
install: install-backend install-frontend

## Install backend dependencies
install-backend:
	@echo "$(BLUE)Installing Symfony...$(RESET)"
	docker compose exec backend composer create-project symfony/skeleton . --no-interaction
	docker compose exec backend composer require webapp api
	docker compose exec backend composer require --dev symfony/debug-bundle symfony/maker-bundle phpunit/phpunit

## Install frontend dependencies  
install-frontend:
	@echo "$(BLUE)Installing frontend dependencies...$(RESET)"
	cd frontend && npm init -y
	cd frontend && npm install -D vite typescript @types/node
	cd frontend && npm install axios

## Run database migrations
migrate:
	@echo "$(BLUE)Running migrations...$(RESET)"
	docker compose exec backend php bin/console doctrine:migrations:migrate --no-interaction

## Load test data
seed:
	@echo "$(BLUE)Loading test data...$(RESET)"
	docker compose exec backend php bin/console doctrine:fixtures:load --no-interaction

## Run backend tests
test:
	docker compose exec backend php bin/phpunit

## Run frontend tests
test-fe:
	docker compose exec frontend npm test

## Access backend shell
shell-be:
	docker compose exec backend sh

## Access frontend shell  
shell-fe:
	docker compose exec frontend sh

## Show container status
status:
	docker compose ps

## Clean up everything
clean:
	@echo "$(RED)Cleaning up containers and volumes...$(RESET)"
	docker compose down -v --remove-orphans
	docker system prune -f
