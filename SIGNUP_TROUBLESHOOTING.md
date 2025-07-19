# 🚨 Signup Troubleshooting Guide

## 🔍 Quick Diagnosis

### Run These Commands on Your Server:

```bash
# 1. Check server health
curl http://localhost:5000/api/health

# 2. Check detailed database status
curl http://localhost:5000/api/debug/db-status

# 3. Test complete signup flow
cd backend && node test-signup-flow.js

# 4. Check server logs
pm2 logs graphykon-backend --lines 50
```

---

## 🛠️ Common Issues & Solutions

### ❌ Issue 1: "Database connection failed"

**Symptoms:**
- HTTP 503 errors on signup
- "MongoDB not available" in logs
- Connection state: 0 (disconnected)

**Solutions:**

1. **Check MongoDB Atlas IP Whitelist:**
   ```bash
   # Get your server's IP
   curl ifconfig.me
   ```
   - Add this IP to MongoDB Atlas Network Access
   - Or add `0.0.0.0/0` for testing (not recommended for production)

2. **Verify Connection String:**
   ```bash
   cat backend/.env | grep MONGODB_URI
   ```
   Should look like:
   ```
   MONGODB_URI=mongodb+srv://imgraphykon:aF4p3FUBuQBUXdAP@cluster0.cwpplfy.mongodb.net/graphykon?retryWrites=true&w=majority&appName=Cluster0
   ```

3. **Test Connection Manually:**
   ```bash
   cd backend
   node -e "
   require('dotenv').config();
   const mongoose = require('mongoose');
   mongoose.connect(process.env.MONGODB_URI)
     .then(() => console.log('✅ Connected'))
     .catch(err => console.log('❌ Failed:', err.message));
   "
   ```

---

### ❌ Issue 2: "Validation Error" 

**Symptoms:**
- HTTP 400 errors
- "Validation failed" messages

**Solutions:**

1. **Check Input Data:**
   - Name: minimum 2 characters
   - Email: valid email format
   - Password: minimum 6 characters

2. **Test with curl:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@example.com","password":"test123"}'
   ```

---

### ❌ Issue 3: "User already exists"

**Symptoms:**
- HTTP 400 errors
- Duplicate key error (code 11000)

**Solutions:**

1. **Check existing users:**
   ```bash
   # In MongoDB compass or shell
   db.users.find({email: "test@example.com"})
   ```

2. **Use different email/name for testing**

---

### ❌ Issue 4: Frontend Connection Issues

**Symptoms:**
- ERR_CONNECTION_REFUSED
- Network errors in browser

**Solutions:**

1. **Check API Configuration:**
   ```bash
   # In frontend/src/config/api.js
   cat frontend/src/config/api.js
   ```

2. **Verify Backend is Running:**
   ```bash
   curl http://localhost:5000/api/health
   ps aux | grep node
   pm2 list
   ```

---

## 🔧 Step-by-Step Fix Process

### Step 1: Environment Check
```bash
# Check if .env exists and has correct values
ls -la backend/.env
cat backend/.env | grep -E "(MONGODB_URI|JWT_SECRET)"
```

### Step 2: Dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Step 3: Database Test
```bash
cd backend
node test-signup-flow.js
```

### Step 4: Server Restart
```bash
pm2 restart graphykon-backend
pm2 logs graphykon-backend --lines 20
```

### Step 5: Frontend Restart
```bash
pm2 restart graphykon-frontend
pm2 logs graphykon-frontend --lines 20
```

### Step 6: End-to-End Test
```bash
# Test signup API directly
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Debug User","email":"debug@test.com","password":"test123456"}'
```

---

## 📊 Monitoring Commands

### Real-time Logs
```bash
# Watch all logs
pm2 logs

# Watch specific service
pm2 logs graphykon-backend
pm2 logs graphykon-frontend

# Watch with timestamps
pm2 logs --timestamp
```

### System Status
```bash
# Process status
pm2 list
pm2 monit

# Server resources
top
df -h
free -m
```

### Health Checks
```bash
# Basic health
curl http://localhost:5000/api/health

# Detailed database status
curl http://localhost:5000/api/debug/db-status

# Frontend status
curl http://localhost:3000
```

---

## 🚀 Quick Fix Script

Run this if nothing else works:

```bash
#!/bin/bash
echo "🔧 Quick Fix for Signup Issues"

# Stop everything
pm2 stop all
pm2 delete all

# Update code
git pull origin main

# Fresh install
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules && npm install

# Test database
cd ../backend && node test-signup-flow.js

# Start services
bash ../start-debug.sh

echo "✅ Fix complete - check pm2 logs"
```

---

## 🆘 If All Else Fails

1. **Check server resources:**
   ```bash
   df -h          # Disk space
   free -m        # Memory
   top            # CPU usage
   ```

2. **Restart entire server:**
   ```bash
   sudo reboot
   ```

3. **Check network connectivity:**
   ```bash
   ping google.com
   ping cluster0.cwpplfy.mongodb.net
   ```

4. **MongoDB Atlas Dashboard:**
   - Check cluster status
   - Verify connection limits
   - Check recent activity logs

---

## 📞 Debug Information to Collect

When reporting issues, provide:

1. **Health check output:**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Database status:**
   ```bash
   curl http://localhost:5000/api/debug/db-status
   ```

3. **Server logs:**
   ```bash
   pm2 logs graphykon-backend --lines 50
   ```

4. **System info:**
   ```bash
   node --version
   npm --version
   pm2 --version
   uname -a
   ```

5. **Network test:**
   ```bash
   curl ifconfig.me
   ping cluster0.cwpplfy.mongodb.net
   ```

---

**🎯 Most Common Fix:** MongoDB Atlas IP whitelist + correct connection string in `.env` 