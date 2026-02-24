#!/bin/bash

# Quick start script for Docker deployment
# This script helps you quickly setup and run the Voter WhatsApp Bot

set -e

echo "🚀 Voter WhatsApp Bot - Docker Quick Start"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.docker...${NC}"
    cp .env.docker .env
    echo -e "${GREEN}✅ .env file created${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANT: Please edit .env and change SESSION_SECRET before running in production!${NC}"
    echo ""
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p data auth_info logs
echo -e "${GREEN}✅ Directories created${NC}"
echo ""

# Build Docker image
echo "🔨 Building Docker image..."
echo "This may take a few minutes on first run..."
docker compose build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker image built successfully${NC}"
else
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi

echo ""

# Start containers
echo "🚀 Starting containers..."
docker compose up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Containers started successfully${NC}"
else
    echo -e "${RED}❌ Failed to start containers${NC}"
    exit 1
fi

echo ""
echo "========================================="
echo -e "${GREEN}🎉 Deployment successful!${NC}"
echo ""
echo "📍 Access your application at:"
echo "   - Next.js App:        http://localhost:3000"
echo "   - WhatsApp Service:   http://localhost:3001"
echo ""
echo "📝 Useful commands:"
echo "   - View logs:          docker compose logs -f"
echo "   - Stop containers:    docker compose down"
echo "   - Restart:            docker compose restart"
echo "   - View status:        docker compose ps"
echo ""
echo "📚 For more information, see DOCKER_SUPERVISORD.md"
echo "========================================="
