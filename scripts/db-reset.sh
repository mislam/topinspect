#!/usr/bin/env sh
set -e

# Configuration
PROJECT_NAME="myapp"

# Colors
GREEN='\033[32m'
BLUE='\033[34m'
ORANGE='\033[33m'
RESET='\033[0m'

confirm() {
	read -p "$1 (y/N): " -n 1 -r
	echo
	[[ $REPLY =~ ^[Yy]$ ]]
}

reset_database() {
	docker compose stop neon-proxy postgres
	docker compose start postgres
	docker compose exec -T postgres psql -U postgres -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'main' AND pid <> pg_backend_pid();"
	docker compose exec -T postgres psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS main;"
	docker compose exec -T postgres psql -U postgres -d postgres -c "CREATE DATABASE main;"
	docker compose up -d
	pnpm drizzle-kit push --force
}

# Main execution
echo "${ORANGE}⚠️ This will reset the database and delete all data!${RESET}"
echo ""

if ! confirm "Are you sure you want to continue?"; then
	echo "${BLUE}Cancelled.${RESET}"
	exit 0
fi

reset_database

echo "\n${GREEN}✅ Database reset completed successfully!${RESET}"