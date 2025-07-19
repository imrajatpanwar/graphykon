#!/bin/bash

echo "🚀 Starting Graphykon in Production Mode"
echo "========================================"

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
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the Graphykon project root directory"
    exit 1
fi

# Install/Update PM2 if needed
if ! command -v pm2 &> /dev/null; then
    print_info "Installing PM2..."
    sudo npm install -g pm2
else
    print_status "PM2 is installed"
fi

# Check if MongoDB is running
print_info "Checking MongoDB status..."
if sudo systemctl is-active --quiet mongodb; then
    print_status "MongoDB is running"
else
    print_warning "MongoDB is not running, attempting to start..."
    sudo systemctl start mongodb
    if sudo systemctl is-active --quiet mongodb; then
        print_status "MongoDB started successfully"
    else
        print_error "Failed to start MongoDB"
        print_info "Installing MongoDB..."
        sudo apt update
        sudo apt install -y mongodb
        sudo systemctl start mongodb
        sudo systemctl enable mongodb
    fi
fi

# Test MongoDB connection
print_info "Testing MongoDB connection..."
cd backend
if node test-connection.js > /dev/null 2>&1; then
    print_status "MongoDB connection test passed"
else
    print_warning "MongoDB connection test failed"
    print_info "Running setup script..."
    node setup-server.js
fi

# Install backend dependencies
print_info "Installing backend dependencies..."
npm install

# Start backend with PM2
print_info "Starting backend server..."
pm2 delete graphykon-backend 2>/dev/null || true
pm2 start server.js --name graphykon-backend --env production

# Wait for backend to start
sleep 3

# Test backend
print_info "Testing backend API..."
if curl -s http://localhost:5000/api > /dev/null; then
    print_status "Backend API is responding"
else
    print_error "Backend API is not responding"
    print_info "Checking backend logs..."
    pm2 logs graphykon-backend --lines 10
fi

# Install frontend dependencies
print_info "Installing frontend dependencies..."
cd ../frontend
npm install

# Build frontend for production
print_info "Building frontend for production..."
REACT_APP_API_URL=http://89.117.58.204:5000 npm run build

# Start frontend with PM2
print_info "Starting frontend server..."
pm2 delete graphykon-frontend 2>/dev/null || true
pm2 start npm --name graphykon-frontend -- start

# Wait for frontend to start
sleep 5

# Test frontend
print_info "Testing frontend..."
if curl -s http://localhost:3000 > /dev/null; then
    print_status "Frontend is responding"
else
    print_error "Frontend is not responding"
    print_info "Checking frontend logs..."
    pm2 logs graphykon-frontend --lines 10
fi

# Save PM2 configuration
pm2 save
pm2 startup

# Show status
echo ""
print_status "Application Status:"
pm2 status

echo ""
print_status "🎉 Graphykon started successfully!"
echo ""
echo "📋 Access your application:"
echo "Frontend: http://89.117.58.204:3000"
echo "Backend API: http://89.117.58.204:5000"
echo "Health Check: http://89.117.58.204:5000/api/health"
echo ""
echo "🔧 Management commands:"
echo "View logs: pm2 logs"
echo "Restart all: pm2 restart all"
echo "Stop all: pm2 stop all"
echo "Status: pm2 status"
echo ""
echo "👤 Admin login: admin@graphykon.com / admin123" 