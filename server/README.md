# Graphykon Server

Backend server for the Graphykon application.

## Features

- User authentication and authorization
- Creator registration and management
- Asset upload and management
- File storage and serving

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Creator
- `POST /api/creator/be-a-creator` - Register as a creator

### Assets
- `POST /api/assets/upload` - Upload a new asset
- `GET /api/assets` - Get all assets for a creator
- `GET /api/assets/:id` - Get a specific asset
- `PUT /api/assets/:id` - Update an asset
- `DELETE /api/assets/:id` - Delete an asset
- `GET /api/assets/download/:id` - Download an asset file

### Analytics
- `POST /api/analytics/track` - Track an analytics event
- `GET /api/analytics/overview` - Get analytics overview for a creator
- `GET /api/analytics/monthly` - Get monthly analytics data
- `GET /api/analytics/top-assets` - Get top performing assets
- `GET /api/analytics/category-breakdown` - Get analytics breakdown by category
- `GET /api/analytics/recent-activity` - Get recent activity

## File Upload

The server supports file uploads with the following specifications:

- **Main File**: Up to 500MB, supports JPG, PNG, PSD, PDF, AI, EPS, SVG, ZIP, RAR
- **Cover Images**: Up to 4 images, 10MB each, image formats only
- Files are stored in the `uploads/` directory
- Files are served statically at `/uploads/` endpoint

## Environment Variables

Create a `.env` file with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
PORT=5000
```

## Installation

```bash
npm install
npm start
```

For development:
```bash
npm run dev
```

## Models

### User
- Basic user information
- Creator status and profile
- Authentication data

### Asset
- Asset metadata (title, description, tags, etc.)
- File information (main file and cover images)
- Creator relationship
- Statistics (downloads, views, ratings)

### Analytics
- User interaction tracking (views, downloads, likes, shares)
- Session management for anonymous users
- Performance metrics and trends
- Category and asset performance analysis 