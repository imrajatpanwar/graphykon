import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import getApiConfig from '../../config/api';

const AdminMonetization = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    monthlyEarnings: [],
    topEarningCreators: [],
    premiumAssetsStats: {
      totalPremiumAssets: 0,
      totalDownloads: 0,
      totalEarnings: 0
    }
  });
  const [earnings, setEarnings] = useState([]);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [creatorsLoading, setCreatorsLoading] = useState(false);
  const [creators, setCreators] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [updateLoading, setUpdateLoading] = useState({});
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchOverview();
    if (activeTab === 'earnings') {
      fetchEarnings();
    } else if (activeTab === 'creators') {
      fetchCreators();
    }
  }, [activeTab, filterStatus, currentPage, fetchEarnings, fetchCreators]);

  const fetchOverview = async () => {
    setLoading(true);
    setError('');
    try {
      const apiConfig = getApiConfig();
      const response = await axios.get(`${apiConfig.baseURL}/api/monetization/admin/overview`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setOverview(response.data);
    } catch (err) {
      setError('Failed to load monetization overview');
      console.error('Failed to load monetization overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEarnings = useCallback(async () => {
    setEarningsLoading(true);
    try {
      const apiConfig = getApiConfig();
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', '20');
      if (filterStatus) params.append('status', filterStatus);

      const response = await axios.get(`${apiConfig.baseURL}/api/monetization/admin/earnings?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setEarnings(response.data.earnings);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      console.error('Failed to load earnings:', err);
    } finally {
      setEarningsLoading(false);
    }
  }, [currentPage, filterStatus]);

  const fetchCreators = useCallback(async () => {
    setCreatorsLoading(true);
    try {
      const apiConfig = getApiConfig();
      const response = await axios.get(`${apiConfig.baseURL}/api/monetization/admin/creators-summary`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setCreators(response.data);
      } catch (err) {
        console.error('Failed to load creators:', err);
      } finally {
        setCreatorsLoading(false);
      }
    }, []);

  const updateEarningStatus = async (earningId, status, notes = '', transactionId = '') => {
    setUpdateLoading(prev => ({ ...prev, [earningId]: true }));
    try {
      const apiConfig = getApiConfig();
      const response = await axios.put(
        `${apiConfig.baseURL}/api/monetization/admin/earnings/${earningId}`,
        { status, notes, transactionId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Update local state
      setEarnings(prev => prev.map(earning => 
        earning._id === earningId ? response.data : earning
      ));
      
      // Refresh overview to update totals
      fetchOverview();
    } catch (err) {
      console.error('Failed to update earning status:', err);
      alert('Failed to update earning status');
    } finally {
      setUpdateLoading(prev => ({ ...prev, [earningId]: false }));
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'paid': return 'badge-success';
      case 'cancelled': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="admin-monetization">
      <div className="admin-header-actions">
        <h3>
          <i className="fas fa-dollar-sign me-2"></i>
          Monetization Management
        </h3>
        <p className="text-muted">Manage creator earnings and payments</p>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <ul className="nav nav-tabs">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <i className="fas fa-chart-bar me-2"></i>
              Overview
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'earnings' ? 'active' : ''}`}
              onClick={() => setActiveTab('earnings')}
            >
              <i className="fas fa-money-check-alt me-2"></i>
              Earnings Management
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'creators' ? 'active' : ''}`}
              onClick={() => setActiveTab('creators')}
            >
              <i className="fas fa-users me-2"></i>
              Creator Summary
            </button>
          </li>
        </ul>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          {/* Stats Cards */}
          <div className="row stats-cards">
            <div className="col-lg-3 col-md-6 mb-4">
              <div className="stat-card">
                <div className="stat-icon bg-success">
                  <i className="fas fa-coins"></i>
                </div>
                <div className="stat-details">
                  <div className="stat-number">₹{overview.totalEarnings.toFixed(2)}</div>
                  <div className="stat-label">Total Platform Earnings</div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 mb-4">
              <div className="stat-card">
                <div className="stat-icon bg-warning">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="stat-details">
                  <div className="stat-number">₹{overview.pendingEarnings.toFixed(2)}</div>
                  <div className="stat-label">Pending Payments</div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 mb-4">
              <div className="stat-card">
                <div className="stat-icon bg-primary">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="stat-details">
                  <div className="stat-number">₹{overview.paidEarnings.toFixed(2)}</div>
                  <div className="stat-label">Paid Out</div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 mb-4">
              <div className="stat-card">
                <div className="stat-icon bg-info">
                  <i className="fas fa-star"></i>
                </div>
                <div className="stat-details">
                  <div className="stat-number">{overview.premiumAssetsStats.totalPremiumAssets}</div>
                  <div className="stat-label">Premium Assets</div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Earning Creators */}
          <div className="admin-section">
            <div className="section-header">
              <h5>
                <i className="fas fa-trophy me-2"></i>
                Top Earning Creators
              </h5>
            </div>
            <div className="table-responsive">
              <table className="table table-striped admin-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Creator</th>
                    <th>Username</th>
                    <th>Total Earnings</th>
                    <th>Downloads</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.topEarningCreators.map((creator, index) => (
                    <tr key={creator.creatorId}>
                      <td>
                        <span className={`badge ${index < 3 ? 'badge-warning' : 'badge-secondary'}`}>
                          #{index + 1}
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold">{creator.name || 'Unknown'}</div>
                      </td>
                      <td>
                        <span className="text-muted">@{creator.username || 'N/A'}</span>
                      </td>
                      <td>
                        <span className="text-success fw-semibold">₹{creator.totalEarnings.toFixed(2)}</span>
                      </td>
                      <td>
                        <span className="badge badge-info">{creator.earningsCount}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Earnings Management Tab */}
      {activeTab === 'earnings' && (
        <div className="tab-content">
          {/* Filters */}
          <div className="admin-filters mb-4">
            <div className="row">
              <div className="col-md-3">
                <label htmlFor="statusFilter" className="form-label">Filter by Status</label>
                <select
                  id="statusFilter"
                  className="form-select"
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Earnings Table */}
          {earningsLoading ? (
            <div className="loading-spinner">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-striped admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Creator</th>
                      <th>Asset</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Transaction ID</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.map((earning) => (
                      <tr key={earning._id}>
                        <td>
                          <small>{formatDate(earning.downloadDate)}</small>
                        </td>
                        <td>
                          <div>
                            <div className="fw-semibold">{earning.creator?.displayName || earning.creator?.name || 'Unknown'}</div>
                            <small className="text-muted">{earning.creator?.email}</small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="fw-semibold">{earning.asset?.title || 'Unknown Asset'}</div>
                            <small className="text-muted">{earning.asset?.license}</small>
                          </div>
                        </td>
                        <td>
                          <span className="text-success fw-semibold">₹{earning.amount.toFixed(2)}</span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(earning.status)}`}>
                            {earning.status}
                          </span>
                        </td>
                        <td>
                          <small className="text-muted">{earning.transactionId || '-'}</small>
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            {earning.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-success"
                                  onClick={() => {
                                    const transactionId = prompt('Enter transaction ID (optional):');
                                    updateEarningStatus(earning._id, 'paid', 'Paid by admin', transactionId || '');
                                  }}
                                  disabled={updateLoading[earning._id]}
                                >
                                  {updateLoading[earning._id] ? (
                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                  ) : (
                                    <>
                                      <i className="fas fa-check me-1"></i>
                                      Mark Paid
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  onClick={() => {
                                    const reason = prompt('Enter cancellation reason:');
                                    if (reason) {
                                      updateEarningStatus(earning._id, 'cancelled', reason);
                                    }
                                  }}
                                  disabled={updateLoading[earning._id]}
                                >
                                  <i className="fas fa-times me-1"></i>
                                  Cancel
                                </button>
                              </>
                            )}
                            {earning.status === 'paid' && (
                              <span className="text-muted small">
                                Paid on {earning.paymentDate ? formatDate(earning.paymentDate) : 'N/A'}
                              </span>
                            )}
                            {earning.status === 'cancelled' && (
                              <span className="text-muted small">Cancelled</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav>
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    {[...Array(totalPages)].map((_, index) => (
                      <li key={index + 1} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(index + 1)}
                        >
                          {index + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      )}

      {/* Creator Summary Tab */}
      {activeTab === 'creators' && (
        <div className="tab-content">
          {creatorsLoading ? (
            <div className="loading-spinner">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped admin-table">
                <thead>
                  <tr>
                    <th>Creator</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Premium Assets</th>
                    <th>Total Earnings</th>
                    <th>Pending</th>
                    <th>Paid</th>
                    <th>Downloads</th>
                  </tr>
                </thead>
                <tbody>
                  {creators.map((creator) => (
                    <tr key={creator.creatorId}>
                      <td>
                        <div className="fw-semibold">{creator.name || 'Unknown'}</div>
                      </td>
                      <td>
                        <span className="text-muted">@{creator.username || 'N/A'}</span>
                      </td>
                      <td>
                        <small className="text-muted">{creator.email}</small>
                      </td>
                      <td>
                        <span className="badge badge-info">{creator.premiumAssetsCount}</span>
                      </td>
                      <td>
                        <span className="text-success fw-semibold">₹{creator.totalEarnings.toFixed(2)}</span>
                      </td>
                      <td>
                        <span className="text-warning">₹{creator.pendingEarnings.toFixed(2)}</span>
                      </td>
                      <td>
                        <span className="text-success">₹{creator.paidEarnings.toFixed(2)}</span>
                      </td>
                      <td>
                        <span className="badge badge-secondary">{creator.earningsCount}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminMonetization; 