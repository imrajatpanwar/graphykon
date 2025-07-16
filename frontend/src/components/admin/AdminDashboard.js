import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminUsers from './AdminUsers';
import AdminCreators from './AdminCreators';
import AdminAssets from './AdminAssets';
import AdminGraphs from './AdminGraphs';
import AdminReviews from './AdminReviews';
import AdminOverview from './AdminOverview';
import AdminCopyrightAppeals from './AdminCopyrightAppeals';
import LiveVisitors from '../live-visitors/LiveVisitors';
import AdminMonetization from './AdminMonetization';
import AdminPricing from './AdminPricing';
import AdminMessages from './AdminMessages';
import AdminTrending from './AdminTrending';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/');
    }
  }, [user, isAdmin, navigate]);

  if (!user || !isAdmin()) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          Access denied. Admin privileges required.
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview />;
      case 'users':
        return <AdminUsers />;
      case 'creators':
        return <AdminCreators />;
      case 'assets':
        return <AdminAssets />;
      case 'graphs':
        return <AdminGraphs />;
      case 'reviews':
        return <AdminReviews />;
      case 'messages':
        return <AdminMessages />;
      case 'copyright-appeals':
        return <AdminCopyrightAppeals />;
      case 'monetization':
        return <AdminMonetization />;
      case 'pricing':
        return <AdminPricing />;

      case 'live-visitors':
        return <LiveVisitors />;
      case 'trending':
        return <AdminTrending />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <h2 className="admin-title">
                <i className="fas fa-cog me-2"></i>
                Admin Dashboard
              </h2>
              <p className="admin-subtitle">Manage your Graphykon platform</p>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-container">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-3 col-lg-2">
              <div className="admin-sidebar">
                <nav className="nav flex-column">
                  <button
                    className={`nav-link admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    <i className="fas fa-tachometer-alt me-2"></i>
                    Overview
                  </button>
                  <button
                    className={`nav-link admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                  >
                    <i className="fas fa-users me-2"></i>
                    Users
                  </button>
                  <button
                    className={`nav-link admin-nav-item ${activeTab === 'creators' ? 'active' : ''}`}
                    onClick={() => setActiveTab('creators')}
                  >
                    <i className="fas fa-user-tie me-2"></i>
                    Creators
                  </button>
                  <button
                    className={`nav-link admin-nav-item ${activeTab === 'assets' ? 'active' : ''}`}
                    onClick={() => setActiveTab('assets')}
                  >
                    <i className="fas fa-file-image me-2"></i>
                    Assets
                  </button>
                  <button
                    className={`nav-link admin-nav-item ${activeTab === 'graphs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('graphs')}
                  >
                    <i className="fas fa-project-diagram me-2"></i>
                    Graphs
                  </button>
                  <button
                    className={`nav-link admin-nav-item ${activeTab === 'reviews' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reviews')}
                  >
                    <i className="fas fa-star me-2"></i>
                    Reviews
                  </button>
                  <button
                    className={`nav-link admin-nav-item ${activeTab === 'messages' ? 'active' : ''}`}
                    onClick={() => setActiveTab('messages')}
                  >
                    <i className="fas fa-comments me-2"></i>
                    Messages
                  </button>
                  <button
                    className={`nav-link admin-nav-item ${activeTab === 'copyright-appeals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('copyright-appeals')}
                  >
                    <i className="fas fa-gavel me-2"></i>
                    Copyright Appeals
                  </button>
                  <button
                    className={`nav-link admin-nav-item ${activeTab === 'monetization' ? 'active' : ''}`}
                    onClick={() => setActiveTab('monetization')}
                  >
                    <i className="fas fa-dollar-sign me-2"></i>
                    Monetization
                  </button>
                  <button
                    className={`nav-link admin-nav-item ${activeTab === 'pricing' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pricing')}
                  >
                    <i className="fas fa-tags me-2"></i>
                    Pricing Plans
                  </button>

                  <button
                    className={`nav-link admin-nav-item ${activeTab === 'live-visitors' ? 'active' : ''}`}
                    onClick={() => setActiveTab('live-visitors')}
                  >
                    <i className="fas fa-eye me-2"></i>
                    Live Visitors
                  </button>
                  <button
                    className={`nav-link admin-nav-item ${activeTab === 'trending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('trending')}
                  >
                    <i className="fas fa-fire me-2"></i>
                    Trending
                  </button>
                </nav>
              </div>
            </div>
            <div className="col-md-9 col-lg-10">
              <div className="admin-content">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 