#!/usr/bin/env sh
set -e

# Configuration
PROJECT_NAME="myapp"
SERVICES="postgres neon-proxy minio minio-mc"

# Colors
GREEN='\033[32m'
BLUE='\033[34m'
RED='\033[31m'
ORANGE='\033[33m'
RESET='\033[0m'

print_status() {
	printf "%s" "$1"
}

print_success() {
	echo "${GREEN}✔${RESET}"
}

start_docker() {
	if ! docker info >/dev/null 2>&1; then
		print_status "🐳 Starting Docker Desktop..."
		open -a Docker
		while ! docker info >/dev/null 2>&1; do
			sleep 2
		done
		print_success
	else
		print_status "🐳 Docker Desktop is running "
		print_success
	fi
}

check_compose_file() {
	if [ ! -f "compose.yaml" ] && [ ! -f "compose.yml" ] && [ ! -f "docker-compose.yaml" ] && [ ! -f "docker-compose.yml" ]; then
		echo "${RED}❌ No compose file found in current directory${RESET}\n"
		exit 1
	fi
}

start_services() {
	print_status "🚀 Starting development services..."
	
	# Stop any running services first (clean restart)
	docker compose down >/dev/null 2>&1 || true
	
	# Start all services
	if docker compose up -d $SERVICES >/dev/null 2>&1; then
		print_success
		
		# Wait for services to be healthy
		print_status "⏳ Waiting for services to be ready..."
		sleep 5
		
		# Check if postgres is healthy (it has a healthcheck)
		max_attempts=30
		attempt=0
		while [ $attempt -lt $max_attempts ]; do
			if docker compose ps postgres | grep -q "healthy"; then
				break
			fi
			sleep 2
			attempt=$((attempt + 1))
		done
		
		if [ $attempt -eq $max_attempts ]; then
			echo "${ORANGE}⚠️  Services started but postgres health check timed out${RESET}\n"
		else
			print_success
		fi
	else
		echo "${RED}❌ Failed to start services${RESET}\n"
		exit 1
	fi
}

show_status() {
	echo "\n${GREEN}✅ Development environment is ready!${RESET}\n"
	echo " ✦ PostgreSQL: localhost:5432 (postgres/postgres)"
	echo " ✦ Neon Proxy: localhost:4444"
	echo " ✦ MinIO Console: http://localhost:9001 (minio/minio123)"
	echo " ✦ MinIO API: http://localhost:9000"
}

# Main execution
start_docker
check_compose_file
start_services
show_status