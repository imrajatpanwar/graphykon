import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import getApiConfig from '../../config/api';
import useAdminRealTime from '../../hooks/useAdminRealTime';

const AdminOverview = () => {
  const { socket } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState(null);
  const [monetizationStats, setMonetizationStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const apiConfig = getApiConfig();
      // Fetch regular stats
      const statsResponse = await axios.get(`${apiConfig.baseURL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(statsResponse.data.stats);
      setRecentActivity(statsResponse.data.recentActivity);
      
      // Fetch monetization stats
      try {
        const monetizationResponse = await axios.get(`${apiConfig.baseURL}/api/monetization/admin/overview`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMonetizationStats(monetizationResponse.data);
      } catch (monetizationError) {
        console.error('Failed to fetch monetization stats:', monetizationError);
        // Don't fail the entire dashboard if monetization fails
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      setError('Failed to fetch dashboard data');
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time update handler for dashboard stats
  const handleRealTimeUpdate = useCallback((updateData) => {
    console.log('Dashboard real-time update:', updateData);
    
    if (updateData.type === 'stats' || updateData.action === 'updated') {
      if (updateData.data) {
        setStats(updateData.data);
        setLastUpdated(new Date());
      } else {
        // Refresh all data if specific stats not provided
        fetchDashboardData();
      }
    } else {
      // For other updates (users, assets, etc.), refresh all data
      fetchDashboardData();
    }
  }, [fetchDashboardData]);

  // Use real-time hook for dashboard stats
  useAdminRealTime('stats', handleRealTimeUpdate);

  useEffect(() => {
    fetchDashboardData();

    // Listen for real-time stats updates
    if (socket) {
      socket.on('admin-stats-update', (updateData) => {
        console.log('Stats update received:', updateData);
        if (updateData.data) {
          setStats(updateData.data);
          setLastUpdated(new Date());
        }
      });

      return () => {
        socket.off('admin-stats-update');
      };
    }
  }, [socket, fetchDashboardData]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLastUpdated = () => {
    const now = new Date();
    const diff = Math.floor((now - lastUpdated) / 1000);
    
    if (diff < 10) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return formatDate(lastUpdated);
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Dashboard Overview</h3>
        <div className="live-indicator">
          <span className="status-dot live"></span>
          <small className="text-muted ms-2">
            Last updated: {formatLastUpdated()}
          </small>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card users">
          <div className="stat-icon text-success">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-number">{stats?.totalUsers || 0}</div>
          <div className="stat-label">Total Users</div>
        </div>
        
        <div className="stat-card users">
          <div className="stat-icon text-info">
            <i className="fas fa-user-tie"></i>
          </div>
          <div className="stat-number">{stats?.totalCreators || 0}</div>
          <div className="stat-label">Creators</div>
        </div>
        
        <div className="stat-card assets">
          <div className="stat-icon text-warning">
            <i className="fas fa-file-image"></i>
          </div>
          <div className="stat-number">{stats?.totalAssets || 0}</div>
          <div className="stat-label">Total Assets</div>
        </div>
        
        <div className="stat-card graphs">
          <div className="stat-icon text-info">
            <i className="fas fa-project-diagram"></i>
          </div>
          <div className="stat-number">{stats?.totalGraphs || 0}</div>
          <div className="stat-label">Total Graphs</div>
        </div>
        
        <div className="stat-card reviews">
          <div className="stat-icon text-danger">
            <i className="fas fa-star"></i>
          </div>
          <div className="stat-number">{stats?.totalReviews || 0}</div>
          <div className="stat-label">Total Reviews</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon text-primary">
            <i className="fas fa-download"></i>
          </div>
          <div className="stat-number">{stats?.totalDownloads || 0}</div>
          <div className="stat-label">Total Downloads</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon text-secondary">
            <i className="fas fa-eye"></i>
          </div>
          <div className="stat-number">{stats?.totalViews || 0}</div>
          <div className="stat-label">Total Views</div>
        </div>
      </div>

      {/* Monetization Stats */}
      {monetizationStats && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-4 mt-5">
            <h4>Platform Monetization</h4>
            <small className="text-muted">Revenue Overview</small>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon text-success">
                <i className="fas fa-coins"></i>
              </div>
              <div className="stat-number">₹{monetizationStats.totalEarnings.toFixed(2)}</div>
              <div className="stat-label">Total Platform Earnings</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon text-warning">
                <i className="fas fa-clock"></i>
              </div>
              <div className="stat-number">₹{monetizationStats.pendingEarnings.toFixed(2)}</div>
              <div className="stat-label">Pending Payments</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon text-primary">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="stat-number">₹{monetizationStats.paidEarnings.toFixed(2)}</div>
              <div className="stat-label">Total Paid Out</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon text-info">
                <i className="fas fa-star"></i>
              </div>
              <div className="stat-number">{monetizationStats.premiumAssetsStats.totalPremiumAssets}</div>
              <div className="stat-label">Premium Assets</div>
            </div>
          </div>
        </>
      )}

      {/* Recent Activity */}
      <div className="recent-activity">
        <div className="row">
          <div className="col-md-4">
            <div className="activity-card">
              <div className="activity-header">
                <h5 className="activity-title">Recent Users</h5>
                <span className="status-dot live" title="Live Data"></span>
              </div>
              <ul className="activity-list">
                {recentActivity?.recentUsers?.map((user) => (
                  <li key={user._id} className="activity-item">
                    <div className="activity-info">
                      <div className="fw-semibold">{user.name}</div>
                      <div className="text-muted small">{user.email}</div>
                    </div>
                    <div className="activity-time">
                      {formatDate(user.createdAt)}
                    </div>
                  </li>
                ))}
                {(!recentActivity?.recentUsers || recentActivity.recentUsers.length === 0) && (
                  <li className="activity-item">
                    <div className="text-muted">No recent users</div>
                  </li>
                )}
              </ul>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="activity-card">
              <div className="activity-header">
                <h5 className="activity-title">Recent Assets</h5>
                <span className="status-dot live" title="Live Data"></span>
              </div>
              <ul className="activity-list">
                {recentActivity?.recentAssets?.map((asset) => (
                  <li key={asset._id} className="activity-item">
                    <div className="activity-info">
                      <div className="fw-semibold">{asset.title}</div>
                      <div className="text-muted small">
                        by {asset.creator?.name || 'Unknown'}
                      </div>
                    </div>
                    <div className="activity-time">
                      {formatDate(asset.createdAt)}
                    </div>
                  </li>
                ))}
                {(!recentActivity?.recentAssets || recentActivity.recentAssets.length === 0) && (
                  <li className="activity-item">
                    <div className="text-muted">No recent assets</div>
                  </li>
                )}
              </ul>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="activity-card">
              <div className="activity-header">
                <h5 className="activity-title">Recent Reviews</h5>
                <span className="status-dot live" title="Live Data"></span>
              </div>
              <ul className="activity-list">
                {recentActivity?.recentReviews?.map((review) => (
                  <li key={review._id} className="activity-item">
                    <div className="activity-info">
                      <div className="fw-semibold">
                        {review.reviewer?.name || 'Unknown'} rated{' '}
                        {review.creator?.name || 'Unknown'}
                      </div>
                      <div className="text-muted small">
                        {'★'.repeat(review.rating)} ({review.rating}/5)
                      </div>
                    </div>
                    <div className="activity-time">
                      {formatDate(review.createdAt)}
                    </div>
                  </li>
                ))}
                {(!recentActivity?.recentReviews || recentActivity.recentReviews.length === 0) && (
                  <li className="activity-item">
                    <div className="text-muted">No recent reviews</div>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview; 