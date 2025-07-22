# Graphykon React Application

A full-stack React application with authentication that connects to a Contabo server backend.

## Features

- ✅ React frontend with modern UI
- ✅ Login and Signup pages
- ✅ Protected Home page (requires authentication)
- ✅ JWT token-based authentication
- ✅ Automatic token management and expiration handling
- ✅ Axios setup for API calls
- ✅ React Router v6 for navigation
- ✅ Auth context for state management

## Project Structure

```
src/
├── components/
│   ├── Login.js          # Login form component
│   ├── Signup.js         # Signup form component
│   ├── Home.js           # Protected home page
│   └── PrivateRoute.js   # Route protection component
├── context/
│   └── AuthContext.js    # Authentication context
├── config/
│   └── api.js           # Axios configuration
├── App.js               # Main app component
├── index.js             # App entry point
└── index.css            # Global styles
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. API Configuration

The frontend is configured to connect to your live backend server at graphykon.com.

```javascript
const API_BASE_URL = 'https://graphykon.com/api';
```

### 3. Start Development Server

```bash
npm run dev
```

The app will run on `http://localhost:3000` and connect to the live backend at `https://graphykon.com`

## API Endpoints

The application expects the following API endpoints on your live backend server (graphykon.com):

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration

### Expected Request/Response Format

#### Login Request:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Login Response:
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

#### Signup Request:
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123"
}
```

#### Signup Response:
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

## Authentication Flow

1. **Login/Signup**: User submits credentials
2. **Token Storage**: JWT token is stored in localStorage
3. **Automatic Headers**: Token is automatically included in API requests
4. **Token Expiration**: Expired tokens are handled automatically
5. **Route Protection**: Unauthenticated users are redirected to login

## Testing Locally

1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. You'll be redirected to the login page
4. Create an account or login with existing credentials
5. After successful authentication, you'll be redirected to the home page
6. Try accessing `/home` directly - it should be protected
7. Click logout to test the logout functionality

## Environment Variables (Optional)

The API URL is hardcoded to connect to your live backend server. If you need to change it, edit `src/config/api.js`:

```javascript
const API_BASE_URL = 'https://graphykon.com/api';
```

## Troubleshooting

### CORS Issues
If you encounter CORS errors, ensure your Contabo server has proper CORS configuration:

```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### Connection Issues
- Verify your backend server is running and accessible at graphykon.com
- Check firewall settings on your server
- Ensure the API endpoints match the expected format

### JWT Issues
- Verify your backend is generating valid JWT tokens
- Check token expiration settings
- Ensure the token payload includes necessary user information

## Available Scripts

- `npm start` - Start the development server
- `npm run dev` - Start the development server (alias)
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App 