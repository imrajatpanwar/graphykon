import React from 'react';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div>
      <div className="nav">
        <span>Welcome, {user?.name || user?.email}!</span>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
      
      <div className="home-container">
        <h1>Welcome to Graphykon</h1>
        <p>You are successfully logged in!</p>
        
        <div style={{ marginTop: '30px' }}>
          <h3>User Information:</h3>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>User ID:</strong> {user?.id || user?.sub}</p>
          <p><strong>Token Expires:</strong> {user?.exp ? new Date(user.exp * 1000).toLocaleString() : 'N/A'}</p>
        </div>
        
        <div style={{ marginTop: '30px' }}>
          <h3>What you can do:</h3>
          <ul>
            <li>Access protected routes</li>
            <li>Make authenticated API calls</li>
            <li>Your JWT token is automatically included in requests</li>
            <li>Token expiration is handled automatically</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Home; 