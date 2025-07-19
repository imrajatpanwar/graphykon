# Socket.IO 502 Bad Gateway Error - Troubleshooting Guide

## Problem Description
You're experiencing a 502 Bad Gateway error when trying to connect to Socket.IO:
```
GET https://graphykon.com/socket.io/?EIO=4&transport=polling&t=7zfrrepu 502 (Bad Gateway)
```

## Root Cause Analysis
The 502 error typically indicates that:
1. The backend server (port 5000) is not running
2. Nginx is not properly configured to proxy Socket.IO connections
3. There's a WebSocket upgrade issue
4. CORS configuration problems

## Solutions Applied

### 1. ✅ Backend Server Configuration
- **Enhanced Socket.IO setup** in `backend/server.js`:
  - Added proper CORS headers
  - Configured multiple transport methods (polling + websocket)
  - Added timeout and ping settings
  - Enabled EIO3 compatibility

### 2. ✅ Frontend Socket.IO Configuration
- **Improved connection handling** in all Socket.IO clients:
  - Added reconnection logic
  - Configured proper transport methods
  - Added error handling and logging
  - Set appropriate timeouts

### 3. ✅ Nginx Configuration
- **Enhanced proxy settings** for Socket.IO:
  - Disabled buffering and caching for Socket.IO
  - Extended timeouts
  - Added proper headers for WebSocket upgrade
  - Disabled gzip compression for Socket.IO

## Immediate Steps to Fix

### Step 1: Ensure Backend Server is Running
```bash
# Check if server is running on port 5000
netstat -an | grep :5000

# If not running, start it:
cd backend
npm start
```

### Step 2: Update Nginx Configuration
```bash
# Copy the improved configuration
sudo cp nginx-socketio-fix.conf /etc/nginx/sites-available/graphykon

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 3: Test Socket.IO Connection
```bash
# Run the test script
node test-socket-connection.js
```

### Step 4: Check Server Logs
```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check backend server logs
# (Look for Socket.IO connection messages)
```

## Verification Steps

### 1. Test Direct Backend Connection
```bash
curl http://localhost:5000/api/health
```

### 2. Test Socket.IO Endpoint
```bash
curl http://localhost:5000/socket.io/
```

### 3. Test Through Nginx
```bash
curl https://graphykon.com/api/health
```

## Common Issues and Solutions

### Issue 1: Backend Server Not Starting
**Symptoms**: Port 5000 not listening
**Solution**: 
- Check MongoDB connection
- Verify environment variables
- Check for port conflicts

### Issue 2: Nginx 502 Error
**Symptoms**: 502 Bad Gateway
**Solution**:
- Verify backend is running on port 5000
- Check Nginx configuration syntax
- Restart Nginx service

### Issue 3: CORS Errors
**Symptoms**: Browser console CORS errors
**Solution**:
- Verify CORS origins in backend
- Check credentials settings
- Ensure proper headers

### Issue 4: WebSocket Upgrade Fails
**Symptoms**: Connection falls back to polling
**Solution**:
- Check Nginx WebSocket configuration
- Verify proxy headers
- Test with different transport methods

## Debugging Commands

### Check Server Status
```bash
# Backend status
ps aux | grep node
netstat -tlnp | grep :5000

# Nginx status
sudo systemctl status nginx
sudo nginx -t
```

### Monitor Logs
```bash
# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Backend logs (if using PM2)
pm2 logs

# Backend logs (if running directly)
# Check the terminal where you started the server
```

### Test Network Connectivity
```bash
# Test local connection
curl -v http://localhost:5000/api/health

# Test through domain
curl -v https://graphykon.com/api/health

# Test Socket.IO endpoint
curl -v https://graphykon.com/socket.io/
```

## Configuration Files

### Backend Socket.IO Configuration
```javascript
const io = socketIo(server, {
  cors: {
    origin: [
      'http://localhost:3000', 
      'https://graphykon.com', 
      'https://www.graphykon.com',
      'http://89.117.58.204',
      'https://89.117.58.204'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});
```

### Frontend Socket.IO Configuration
```javascript
const socket = io(apiConfig.socketURL, {
  withCredentials: true,
  transports: ['polling', 'websocket'],
  timeout: 20000,
  forceNew: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000
});
```

### Nginx Socket.IO Configuration
```nginx
location /socket.io/ {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # Socket.IO specific settings
    proxy_buffering off;
    proxy_cache off;
    
    # Extended timeouts
    proxy_connect_timeout 75s;
    proxy_send_timeout 75s;
    proxy_read_timeout 75s;
    
    # Additional headers
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Server $host;
    proxy_set_header Accept-Encoding "";
}
```

## Expected Behavior After Fix

1. **Socket.IO Connection**: Should connect successfully with either polling or WebSocket transport
2. **Console Logs**: Should show "Socket.IO connected" messages
3. **Real-time Features**: Live visitors, messages, and admin features should work
4. **No 502 Errors**: Socket.IO requests should return 200 status codes

## Next Steps

1. **Restart Services**: Restart both backend and Nginx
2. **Test Connection**: Use the test script to verify Socket.IO works
3. **Monitor Logs**: Watch for any remaining errors
4. **Verify Features**: Test real-time features in the application

## Support

If issues persist after following this guide:
1. Check server logs for specific error messages
2. Verify all configuration files are properly updated
3. Test with the provided test script
4. Consider checking firewall settings and network connectivity 