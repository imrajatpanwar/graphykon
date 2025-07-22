# Graphykon Full-Stack Application

A complete full-stack application with React frontend and Node.js/Express backend, featuring JWT authentication and MongoDB Atlas integration.

## Project Structure

```
graphykon/
├── client/                 # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # Authentication context
│   │   ├── config/         # API configuration
│   │   └── ...
│   ├── package.json
│   └── README.md
├── server/                 # Node.js Backend
│   ├── models/             # MongoDB models
│   ├── middleware/         # Authentication middleware
│   ├── routes/             # API routes
│   ├── server.js           # Main server file
│   ├── package.json
│   └── README.md
└── README.md               # This file
```

## Quick Start

### 1. Backend Setup (Server Deployment)

```bash
# On your server (89.117.58.204)
cd server
npm install
cp env.example .env
# Edit .env with your MongoDB Atlas credentials
npm start
```

### 2. Frontend Setup (Local Development)

```bash
# On your local machine
cd client
npm install
npm run dev
```

### 3. Access the Application

- Frontend (Local): http://localhost:3000
- Backend API (Live): https://graphykon.com/api

## Features

### Frontend (React)
- ✅ Modern React with hooks
- ✅ JWT authentication
- ✅ Protected routes
- ✅ Responsive UI
- ✅ Axios API integration
- ✅ React Router v6

### Backend (Node.js/Express)
- ✅ RESTful API
- ✅ MongoDB Atlas integration
- ✅ JWT authentication
- ✅ Password hashing with bcrypt
- ✅ Input validation
- ✅ Security middleware
- ✅ Rate limiting

## Development Workflow

1. **Backend**: Runs on server (89.117.58.204) with MongoDB Atlas
2. **Frontend**: Runs locally, connects to live backend at graphykon.com
3. **Deployment**: Code → GitHub → Pull on server
4. **Database**: MongoDB Atlas (cloud-hosted)

## Deployment

### Backend to Server (89.117.58.204)
1. Push code to GitHub
2. SSH to your server: `ssh user@89.117.58.204`
3. Pull latest code: `git pull origin main`
4. Install dependencies: `npm install`
5. Configure environment variables in `.env`
6. Restart server: `pm2 restart graphykon-server`

### Frontend (Local Development)
- No deployment needed - runs locally
- Automatically connects to live backend at graphykon.com

## API Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get user profile (protected)
- `GET /api/health` - Server health check

## Environment Variables

### Backend (.env)
```env
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
JWT_EXPIRE=24h
CORS_ORIGIN=http://localhost:3000
```

### Frontend
The frontend is configured to connect to your live backend at graphykon.com.

## Testing

### Backend API Testing
```bash
# Test signup (from any machine)
curl -X POST https://graphykon.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'
```

### Frontend Testing
1. Ensure backend is running on server (89.117.58.204) and accessible at graphykon.com
2. Start frontend locally: `cd client && npm run dev`
3. Visit http://localhost:3000
4. Create account and test login/logout

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- Rate limiting
- Security headers (helmet)

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure CORS_ORIGIN is set correctly
2. **MongoDB Connection**: Check connection string and network access
3. **JWT Issues**: Verify JWT_SECRET is set and tokens are valid
4. **Port Conflicts**: Change PORT in .env if needed

### Logs
- Backend logs: Check server console output
- Frontend logs: Check browser developer tools

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## License

MIT License - see LICENSE file for details
