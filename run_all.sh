#!/bin/bash

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Starting StudyQuest AI Local Stack ===${NC}"

# Stop all background processes on exit
trap cleanup EXIT
cleanup() {
  echo -e "\n${YELLOW}Stopping background processes...${NC}"
  kill $BACKEND_PID $FRONTEND_PID $MCP_PID 2>/dev/null
  exit
}

# 1. Start FastMCP Server
echo -e "${GREEN}1. Launching local Model Context Protocol tools server...${NC}"
cd backend
uv run python mcp/mcp_server.py &
MCP_PID=$!
cd ..

sleep 2

# 2. Start FastAPI Server
echo -e "${GREEN}2. Launching FastAPI local server (port 8000)...${NC}"
cd backend
uv run uvicorn app.fast_api_app:app --port 8000 &
BACKEND_PID=$!
cd ..

sleep 2

# 3. Start Next.js Client
echo -e "${GREEN}3. Launching Next.js development client (port 3000)...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo -e "${BLUE}=== All servers launched! Press [Ctrl+C] to terminate ===${NC}"

# Hold process alive
wait
