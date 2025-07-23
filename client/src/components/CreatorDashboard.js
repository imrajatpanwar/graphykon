import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './CreatorDashboard.css';

const CreatorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if not a creator
  React.useEffect(() => {
    if (user && !user.creator) {
      navigate('/be-a-creator');
    }
  }, [user, navigate]);

  if (!user || !user.creator) {
    return null;
  }

  return (
    <div className="creator-dashboard">
      <div className="dashboard-header">
        <h1>Welcome to Your Studio</h1>
        <p>You're now a creator! Start building your content and growing your audience.</p>
      </div>
      
      <div className="dashboard-content">
        <div className="creator-info">
          <div className="profile-section">
            {user.profileImage ? (
              <img src={user.profileImage} alt="Profile" className="profile-image" />
            ) : (
              <div className="profile-placeholder">
                {user.name?.charAt(0)?.toUpperCase() || 'C'}
              </div>
            )}
            <div className="profile-details">
              <h2>{user.name}</h2>
              <p className="username">@{user.username}</p>
              <p className="location">{user.location}</p>
            </div>
          </div>
          
          <div className="bio-section">
            <h3>About You</h3>
            <p>{user.bio}</p>
          </div>
        </div>
        
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Content Created</h3>
            <p className="stat-number">0</p>
            <p className="stat-label">Start creating your first piece of content!</p>
          </div>
          
          <div className="stat-card">
            <h3>Followers</h3>
            <p className="stat-number">0</p>
            <p className="stat-label">Build your audience</p>
          </div>
          
          <div className="stat-card">
            <h3>Views</h3>
            <p className="stat-number">0</p>
            <p className="stat-label">Track your reach</p>
          </div>
        </div>
        
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button className="action-btn primary">
              Create New Content
            </button>
            <button className="action-btn secondary">
              Edit Profile
            </button>
            <button className="action-btn secondary">
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard; 