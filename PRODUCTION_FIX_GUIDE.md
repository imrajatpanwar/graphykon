# Production Connection Issues - Fix Guide

## 🚨 **Current Issue:**
- Website shows: `Failed to load resource: net::ERR_CONNECTION_REFUSED localhost:5000/api/creator/profile:1`
- Frontend trying to connect to `localhost:5000` instead of production server
- Backend server not running or not accessible

## 🔧 **What I've Fixed:**

### **1. Dynamic API Configuration**
- ✅ Created `frontend/src/config/api.js` - Smart environment detection
- ✅ Updated `AuthContext.js` - Uses dynamic API URLs
- ✅ Automatic detection of development vs production environment

### **2. Server Status Debugging**
- ✅ Created `frontend/src/utils/serverCheck.js` - Connection debugging tools
- ✅ Added automatic debug on app startup
- ✅ Detailed error reporting and troubleshooting

### **3. Production Startup Script**
- ✅ Created `start-production.sh` - Complete production setup
- ✅ Automatic MongoDB setup and testing
- ✅ PM2 process management
- ✅ Health checks and monitoring

## 🚀 **How to Fix Your Server:**

### **Step 1: SSH into your server**
```bash
ssh root@89.117.58.204
```

### **Step 2: Navigate to your project**
```bash
cd /path/to/Graphykon
```

### **Step 3: Pull latest changes**
```bash
git pull origin main
```

### **Step 4: Run the production startup script**
```bash
chmod +x start-production.sh
./start-production.sh
```

### **Step 5: Verify everything is running**
```bash
# Check PM2 status
pm2 status

# Check MongoDB
sudo systemctl status mongodb

# Test API endpoints
curl http://localhost:5000/api
curl http://localhost:5000/api/health
```

## 🔍 **Manual Troubleshooting:**

### **If Backend Won't Start:**
```bash
cd backend

# Check MongoDB connection
node test-connection.js

# Check environment variables
cat .env

# Start server manually to see errors
node server.js

# Or start with PM2
pm2 start server.js --name graphykon-backend
pm2 logs graphykon-backend
```

### **If Frontend Won't Connect:**
```bash
cd frontend

# Check the built-in debug info (browser console)
# Look for: "🔍 Checking Server Status..."

# Test API configuration
node -e "
const getApiConfig = require('./src/config/api.js').default;
console.log('API Config:', getApiConfig());
"
```

### **If MongoDB Issues:**
```bash
# Install MongoDB
sudo apt update
sudo apt install mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Check status
sudo systemctl status mongodb

# Test connection
cd backend && node test-connection.js
```

## 📋 **Expected Results:**

### **After running the fix:**
1. ✅ **Backend running** on port 5000
2. ✅ **Frontend running** on port 3000  
3. ✅ **MongoDB connected** and accessible
4. ✅ **Dynamic API URLs** based on environment
5. ✅ **Health monitoring** available

### **URLs should work:**
- Frontend: `http://89.117.58.204:3000`
- Backend API: `http://89.117.58.204:5000/api`
- Health Check: `http://89.117.58.204:5000/api/health`

### **No more localhost errors:**
- Frontend will automatically detect it's running on `89.117.58.204`
- API calls will go to `http://89.117.58.204:5000` instead of `localhost:5000`
- Real-time debugging in browser console

## 🔧 **Debug Information:**

### **Browser Console (F12):**
The frontend now automatically shows:
```
🔍 Checking Server Status...
Current environment: production
API Base URL: http://89.117.58.204:5000
Socket URL: http://89.117.58.204:5000
✅ Server is responding: {message: "Graphykon API is working", ...}
```

### **If you see errors:**
```
❌ Server connection failed: ERR_CONNECTION_REFUSED
📋 Connection refused - server might not be running
```

This means the backend server isn't running - use the startup script!

## ⚡ **Quick Commands for Your Server:**

```bash
# Quick restart everything
pm2 restart all

# Check what's running
pm2 status

# View logs
pm2 logs

# Stop everything
pm2 stop all

# Start production mode
./start-production.sh

# Test connectivity
curl http://89.117.58.204:5000/api/health
```

## 🎯 **Next Steps:**

1. **Run the startup script** on your server
2. **Check browser console** for debug information
3. **Test the health endpoint** to verify everything works
4. **Monitor PM2 status** for any issues

The ERR_CONNECTION_REFUSED error should be completely resolved once the backend server is running and the dynamic API configuration is deployed! 🚀 