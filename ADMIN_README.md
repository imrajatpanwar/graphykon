# Graphykon Admin Dashboard

A comprehensive admin dashboard for managing the Graphykon platform, including users, assets, graphs, and reviews.

## Features

### 🎯 Dashboard Overview
- **Real-time Statistics**: Total users, creators, assets, graphs, reviews, downloads, and views
- **Recent Activity**: Latest users, assets, and reviews
- **Visual Metrics**: Beautiful stat cards with color-coded indicators

### 👥 User Management
- **Complete User Control**: View, edit, and delete users
- **Role Management**: Assign user, creator, or admin roles
- **Status Control**: Activate, suspend, or deactivate accounts
- **Advanced Search**: Search by name, email, or display name
- **Filtering**: Filter by role and status
- **Bulk Operations**: Paginated view with customizable items per page

### 🎨 Asset Management
- **Asset Overview**: View all assets with creator information
- **Category Filtering**: Filter by design categories
- **License Management**: Filter by free/premium licenses
- **Performance Metrics**: View download and view counts
- **Content Moderation**: Remove inappropriate assets

### 📊 Graph Management
- **Graph Visualization Data**: View graph nodes and edges count
- **Visibility Control**: See public/private graph settings
- **Creator Information**: Track graph creators
- **Content Management**: Remove graphs when necessary

### ⭐ Review Management
- **Review Moderation**: View all user reviews
- **Rating Analysis**: Visual star ratings and rating badges
- **Content Control**: Remove inappropriate reviews
- **User Tracking**: See reviewer and creator information

## Getting Started

### 1. Create Admin User

First, create an admin user by running the setup script:

```bash
cd backend
node scripts/createAdmin.js
```

This creates an admin user with:
- **Email**: admin@graphykon.com
- **Password**: admin123
- **⚠️ Important**: Change this password immediately after first login!

### 2. Login as Admin

1. Navigate to the login page
2. Use the admin credentials created above
3. You'll see an "Admin" link in the navigation bar

### 3. Access Dashboard

Click the "Admin" link in the navigation to access the dashboard at `/admin-dashboard`

## Admin Dashboard Sections

### Overview Tab
- Platform statistics and metrics
- Recent activity across all sections
- Quick insights into platform health

### Users Tab
- Search and filter users
- Edit user roles and permissions
- Manage user status (active/suspended/inactive)
- Delete users (with safety checks for last admin)

### Assets Tab
- Browse all platform assets
- Filter by category and license type
- View performance metrics
- Remove inappropriate content

### Graphs Tab
- View all user-created graphs
- Monitor graph complexity (nodes/edges)
- Check visibility settings
- Manage graph content

### Reviews Tab
- Moderate user reviews
- View rating distributions
- Remove inappropriate reviews
- Track review activity

## Security Features

### Admin Authentication
- JWT-based authentication
- Admin role verification
- Protected routes and APIs
- Session management

### Safety Measures
- Confirmation dialogs for destructive actions
- Last admin protection (cannot delete last admin user)
- Audit trails for admin actions
- Secure password handling

## API Endpoints

### Admin Routes (Protected)
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - User management
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/assets` - Asset management
- `DELETE /api/admin/assets/:id` - Delete asset
- `GET /api/admin/graphs` - Graph management
- `DELETE /api/admin/graphs/:id` - Delete graph
- `GET /api/admin/reviews` - Review management
- `DELETE /api/admin/reviews/:id` - Delete review
- `POST /api/admin/create-admin` - Create new admin

## Database Schema Updates

### User Model Enhancements
```javascript
{
  isAdmin: Boolean,           // Admin flag
  role: String,              // user, creator, admin
  status: String,            // active, suspended, inactive
  // ... existing fields
}
```

## Frontend Components

### Main Components
- `AdminDashboard.js` - Main dashboard container
- `AdminOverview.js` - Statistics and overview
- `AdminUsers.js` - User management interface
- `AdminAssets.js` - Asset management interface
- `AdminGraphs.js` - Graph management interface
- `AdminReviews.js` - Review management interface

### Styling
- `AdminDashboard.css` - Modern, responsive design
- Bootstrap integration for consistency
- FontAwesome icons for visual clarity

## Usage Tips

### Creating Additional Admins
1. Go to Users tab in admin dashboard
2. Find the user you want to promote
3. Click Edit and set role to "admin"
4. Check the "Is Admin" checkbox
5. Save changes

### Managing Content
- Use search and filters to find specific content
- All deletions require confirmation
- Use pagination for large datasets
- Monitor metrics to track platform health

### Best Practices
- Regularly review user accounts and activity
- Monitor for inappropriate content
- Keep admin accounts secure
- Use status controls instead of deletion when possible

## Troubleshooting

### Admin Access Issues
- Ensure user has `isAdmin: true` and `role: 'admin'`
- Check JWT token validity
- Verify admin routes are properly configured

### Missing Data
- Check database connections
- Verify API endpoints are accessible
- Ensure proper authentication headers

### Performance Issues
- Use pagination for large datasets
- Implement proper indexing on search fields
- Monitor API response times

## Development

### Adding New Admin Features
1. Create backend routes in `/backend/routes/admin.js`
2. Add frontend components in `/frontend/src/components/`
3. Update navigation in `AdminDashboard.js`
4. Add proper authentication checks

### Customizing Interface
- Modify CSS in `AdminDashboard.css`
- Update components for specific needs
- Add new statistics to overview

## Security Considerations

- Never hardcode admin credentials
- Use environment variables for sensitive data
- Implement proper logging for admin actions
- Regular security audits
- Password policy enforcement
- Rate limiting on admin endpoints

---

**Admin Dashboard Version**: 1.0.0  
**Last Updated**: December 2024  
**Compatibility**: Graphykon Platform v1.0+ 