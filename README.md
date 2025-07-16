# Full Stack Authentication App

This is a full-stack application with React frontend and Node.js backend, featuring user authentication.

## Project Structure
- `/frontend` - React frontend application
- `/backend` - Node.js backend server

## Features
- User authentication (Login/Signup)
- Protected routes
- JWT-based authentication
- MongoDB database
- Modern UI with React and Bootstrap

## Setup Instructions

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/auth-app
   JWT_SECRET=your_jwt_secret
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

## Technologies Used
- Frontend: React, JavaScript, Bootstrap
- Backend: Node.js, Express, JavaScript
- Database: MongoDB
- Authentication: JWT 