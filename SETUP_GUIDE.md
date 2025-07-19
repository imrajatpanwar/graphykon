# Graphykon Setup Guide

## 🚀 Quick Setup for Server (89.117.58.204)

### 1. MongoDB Setup

You need to install and configure MongoDB on your server. Here are the options:

#### Option A: Install MongoDB locally on your server
```bash
# For Ubuntu/Debian
sudo apt update
sudo apt install mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Check status
sudo systemctl status mongodb
```

#### Option B: Use MongoDB Atlas (Recommended for production)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get your connection string
4. Update the `.env` file with your Atlas connection string

### 2. Environment Configuration

Update your `backend/.env` file:

```env
# For local MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/graphykon

# For MongoDB Atlas (replace with your connection string)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/graphykon

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=production
PORT=5000
```

### 3. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 4. Run Setup Script

```bash
cd backend
node setup-server.js
```

This will:
- Test MongoDB connection
- Create an admin user (admin@graphykon.com / admin123)
- Verify user creation works

### 5. Start the Application

```bash
# Start backend (in one terminal)
cd backend
npm start

# Start frontend (in another terminal)
cd frontend
npm start
```

### 6. Access the Application

- Frontend: http://89.117.58.204:3000
- Backend API: http://89.117.58.204:5000
- Admin login: admin@graphykon.com / admin123

## 🔧 Troubleshooting

### MongoDB Connection Issues

1. **Check if MongoDB is running:**
   ```bash
   sudo systemctl status mongodb
   ```

2. **Check MongoDB logs:**
   ```bash
   sudo journalctl -u mongodb
   ```

3. **Test MongoDB connection:**
   ```bash
   cd backend
   node test-connection.js
   ```

### Signup Issues

1. **Check server logs:**
   ```bash
   cd backend
   npm start
   ```

2. **Verify API endpoints:**
   ```bash
   curl -X POST http://89.117.58.204:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@example.com","password":"test123"}'
   ```

3. **Check CORS configuration** - The server is configured to accept requests from:
   - http://localhost:3000
   - https://graphykon.com
   - https://www.graphykon.com
   - http://89.117.58.204
   - https://89.117.58.204

### Data Fetching Issues

1. **Check MongoDB collections:**
   ```bash
   mongo
   use graphykon
   show collections
   db.users.find()
   ```

2. **Verify database connection in server logs**

## 📁 File Structure

```
Graphykon/
├── backend/
│   ├── .env                    # Environment variables
│   ├── server.js              # Main server file
│   ├── models/                # Database models
│   ├── routes/                # API routes
│   ├── middleware/            # Authentication middleware
│   └── setup-server.js        # Setup script
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── context/           # React context
│   │   └── App.js            # Main app component
│   └── package.json
└── SETUP_GUIDE.md            # This file
```

## 🔒 Security Notes

1. **Change the JWT_SECRET** in production
2. **Use HTTPS** in production
3. **Set up proper firewall rules**
4. **Use environment variables** for sensitive data
5. **Regularly update dependencies**

## 🚀 Production Deployment

For production deployment:

1. **Use PM2 for process management:**
   ```bash
   npm install -g pm2
   pm2 start server.js --name graphykon-backend
   pm2 startup
   ```

2. **Set up Nginx reverse proxy:**
   ```nginx
   server {
       listen 80;
       server_name 89.117.58.204;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
       
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Use MongoDB Atlas** for reliable database hosting

## 📞 Support

If you encounter issues:

1. Check the server logs
2. Verify MongoDB connection
3. Test API endpoints manually
4. Check browser console for frontend errors
5. Verify environment variables are set correctly 