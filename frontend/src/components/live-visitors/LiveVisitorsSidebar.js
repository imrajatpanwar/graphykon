import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import getApiConfig from '../../config/api';

const LiveVisitorsSidebar = () => {
  const { socket, isAdmin } = useAuth();
  const [visitorStats, setVisitorStats] = useState({
    totalVisitors: 0,
    loggedInCount: 0,
    anonymousCount: 0,
    loggedInVisitors: [],
    anonymousVisitors: []
  });
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const fetchInitialData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const apiConfig = getApiConfig();
      // Fetch current visitor stats
      const response = await axios.get(`${apiConfig.baseURL}/api/admin/visitors`, { headers });
      setVisitorStats(response.data);
    } catch (error) {
      console.error('Error fetching visitor data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin()) return;

    fetchInitialData();

    // Listen for real-time updates
    if (socket) {
      socket.on('visitor-stats', (stats) => {
        setVisitorStats(stats);
        setLoading(false);
      });

      return () => {
        socket.off('visitor-stats');
      };
    }
  }, [socket, isAdmin, fetchInitialData]);

  const formatDuration = (joinTime) => {
    const duration = Math.floor((new Date() - new Date(joinTime)) / 1000 / 60);
    if (duration < 1) return 'Just now';
    if (duration === 1) return '1 min';
    return `${duration} mins`;
  };

  if (!isAdmin()) return null;

  return (
    <div className={`live-visitors-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Collapse/Expand Button */}
      <button 
        className="sidebar-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        <i className={`fas fa-${isCollapsed ? 'chevron-left' : 'chevron-right'}`}></i>
      </button>

      {!isCollapsed && (
        <div className="sidebar-content">
          {/* Header */}
          <div className="sidebar-header">
            <h4 className="sidebar-title">
              <i className="fas fa-eye me-2"></i>
              Live Visitors
            </h4>
          </div>

          {loading ? (
            <div className="text-center p-3">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="sidebar-body">
              {/* Live Visitors Section */}
              <div className="section">
                <div className="section-header">
                  <h6 className="section-title">
                    <span className="status-dot live"></span>
                    Currently Online
                  </h6>
                  <span className="badge bg-success">{visitorStats.totalVisitors}</span>
                </div>
                
                <div className="live-stats">
                  <div className="stat-row">
                    <span className="stat-label">Logged In:</span>
                    <span className="stat-value text-success">{visitorStats.loggedInCount}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Anonymous:</span>
                    <span className="stat-value text-warning">{visitorStats.anonymousCount}</span>
                  </div>
                </div>

                {/* Live Visitors List */}
                {visitorStats.totalVisitors > 0 ? (
                  <div className="live-visitors-list">
                    {/* Logged-in Visitors */}
                    {visitorStats.loggedInVisitors.length > 0 && (
                      <>
                        <div className="visitor-section-title">
                          <i className="fas fa-user-check me-2 text-success"></i>
                          Logged In Users ({visitorStats.loggedInCount})
                        </div>
                        {visitorStats.loggedInVisitors.map((visitor, index) => (
                          <div key={index} className="visitor-item logged-in">
                            <div className="visitor-avatar">
                              <i className="fas fa-user-check"></i>
                            </div>
                            <div className="visitor-info">
                              <div className="visitor-name">{visitor.name}</div>
                              <div className="visitor-email">{visitor.email}</div>
                              <div className="visitor-details">
                                <small className="visitor-page">{visitor.currentPage}</small>
                                <small className="visitor-time">{formatDuration(visitor.joinTime)}</small>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Anonymous Visitors */}
                    {visitorStats.anonymousCount > 0 && (
                      <>
                        <div className="visitor-section-title">
                          <i className="fas fa-user me-2 text-warning"></i>
                          Anonymous Users ({visitorStats.anonymousCount})
                        </div>
                        {visitorStats.anonymousVisitors.slice(0, 5).map((visitor, index) => (
                          <div key={index} className="visitor-item anonymous">
                            <div className="visitor-avatar">
                              <i className="fas fa-user"></i>
                            </div>
                            <div className="visitor-info">
                              <div className="visitor-name">Anonymous #{visitor.socketId}</div>
                              <div className="visitor-details">
                                <small className="visitor-page">{visitor.currentPage}</small>
                                <small className="visitor-time">{formatDuration(visitor.joinTime)}</small>
                              </div>
                            </div>
                          </div>
                        ))}
                        {visitorStats.anonymousCount > 5 && (
                          <div className="more-visitors">
                            +{visitorStats.anonymousCount - 5} more anonymous visitors
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="no-visitors text-center text-muted py-4">
                    <i className="fas fa-users fa-3x mb-3 opacity-50"></i>
                    <p>No active visitors right now</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveVisitorsSidebar; 