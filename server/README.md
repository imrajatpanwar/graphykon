# Graphykon Backend Server

A Node.js/Express backend server with MongoDB Atlas integration and JWT authentication.

## Features

- ✅ Express.js REST API
- ✅ MongoDB Atlas integration with Mongoose
- ✅ JWT authentication with bcrypt password hashing
- ✅ Input validation with express-validator
- ✅ Security middleware (helmet, rate limiting, CORS)
- ✅ User registration and login endpoints
- ✅ Protected routes with JWT middleware

## Project Structure

```
server/
├── models/
│   └── User.js           # User model with password hashing
├── middleware/
│   └── auth.js           # JWT authentication middleware
├── routes/
│   └── auth.js           # Authentication routes
├── server.js             # Main server file
├── package.json          # Dependencies
└── env.example           # Environment variables template
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Configuration

Copy `env.example` to `.env` and configure your variables:

```bash
cp env.example .env
```

Edit `.env` with your actual values:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://imgraphykon:Xunlah0Z59VD1xV7@cluster0.cwpplfy.mongodb.net/graphykon?retryWrites=true&w=majority&appName=Cluster0

# JWT Secret Key (generate a strong secret)
JWT_SECRET=your-super-secret-jwt-key-here

# JWT Expiration Time
JWT_EXPIRE=24h

# CORS Origin (React app URL)
CORS_ORIGIN=http://localhost:3000
```

### 3. Start Development Server

```bash
npm run dev
```

The server will run on `http://localhost:3000`

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/signup
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "lastLogin": "2023-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/auth/login
Login existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "lastLogin": "2023-01-01T00:00:00.000Z"
  }
}
```

#### GET /api/auth/me
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "lastLogin": "2023-01-01T00:00:00.000Z"
  }
}
```

### Health Check

#### GET /api/health
Check server status.

**Response:**
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Input Validation**: Request validation with express-validator
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configured for React app
- **Helmet**: Security headers
- **Environment Variables**: Sensitive data protection

## MongoDB Atlas Setup

✅ **Already Configured**

Your MongoDB Atlas connection is already set up:
- **Cluster**: Cluster0
- **Database**: graphykon
- **Connection String**: Configured in env.example

**Important**: Make sure to add your server IP (89.117.58.204) to the MongoDB Atlas IP whitelist for the connection to work.

## Testing the API

### Using curl

**Signup:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Get Profile (with token):**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Deployment to Contabo

1. Upload the server folder to your Contabo server
2. Install dependencies: `npm install`
3. Set up environment variables
4. Use PM2 or similar process manager:
   ```bash
   npm install -g pm2
   pm2 start server.js --name graphykon-server
   pm2 startup
   pm2 save
   ```

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (to be implemented)

## Error Handling

The server includes comprehensive error handling:
- Validation errors with detailed messages
- Authentication errors
- Database connection errors
- General server errors

All errors return appropriate HTTP status codes and JSON responses. 