#!/bin/bash

echo "🚀 Updating Graphykon Server (89.117.58.204)"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "backend" ]; then
    print_error "Please run this script from the Graphykon project root directory"
    exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update

# Install/Update Node.js if needed
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    print_status "Node.js already installed"
fi

# Install/Update PM2 if needed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
else
    print_status "PM2 already installed"
fi

# Pull latest changes from Git
print_status "Pulling latest changes from Git..."
git pull origin main

if [ $? -ne 0 ]; then
    print_error "Failed to pull from Git. Please check your connection and try again."
    exit 1
fi

# Install/Update backend dependencies
print_status "Installing backend dependencies..."
cd backend
npm install

# Check if .env file exists, if not create it
if [ ! -f ".env" ]; then
    print_warning "Creating .env file..."
    cat > .env << EOF
MONGODB_URI=mongodb://127.0.0.1:27017/graphykon
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=production
PORT=5000
EOF
    print_status ".env file created. Please update with your actual MongoDB connection string."
else
    print_status ".env file already exists"
fi

# Test MongoDB connection
print_status "Testing MongoDB connection..."
node test-connection.js

if [ $? -ne 0 ]; then
    print_warning "MongoDB connection failed. Please set up MongoDB or MongoDB Atlas."
    print_status "See setup-mongodb-atlas.md for MongoDB Atlas setup instructions."
fi

# Run setup script
print_status "Running setup script..."
node setup-server.js

# Restart backend with PM2
print_status "Restarting backend server..."
pm2 restart graphykon-backend || pm2 start server.js --name graphykon-backend

# Install/Update frontend dependencies
print_status "Installing frontend dependencies..."
cd ../frontend
npm install

# Build frontend for production
print_status "Building frontend for production..."
npm run build

# Restart frontend with PM2
print_status "Restarting frontend server..."
pm2 restart graphykon-frontend || pm2 start npm --name graphykon-frontend -- start

# Save PM2 configuration
pm2 save

# Show PM2 status
print_status "PM2 Status:"
pm2 status

# Test the application
print_status "Testing application endpoints..."

# Wait a moment for servers to start
sleep 5

# Test backend API
if curl -s http://localhost:5000/api > /dev/null; then
    print_status "Backend API is responding"
else
    print_error "Backend API is not responding"
fi

# Test frontend
if curl -s http://localhost:3000 > /dev/null; then
    print_status "Frontend is responding"
else
    print_error "Frontend is not responding"
fi

echo ""
echo "🎉 Server update completed!"
echo ""
echo "📋 Application URLs:"
echo "Frontend: http://89.117.58.204:3000"
echo "Backend API: http://89.117.58.204:5000"
echo ""
echo "🔧 Management commands:"
echo "View logs: pm2 logs"
echo "Restart all: pm2 restart all"
echo "Stop all: pm2 stop all"
echo "Status: pm2 status"
echo ""
echo "👤 Admin login: admin@graphykon.com / admin123"
echo ""
echo "📋 If MongoDB is not working:"
echo "1. Follow setup-mongodb-atlas.md for MongoDB Atlas setup"
echo "2. Or install local MongoDB: sudo apt install mongodb"
echo "3. Test connection: cd backend && node test-connection.js" 