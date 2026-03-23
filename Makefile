.PHONY: help install dev build start db-migrate db-studio lint type-check clean

help:
	@echo "Movie Portal Backend - Available Commands"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make install          Install dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make dev              Start development server with hot reload"
	@echo "  make build            Build TypeScript to JavaScript"
	@echo "  make start            Start production server"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate       Create and apply migrations"
	@echo "  make db-studio        Open Prisma Studio (visual DB explorer)"
	@echo ""
	@echo "Quality:"
	@echo "  make lint             Run ESLint"
	@echo "  make type-check       Check TypeScript types"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean            Remove build and node_modules"

install:
	npm install

dev:
	npm run dev

build:
	npm run build

start:
	npm start

db-migrate:
	npm run db:migrate

db-studio:
	npm run db:studio

lint:
	npm run lint

type-check:
	npm run type-check

clean:
	rm -rf dist node_modules
	npm install
