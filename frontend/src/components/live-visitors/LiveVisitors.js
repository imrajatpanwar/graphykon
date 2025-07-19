import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import getApiConfig from '../../config/api';
import './LiveVisitors.css';

const LiveVisitors = () => {
  const { isAdmin, socket } = useAuth();
  const [visitorStats, setVisitorStats] = useState({
    totalVisitors: 0,
    loggedInCount: 0,
    anonymousCount: 0,
    loggedInVisitors: [],
    anonymousVisitors: []
  });
  const [advancedStats, setAdvancedStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin() || !socket) {
      console.log('LiveVisitors: Not admin or no socket', { isAdmin: isAdmin(), socket: !!socket });
      return;
    }

    console.log('LiveVisitors: Setting up socket listeners');

    // Fetch initial data
    fetchVisitorStats();
    fetchAdvancedStats();

    // Socket event listeners
    socket.on('visitor-update', (data) => {
      console.log('Received visitor update:', data);
      setVisitorStats(data);
    });

    socket.on('advanced-stats-update', (data) => {
      console.log('Received advanced stats update:', data);
      setAdvancedStats(data);
    });

    // Cleanup on unmount
    return () => {
      console.log('LiveVisitors: Cleaning up socket listeners');
      socket.off('visitor-update');
      socket.off('advanced-stats-update');
    };
  }, [isAdmin, socket]);

  const fetchVisitorStats = async () => {
    try {
      const apiConfig = getApiConfig();
      const token = localStorage.getItem('token');
      const response = await axios.get(`${apiConfig.baseURL}/api/admin/visitors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVisitorStats(response.data);
    } catch (error) {
      console.error('Error fetching visitor stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvancedStats = async () => {
    try {
      const apiConfig = getApiConfig();
      const token = localStorage.getItem('token');
      const response = await axios.get(`${apiConfig.baseURL}/api/admin/visitors/summary-advanced`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdvancedStats(response.data);
    } catch (error) {
      console.error('Error fetching advanced visitor stats:', error);
    }
  };

  const testBroadcast = async () => {
    try {
      const apiConfig = getApiConfig();
      const token = localStorage.getItem('token');
      await axios.post(`${apiConfig.baseURL}/api/admin/visitors/test-broadcast`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Test broadcast triggered');
    } catch (error) {
      console.error('Error testing broadcast:', error);
    }
  };

  const formatNumber = (n) => n?.toLocaleString() || 0;

  const formatDuration = (joinTime) => {
    const duration = Math.floor((new Date() - new Date(joinTime)) / 1000 / 60);
    if (duration < 1) return 'Just now';
    if (duration === 1) return '1 min';
    return `${duration} mins`;
  };

  if (!isAdmin()) return null;

  if (loading) {
    return (
      <div className="live-visitors-card">
        <div className="card-header">
          <h5 className="card-title">
            <i className="fas fa-users-online me-2 text-success"></i>
            Live Visitors
          </h5>
        </div>
        <div className="card-body">
          <div className="text-center">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="live-visitors-card">
      <div className="card-header">
        <h5 className="card-title">
          <i className="fas fa-eye me-2 text-success"></i>
          Live Visitors
          {advancedStats && (
            <span className="badge bg-success ms-2">{advancedStats.currentOnline}</span>
          )}
        </h5>
        <button 
          onClick={testBroadcast} 
          className="btn btn-sm btn-outline-primary"
          title="Test real-time updates"
        >
          <i className="fas fa-sync-alt"></i>
        </button>
      </div>
      <div className="card-body">


        {/* Advanced Stats Summary */}
        {advancedStats && (
          <div className="advanced-summary mb-4">
            <div className="row g-2">
              <div className="col-6 col-md-3">
                <div className="summary-item">
                  <div className="summary-label">All-Time</div>
                  <div className="summary-value">{formatNumber(advancedStats.totalAllTime)}</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="summary-item">
                  <div className="summary-label">Today</div>
                  <div className="summary-value">{formatNumber(advancedStats.totalToday)}</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="summary-item">
                  <div className="summary-label">This Week</div>
                  <div className="summary-value">{formatNumber(advancedStats.totalWeek)}</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="summary-item">
                  <div className="summary-label">This Month</div>
                  <div className="summary-value">{formatNumber(advancedStats.totalMonth)}</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="summary-item">
                  <div className="summary-label">Peak Online</div>
                  <div className="summary-value">{formatNumber(advancedStats.peakOnline)}</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="summary-item">
                  <div className="summary-label">Online Now</div>
                  <div className="summary-value">{formatNumber(advancedStats.currentOnline)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current Page Popularity */}
        {advancedStats && advancedStats.currentPages && advancedStats.currentPages.length > 0 && (
          <div className="mb-4">
            <div className="section-title mb-2">
              <i className="fas fa-chart-bar me-2 text-info"></i>
              Currently Viewing
            </div>
            <ul className="list-unstyled mb-0">
              {advancedStats.currentPages.map((p, idx) => (
                <li key={p.page} className="d-flex align-items-center mb-1">
                  <span className="badge bg-secondary me-2">{p.count}</span>
                  <span className="page-path text-monospace">{p.page}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Device/Browser Breakdown */}
        {advancedStats && (
          <div className="row g-2 mb-4">
            <div className="col-6">
              <div className="section-title mb-1">
                <i className="fas fa-desktop me-2 text-primary"></i>
                Devices
              </div>
              <ul className="list-unstyled mb-0">
                {Object.entries(advancedStats.deviceCounts).map(([device, count]) => (
                  <li key={device} className="d-flex align-items-center mb-1">
                    <span className="badge bg-light text-dark me-2">{count}</span>
                    <span>{device}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-6">
              <div className="section-title mb-1">
                <i className="fas fa-globe me-2 text-warning"></i>
                Browsers
              </div>
              <ul className="list-unstyled mb-0">
                {Object.entries(advancedStats.browserCounts).map(([browser, count]) => (
                  <li key={browser} className="d-flex align-items-center mb-1">
                    <span className="badge bg-light text-dark me-2">{count}</span>
                    <span>{browser}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Existing Live Visitors List (slim) */}
        <div className="visitor-section-title mt-3 mb-2">
          <i className="fas fa-user-check me-2 text-success"></i>
          Logged In Users ({visitorStats.loggedInCount})
        </div>
        <div className="live-visitors-list">
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
        </div>

        {/* Anonymous Users */}
        {visitorStats.anonymousCount > 0 && (
          <div className="visitor-section">
            <h6 className="section-title">
              <i className="fas fa-user me-2 text-warning"></i>
              Anonymous Users ({visitorStats.anonymousCount})
            </h6>
            <div className="visitor-list">
              {visitorStats.anonymousVisitors.map((visitor, index) => (
                <div key={index} className="visitor-item anonymous">
                  <div className="visitor-info">
                    <div className="visitor-name">Anonymous #{visitor.socketId}</div>
                    <div className="visitor-details">
                      <span className="visitor-page">{visitor.currentPage}</span>
                      <span className="visitor-time">
                        Active for {formatDuration(visitor.joinTime)}
                      </span>
                    </div>
                  </div>
                  <div className="visitor-status">
                    <span className="status-indicator online"></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Visitors */}
        {visitorStats.totalVisitors === 0 && (
          <div className="no-visitors text-center text-muted py-4">
            <i className="fas fa-users fa-3x mb-3 opacity-50"></i>
            <p>No active visitors right now</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveVisitors; 