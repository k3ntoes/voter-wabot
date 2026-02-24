.PHONY: help build up down restart logs logs-frontend logs-whatsapp clean rebuild seed migrate studio backup restore ps exec-frontend exec-whatsapp stop start

# Default target
.DEFAULT_GOAL := help

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m

# Project name
PROJECT_NAME := voter-wabot-antigravity

help: ## Tampilkan bantuan
	@echo "$(CYAN)========================================$(NC)"
	@echo "$(GREEN)  Voter WhatsApp Bot - Docker Commands$(NC)"
	@echo "$(CYAN)========================================$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "$(CYAN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

# ==================== Build Commands ====================

build: ## Build semua Docker images
	@echo "$(GREEN)🔨 Building Docker images...$(NC)"
	docker compose build

rebuild: ## Rebuild dari scratch (no cache)
	@echo "$(GREEN)🔨 Rebuilding Docker images (no cache)...$(NC)"
	docker compose build --no-cache

# ==================== Container Management ====================

up: ## Jalankan semua container
	@echo "$(GREEN)🚀 Starting containers...$(NC)"
	docker compose up -d
	@echo "$(GREEN)✅ Containers started!$(NC)"
	@echo "$(CYAN)Frontend: http://localhost:3000$(NC)"
	@echo "$(CYAN)WhatsApp Service: http://localhost:3001$(NC)"

down: ## Stop dan hapus semua container
	@echo "$(YELLOW)🛑 Stopping containers...$(NC)"
	docker compose down

down-volumes: ## Stop container dan hapus volumes (⚠️  DATABASE AKAN TERHAPUS!)
	@echo "$(YELLOW)⚠️  WARNING: This will delete all data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose down -v; \
		echo "$(GREEN)✅ Containers and volumes removed$(NC)"; \
	else \
		echo "$(CYAN)Cancelled$(NC)"; \
	fi

start: ## Start container yang sudah ada
	@echo "$(GREEN)▶️  Starting containers...$(NC)"
	docker compose start

stop: ## Stop container tanpa menghapus
	@echo "$(YELLOW)⏸️  Stopping containers...$(NC)"
	docker compose stop

restart: ## Restart semua container
	@echo "$(GREEN)🔄 Restarting containers...$(NC)"
	docker compose restart

restart-frontend: ## Restart frontend saja
	@echo "$(GREEN)🔄 Restarting frontend...$(NC)"
	docker compose restart frontend

restart-whatsapp: ## Restart WhatsApp service saja
	@echo "$(GREEN)🔄 Restarting WhatsApp service...$(NC)"
	docker compose restart whatsapp-service

# ==================== Logs ====================

logs: ## Lihat logs semua container (follow)
	docker compose logs -f

ps: ## Lihat status container
	@docker compose ps

# ==================== Database Management ====================

migrate: ## Jalankan database migrations
	@echo "$(GREEN)🔄 Running migrations...$(NC)"
	docker compose exec voter-wabot-frontend bunx prisma migrate deploy
# 	docker compose exec frontend bun run db:migrate
	@echo "$(GREEN)✅ Migrations completed$(NC)"

migrate-reset: ## Reset database (⚠️  DATA AKAN TERHAPUS!)
	@echo "$(YELLOW)⚠️  WARNING: This will reset the database!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose exec voter-wabot-frontend bunx prisma migrate reset --force; \
		echo "$(GREEN)✅ Database reset completed$(NC)"; \
	else \
		echo "$(CYAN)Cancelled$(NC)"; \
	fi

seed: ## Seed database dengan data awal
	@echo "$(GREEN)🌱 Seeding database...$(NC)"
	docker compose exec frontend bun /app/prisma/seed.ts
# 	docker compose exec frontend bun run db:seed
	@echo "$(GREEN)✅ Database seeding completed$(NC)"

studio: ## Buka Prisma Studio
	@echo "$(GREEN)🎨 Opening Prisma Studio...$(NC)"
	docker compose exec frontend bunx prisma studio

db-setup: ## Setup database lengkap (migrate + seed)
	@echo "$(GREEN)📦 Setting up database...$(NC)"
	@make migrate
	@make seed
	@echo "$(GREEN)✅ Database setup completed!$(NC)"

# ==================== Backup & Restore ====================

backup: ## Backup database dan WhatsApp auth data
	@echo "$(GREEN)💾 Creating backup...$(NC)"
	@mkdir -p backups
	@docker run --rm -v $(PROJECT_NAME)_db-data:/data -v $$(pwd)/backups:/backup alpine tar czf /backup/db-backup-$$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
	@docker run --rm -v $(PROJECT_NAME)_whatsapp-auth:/data -v $$(pwd)/backups:/backup alpine tar czf /backup/wa-auth-backup-$$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
	@echo "$(GREEN)✅ Backup created in ./backups/$(NC)"

restore: ## Restore database dari backup (masukkan nama file tanpa path)
	@echo "$(CYAN)Available backups:$(NC)"
	@ls -1 backups/db-backup-*.tar.gz 2>/dev/null || echo "No backups found"
	@read -p "Enter database backup filename: " db_backup; \
	read -p "Enter WhatsApp auth backup filename (or press Enter to skip): " wa_backup; \
	if [ -f "backups/$$db_backup" ]; then \
		docker run --rm -v $(PROJECT_NAME)_db-data:/data -v $$(pwd)/backups:/backup alpine sh -c "cd /data && tar xzf /backup/$$db_backup"; \
		echo "$(GREEN)✅ Database restored$(NC)"; \
	else \
		echo "$(YELLOW)❌ Database backup file not found$(NC)"; \
	fi; \
	if [ -n "$$wa_backup" ] && [ -f "backups/$$wa_backup" ]; then \
		docker run --rm -v $(PROJECT_NAME)_whatsapp-auth:/data -v $$(pwd)/backups:/backup alpine sh -c "cd /data && tar xzf /backup/$$wa_backup"; \
		echo "$(GREEN)✅ WhatsApp auth restored$(NC)"; \
	fi

# ==================== Cleanup ====================

clean: ## Hapus container, images, dan build cache
	@echo "$(YELLOW)🧹 Cleaning up...$(NC)"
	docker compose down
	docker system prune -f
	@echo "$(GREEN)✅ Cleanup completed$(NC)"

clean-all: ## Hapus SEMUA (⚠️  termasuk volumes dan images!)
	@echo "$(YELLOW)⚠️  WARNING: This will remove everything!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose down -v --rmi all; \
		docker system prune -af; \
		echo "$(GREEN)✅ Complete cleanup done$(NC)"; \
	else \
		echo "$(CYAN)Cancelled$(NC)"; \
	fi

# ==================== Development Commands ====================

dev: ## Build dan jalankan untuk development (dengan logs)
	@echo "$(GREEN)🚀 Starting development environment...$(NC)"
	@make build
	docker compose up

prod: ## Build dan jalankan untuk production
	@echo "$(GREEN)🚀 Starting production environment...$(NC)"
	@make build
	@make up
	@make logs

init: ## Setup awal project (build + up + db-setup)
	@echo "$(GREEN)🎬 Initializing project...$(NC)"
	@cp -n .env.docker .env 2>/dev/null || true
	@echo "$(YELLOW)⚠️  Please update SESSION_SECRET in .env file!$(NC)"
	@make build
	@make up
	@make db-setup
	@echo "$(GREEN)✅ Project initialized!$(NC)"
	@echo "$(CYAN)Frontend: http://localhost:3000$(NC)"
	@echo "$(CYAN)WhatsApp Service: http://localhost:3001$(NC)"

# ==================== Monitoring ====================

stats: ## Lihat resource usage container
	docker stats

inspect-volumes: ## Inspect Docker volumes
	@echo "$(CYAN)Database volume:$(NC)"
	docker volume inspect $(PROJECT_NAME)_db-data
	@echo ""
	@echo "$(CYAN)WhatsApp auth volume:$(NC)"
	docker volume inspect $(PROJECT_NAME)_whatsapp-auth

health: ## Check container health
	@echo "$(CYAN)Container Status:$(NC)"
	@docker compose ps
	@echo ""
	@echo "$(CYAN)Frontend health:$(NC)"
	@curl -s http://localhost:3000 > /dev/null && echo "$(GREEN)✅ Frontend is running$(NC)" || echo "$(YELLOW)❌ Frontend is not responding$(NC)"
	@echo ""
	@echo "$(CYAN)WhatsApp service health:$(NC)"
	@curl -s http://localhost:3001 > /dev/null && echo "$(GREEN)✅ WhatsApp service is running$(NC)" || echo "$(YELLOW)❌ WhatsApp service is not responding$(NC)"

# ==================== Utility Commands ====================

env: ## Copy template .env.docker ke .env
	@cp .env.docker .env
	@echo "$(GREEN)✅ .env file created from template$(NC)"
	@echo "$(YELLOW)⚠️  Please update SESSION_SECRET in .env!$(NC)"

update: ## Update dependencies dan rebuild
	@echo "$(GREEN)📦 Updating dependencies...$(NC)"
	@make down
	@make rebuild
	@make up
	@echo "$(GREEN)✅ Update completed!$(NC)"
