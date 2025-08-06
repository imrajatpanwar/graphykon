import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import './SkeletonLoader.css';

const SkeletonLoader = ({ type = 'default', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'table-row':
        return (
          <div className="skeleton-table-row">
            <div className="skeleton-checkbox">
              <Skeleton width={16} height={16} />
            </div>
            <div className="skeleton-asset">
              <div className="skeleton-thumbnail">
                <Skeleton width={60} height={60} />
              </div>
              <div className="skeleton-content">
                <Skeleton width="80%" height={16} />
                <Skeleton width="60%" height={12} />
                <div className="skeleton-stats">
                  <Skeleton width={60} height={12} />
                  <Skeleton width={60} height={12} />
                </div>
              </div>
            </div>
            <div className="skeleton-cell">
              <Skeleton width="80%" height={16} />
            </div>
            <div className="skeleton-cell">
              <Skeleton width="80%" height={16} />
            </div>
            <div className="skeleton-cell">
              <Skeleton width="80%" height={16} />
            </div>
            <div className="skeleton-cell">
              <Skeleton width="80%" height={16} />
            </div>
            <div className="skeleton-cell">
              <Skeleton width="80%" height={16} />
            </div>
          </div>
        );
      
      case 'card':
        return (
          <div className="skeleton-card">
            <Skeleton width="60%" height={24} style={{ marginBottom: '1rem' }} />
            <div className="skeleton-card-content">
              <Skeleton height={16} />
              <Skeleton height={16} />
              <Skeleton width="40%" height={16} />
            </div>
          </div>
        );
      
      case 'overview':
        return (
          <div className="skeleton-overview">
            <div className="skeleton-icon">
              <Skeleton width={60} height={60} />
            </div>
            <div className="skeleton-overview-content">
              <Skeleton width="40%" height={14} />
              <Skeleton width="60%" height={32} />
              <Skeleton width="30%" height={12} />
            </div>
          </div>
        );
      
      case 'chart':
        return (
          <div className="skeleton-chart">
            <Skeleton width="50%" height={24} style={{ marginBottom: '2rem' }} />
            <div className="skeleton-chart-content">
              <Skeleton height="60%" />
              <Skeleton height="80%" />
              <Skeleton height="40%" />
              <Skeleton height="90%" />
              <Skeleton height="70%" />
              <Skeleton height="50%" />
            </div>
          </div>
        );

      case 'studio-dashboard':
        return (
          <div className="skeleton-studio-dashboard">
            {/* Header */}
            <div className="skeleton-header">
              <Skeleton width="200px" height={32} />
              <Skeleton width="120px" height={40} />
            </div>
            
            {/* Dashboard Layout */}
            <div className="skeleton-dashboard-layout">
              {/* Left Sidebar */}
              <div className="skeleton-left-sidebar">
                {/* Analytics Card */}
                <div className="skeleton-analytics-card">
                  <Skeleton width="150px" height={24} style={{ marginBottom: '1rem' }} />
                  <div className="skeleton-followers">
                    <Skeleton width="120px" height={16} />
                    <Skeleton width="60px" height={24} />
                  </div>
                  <Skeleton width="100px" height={14} style={{ marginTop: '1rem', marginBottom: '1rem' }} />
                  <div className="skeleton-metrics">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="skeleton-metric">
                        <Skeleton width="80px" height={12} />
                        <Skeleton width="40px" height={16} />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Help Card */}
                <div className="skeleton-help-card">
                  <Skeleton width="140px" height={20} style={{ marginBottom: '1rem' }} />
                  <Skeleton width="100%" height={14} style={{ marginBottom: '0.5rem' }} />
                  <Skeleton width="80%" height={14} style={{ marginBottom: '1rem' }} />
                  <Skeleton width={48} height={48} />
                </div>
              </div>
              
              {/* Main Content */}
              <div className="skeleton-main-content">
                {/* Growth Card */}
                <div className="skeleton-growth-card">
                  <Skeleton width="150px" height={24} style={{ marginBottom: '0.5rem' }} />
                  <Skeleton width="200px" height={16} style={{ marginBottom: '2rem' }} />
                  <div className="skeleton-chart-area">
                    <Skeleton height={200} />
                  </div>
                </div>
                
                {/* Two Column Layout */}
                <div className="skeleton-two-column">
                  {/* Trending Section */}
                  <div className="skeleton-trending">
                    <Skeleton width="180px" height={20} style={{ marginBottom: '0.5rem' }} />
                    <Skeleton width="140px" height={14} style={{ marginBottom: '1rem' }} />
                    <div className="skeleton-trending-items">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="skeleton-trending-item">
                          <Skeleton width="100%" height={16} />
                        </div>
                      ))}
                    </div>
                    <div className="skeleton-fade-effect">
                      <Skeleton height={100} />
                    </div>
                    <Skeleton width="120px" height={40} style={{ marginTop: '1rem' }} />
                  </div>
                  
                  {/* Project Section */}
                  <div className="skeleton-project">
                    <Skeleton width="100%" height={200} style={{ marginBottom: '1rem' }} />
                    <Skeleton width="80%" height={20} style={{ marginBottom: '0.5rem' }} />
                    <Skeleton width="60%" height={14} style={{ marginBottom: '1rem' }} />
                    <Skeleton width="100px" height={40} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'studio-sidebar':
        return (
          <div className="skeleton-studio-sidebar">
            {/* Analytics Card */}
            <div className="skeleton-analytics-card">
              <Skeleton width="150px" height={24} style={{ marginBottom: '1rem' }} />
              <div className="skeleton-followers">
                <Skeleton width="120px" height={16} />
                <Skeleton width="60px" height={24} />
              </div>
              <Skeleton width="100px" height={14} style={{ marginTop: '1rem', marginBottom: '1rem' }} />
              <div className="skeleton-metrics">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="skeleton-metric">
                    <Skeleton width="80px" height={12} />
                    <Skeleton width="40px" height={16} />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Help Card */}
            <div className="skeleton-help-card">
              <Skeleton width="140px" height={20} style={{ marginBottom: '1rem' }} />
              <Skeleton width="100%" height={14} style={{ marginBottom: '0.5rem' }} />
              <Skeleton width="80%" height={14} style={{ marginBottom: '1rem' }} />
              <Skeleton width={48} height={48} />
            </div>
          </div>
        );

      case 'studio-main':
        return (
          <div className="skeleton-studio-main">
            {/* Growth Card */}
            <div className="skeleton-growth-card">
              <Skeleton width="150px" height={24} style={{ marginBottom: '0.5rem' }} />
              <Skeleton width="200px" height={16} style={{ marginBottom: '2rem' }} />
              <div className="skeleton-chart-area">
                <Skeleton height={200} />
              </div>
            </div>
            
            {/* Two Column Layout */}
            <div className="skeleton-two-column">
              {/* Trending Section */}
              <div className="skeleton-trending">
                <Skeleton width="180px" height={20} style={{ marginBottom: '0.5rem' }} />
                <Skeleton width="140px" height={14} style={{ marginBottom: '1rem' }} />
                <div className="skeleton-trending-items">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="skeleton-trending-item">
                      <Skeleton width="100%" height={16} />
                    </div>
                  ))}
                </div>
                <div className="skeleton-fade-effect">
                  <Skeleton height={100} />
                </div>
                <Skeleton width="120px" height={40} style={{ marginTop: '1rem' }} />
              </div>
              
              {/* Project Section */}
              <div className="skeleton-project">
                <Skeleton width="100%" height={200} style={{ marginBottom: '1rem' }} />
                <Skeleton width="80%" height={20} style={{ marginBottom: '0.5rem' }} />
                <Skeleton width="60%" height={14} style={{ marginBottom: '1rem' }} />
                <Skeleton width="100px" height={40} />
              </div>
            </div>
          </div>
        );

      case 'assets-page':
        return (
          <div className="skeleton-assets-page">
            {/* Table Header */}
            <div className="skeleton-table-header">
              <div className="skeleton-table-row skeleton-header-row">
                <div className="skeleton-checkbox">
                  <Skeleton width={16} height={16} />
                </div>
                <div className="skeleton-header-cell">
                  <Skeleton width="60px" height={16} />
                </div>
                <div className="skeleton-header-cell">
                  <Skeleton width="40px" height={16} />
                </div>
                <div className="skeleton-header-cell">
                  <Skeleton width="70px" height={16} />
                </div>
                <div className="skeleton-header-cell">
                  <Skeleton width="90px" height={16} />
                </div>
                <div className="skeleton-header-cell">
                  <Skeleton width="80px" height={16} />
                </div>
                <div className="skeleton-header-cell">
                  <Skeleton width="80px" height={16} />
                </div>
              </div>
            </div>
            
            {/* Table Body */}
            <div className="skeleton-table-body">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="skeleton-table-row skeleton-asset-row">
                  <div className="skeleton-checkbox">
                    <Skeleton width={16} height={16} />
                  </div>
                  <div className="skeleton-asset-cell">
                    <div className="skeleton-asset-thumbnail">
                      <Skeleton width={60} height={60} style={{ borderRadius: '8px' }} />
                    </div>
                    <div className="skeleton-asset-details">
                      <Skeleton width="150px" height={16} style={{ marginBottom: '4px' }} />
                      <Skeleton width="200px" height={12} style={{ marginBottom: '8px' }} />
                      <div className="skeleton-asset-stats">
                        <Skeleton width="60px" height={12} />
                        <Skeleton width="60px" height={12} />
                      </div>
                    </div>
                  </div>
                  <div className="skeleton-cell">
                    <Skeleton width="80px" height={16} />
                  </div>
                  <div className="skeleton-cell">
                    <Skeleton width="60px" height={16} />
                  </div>
                  <div className="skeleton-cell">
                    <Skeleton width="70px" height={16} />
                  </div>
                  <div className="skeleton-cell">
                    <Skeleton width="50px" height={16} />
                  </div>
                  <div className="skeleton-cell">
                    <Skeleton width="60px" height={16} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'analytics-page':
        return (
          <div className="skeleton-analytics-page">
            {/* Header */}
            <div className="skeleton-analytics-header">
              <Skeleton width="120px" height={32} />
              <Skeleton width="150px" height={40} />
            </div>
            
            {/* Overview Cards */}
            <div className="skeleton-analytics-overview">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton-overview-card">
                  <div className="skeleton-card-icon">
                    <Skeleton width={48} height={48} />
                  </div>
                  <div className="skeleton-card-content">
                    <Skeleton width="80px" height={14} />
                    <Skeleton width="60px" height={28} />
                    <Skeleton width="50px" height={12} />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Charts Section */}
            <div className="skeleton-analytics-charts">
              <div className="skeleton-main-chart">
                <Skeleton width="200px" height={24} style={{ marginBottom: '1rem' }} />
                <Skeleton height={300} />
              </div>
              <div className="skeleton-side-charts">
                <div className="skeleton-chart-card">
                  <Skeleton width="150px" height={20} style={{ marginBottom: '1rem' }} />
                  <Skeleton height={200} />
                </div>
                <div className="skeleton-chart-card">
                  <Skeleton width="120px" height={20} style={{ marginBottom: '1rem' }} />
                  <Skeleton height={200} />
                </div>
              </div>
            </div>
            
            {/* Details Section */}
            <div className="skeleton-analytics-details">
              <div className="skeleton-detail-card">
                <Skeleton width="140px" height={20} style={{ marginBottom: '1rem' }} />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton-detail-item">
                    <Skeleton width={40} height={40} />
                    <div className="skeleton-detail-content">
                      <Skeleton width="120px" height={16} />
                      <Skeleton width="80px" height={14} />
                    </div>
                    <Skeleton width="60px" height={16} />
                  </div>
                ))}
              </div>
              <div className="skeleton-detail-card">
                <Skeleton width="100px" height={20} style={{ marginBottom: '1rem' }} />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton-detail-item">
                    <Skeleton width="100px" height={16} />
                    <Skeleton width="50px" height={14} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'settings-page':
        return (
          <div className="skeleton-settings-page">
            {/* Header */}
            <div className="skeleton-settings-header">
              <Skeleton width="150px" height={32} />
            </div>
            
            {/* Settings Content */}
            <div className="skeleton-settings-content">
              {/* Profile Section */}
              <div className="skeleton-settings-section">
                <Skeleton width="120px" height={24} style={{ marginBottom: '1.5rem' }} />
                <div className="skeleton-profile-section">
                  <div className="skeleton-avatar-section">
                    <Skeleton width={100} height={100} style={{ borderRadius: '50%' }} />
                    <Skeleton width="100px" height={16} style={{ marginTop: '0.5rem' }} />
                  </div>
                  <div className="skeleton-profile-form">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="skeleton-form-group">
                        <Skeleton width="100px" height={16} style={{ marginBottom: '0.5rem' }} />
                        <Skeleton width="100%" height={40} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Account Section */}
              <div className="skeleton-settings-section">
                <Skeleton width="140px" height={24} style={{ marginBottom: '1.5rem' }} />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-form-group">
                    <Skeleton width="120px" height={16} style={{ marginBottom: '0.5rem' }} />
                    <Skeleton width="100%" height={40} />
                  </div>
                ))}
              </div>
              
              {/* Privacy Section */}
              <div className="skeleton-settings-section">
                <Skeleton width="100px" height={24} style={{ marginBottom: '1.5rem' }} />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton-toggle-item">
                    <div className="skeleton-toggle-content">
                      <Skeleton width="150px" height={16} />
                      <Skeleton width="200px" height={14} style={{ marginTop: '0.25rem' }} />
                    </div>
                    <Skeleton width={44} height={24} style={{ borderRadius: '12px' }} />
                  </div>
                ))}
              </div>
              
              {/* Save Button */}
              <div className="skeleton-save-section">
                <Skeleton width="120px" height={44} />
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="skeleton-default">
            <Skeleton height={16} />
            <Skeleton height={16} />
            <Skeleton width="40%" height={16} />
          </div>
        );
    }
  };

  if (count > 1) {
    return (
      <div className="skeleton-container">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="skeleton-item">
            {renderSkeleton()}
          </div>
        ))}
      </div>
    );
  }

  return renderSkeleton();
};

export default SkeletonLoader; 