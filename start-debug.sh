#!/bin/bash

echo "🚀 Graphykon Debug Startup Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "backend/package.json" ] || [ ! -f "frontend/package.json" ]; then
    print_error "Please run this script from the Graphykon root directory"
    exit 1
fi

print_status "Found Graphykon project structure"

# Step 1: Check environment
print_info "Step 1: Checking Environment"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Step 2: Check .env file
print_info "Step 2: Checking Environment Variables"
if [ -f "backend/.env" ]; then
    print_status "Found backend/.env file"
    
    # Check for required variables (without showing values)
    if grep -q "MONGODB_URI" backend/.env; then
        print_status "MONGODB_URI is set"
    else
        print_error "MONGODB_URI not found in .env"
        exit 1
    fi
    
    if grep -q "JWT_SECRET" backend/.env; then
        print_status "JWT_SECRET is set"
    else
        print_warning "JWT_SECRET not found in .env, using default"
    fi
else
    print_error "backend/.env file not found"
    exit 1
fi

# Step 3: Install dependencies
print_info "Step 3: Installing Dependencies"
cd backend
print_info "Installing backend dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_status "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

cd ../frontend
print_info "Installing frontend dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_status "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

cd ..

# Step 4: Test MongoDB connection
print_info "Step 4: Testing MongoDB Connection"
cd backend
node test-signup-flow.js
if [ $? -eq 0 ]; then
    print_status "MongoDB connection test passed"
else
    print_warning "MongoDB connection test failed - server will start anyway"
fi

# Step 5: Stop existing processes
print_info "Step 5: Stopping Existing Processes"
pkill -f "node server.js" || true
pkill -f "npm start" || true
pm2 delete graphykon-backend 2>/dev/null || true
pm2 delete graphykon-frontend 2>/dev/null || true
print_status "Cleaned up existing processes"

# Step 6: Start backend
print_info "Step 6: Starting Backend Server"
pm2 start server.js --name graphykon-backend --log-date-format "YYYY-MM-DD HH:mm:ss"
if [ $? -eq 0 ]; then
    print_status "Backend server started with PM2"
else
    print_error "Failed to start backend server"
    exit 1
fi

# Wait for backend to start
sleep 3

# Test backend health
print_info "Testing backend health..."
curl -s http://localhost:5000/api/health > /dev/null
if [ $? -eq 0 ]; then
    print_status "Backend health check passed"
else
    print_warning "Backend health check failed"
fi

# Step 7: Start frontend
print_info "Step 7: Starting Frontend Server"
cd ../frontend
pm2 start npm --name graphykon-frontend -- start
if [ $? -eq 0 ]; then
    print_status "Frontend server started with PM2"
else
    print_error "Failed to start frontend server"
    exit 1
fi

# Step 8: Show status
print_info "Step 8: System Status"
echo ""
print_status "🎉 Graphykon started successfully!"
echo ""
echo "📊 Process Status:"
pm2 list
echo ""
echo "🌐 URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo "   Health:   http://localhost:5000/api/health"
echo "   Debug:    http://localhost:5000/api/debug/db-status"
echo ""
echo "📋 Useful Commands:"
echo "   View logs:     pm2 logs"
echo "   Stop all:      pm2 stop all"
echo "   Restart:       pm2 restart all"
echo "   Monitor:       pm2 monit"
echo ""
print_info "Monitor the logs with: pm2 logs" 