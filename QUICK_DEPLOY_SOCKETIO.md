# Quick Deploy Socket.IO Fixes

## 🚨 Current Issue
You're getting a 502 Bad Gateway error for Socket.IO:
```
GET https://graphykon.com/socket.io/?EIO=4&transport=polling&t=8kb2w48a 502 (Bad Gateway)
```

## 🚀 Quick Fix Steps

### Step 1: SSH into your server
```bash
ssh root@89.117.58.204
```

### Step 2: Navigate to your project
```bash
cd /path/to/your/graphykon/project
```

### Step 3: Pull the latest changes
```bash
git pull origin main
```

### Step 4: Update Nginx configuration
```bash
# Copy the improved Socket.IO configuration
sudo cp nginx-socketio-fix.conf /etc/nginx/sites-available/graphykon

# Test the configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 5: Restart the backend server
```bash
# Navigate to backend
cd backend

# Install dependencies (if needed)
npm install

# Restart with PM2
pm2 restart graphykon-backend

# Check status
pm2 status
```

### Step 6: Test the connection
```bash
# Go back to project root
cd ..

# Test Socket.IO connection
node test-socket-connection.js
```

## 🔍 Verification

### Check if backend is running
```bash
# Check if port 5000 is listening
netstat -tlnp | grep :5000

# Check PM2 status
pm2 status

# Check backend logs
pm2 logs graphykon-backend
```

### Test endpoints
```bash
# Test backend API
curl http://localhost:5000/api/health

# Test Socket.IO endpoint
curl http://localhost:5000/socket.io/
```

### Check Nginx logs
```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

## 🛠️ Alternative: Use the deployment script

If you prefer to use the automated script:

```bash
# Make the script executable
chmod +x deploy-socketio-fix.sh

# Run the deployment
./deploy-socketio-fix.sh
```

## 📋 Common Issues & Solutions

### Issue 1: Backend not starting
```bash
# Check if MongoDB is accessible
cd backend
node test-connection.js

# Check environment variables
cat .env

# Check PM2 logs
pm2 logs graphykon-backend --lines 20
```

### Issue 2: Nginx configuration error
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx
```

### Issue 3: Port 5000 not listening
```bash
# Check what's using port 5000
sudo lsof -i :5000

# Kill any conflicting processes
sudo pkill -f "node.*server.js"

# Restart backend
pm2 restart graphykon-backend
```

## ✅ Expected Result

After successful deployment:
1. ✅ Backend server running on port 5000
2. ✅ Nginx properly configured for Socket.IO
3. ✅ No more 502 errors in browser console
4. ✅ Socket.IO connects successfully
5. ✅ Real-time features work (live visitors, messages, etc.)

## 📞 If Still Having Issues

1. **Check server logs**:
   ```bash
   pm2 logs graphykon-backend
   sudo tail -f /var/log/nginx/error.log
   ```

2. **Test manually**:
   ```bash
   node test-socket-connection.js
   ```

3. **Review troubleshooting guide**:
   ```bash
   cat SOCKET_IO_TROUBLESHOOTING.md
   ```

4. **Check server resources**:
   ```bash
   # Check disk space
   df -h
   
   # Check memory usage
   free -h
   
   # Check CPU usage
   top
   ``` 