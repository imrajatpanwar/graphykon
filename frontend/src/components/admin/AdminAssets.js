import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import useAdminRealTime from '../../hooks/useAdminRealTime';

const AdminAssets = () => {
  // Remove destructuring, just call useAuth for possible side effects
  useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    license: '',
    limit: 10
  });
  const [showCopyrightModal, setShowCopyrightModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [copyrightReason, setCopyrightReason] = useState('');
  const [copyrightLoading, setCopyrightLoading] = useState(false);

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: filters.limit,
        search: filters.search,
        category: filters.category,
        license: filters.license
      });

      const response = await axios.get(`/api/admin/assets?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAssets(response.data.assets);
      setTotalPages(response.data.totalPages);
      setLastUpdated(new Date());
    } catch (error) {
      setError('Failed to fetch assets');
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  // Real-time update handler for assets
  const handleRealTimeUpdate = useCallback((updateData) => {
    console.log('Assets real-time update:', updateData);
    
    if (updateData.action === 'deleted') {
      setAssets(prevAssets => prevAssets.filter(asset => asset._id !== updateData.data._id));
      setSuccess(`Asset "${updateData.data.title}" was deleted by another admin`);
      setLastUpdated(new Date());
    } else {
      fetchAssets();
    }
  }, [fetchAssets]);

  const { broadcastUpdate } = useAdminRealTime('assets', handleRealTimeUpdate);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleDeleteAsset = async (assetId, assetTitle) => {
    if (window.confirm(`Are you sure you want to delete asset "${assetTitle}"? This action cannot be undone.`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/admin/assets/${assetId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Asset deleted successfully');
        
        // Broadcast real-time update to other admins
        broadcastUpdate('deleted', { _id: assetId, title: assetTitle });
        
        fetchAssets();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete asset');
        console.error('Error deleting asset:', error);
      }
    }
  };

  const handleCopyrightStrike = async (asset) => {
    setSelectedAsset(asset);
    setCopyrightReason('');
    setShowCopyrightModal(true);
  };

  const handleCopyrightStrikeSubmit = async () => {
    if (!copyrightReason.trim()) {
      setError('Please provide a reason for the copyright strike');
      return;
    }

    try {
      setCopyrightLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(`/api/admin/assets/${selectedAsset._id}/copyright-strike`, {
        reason: copyrightReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Copyright strike applied successfully');
      setShowCopyrightModal(false);
      setSelectedAsset(null);
      setCopyrightReason('');
      
      // Broadcast real-time update to other admins
      broadcastUpdate('copyright-strike', { _id: selectedAsset._id, title: selectedAsset.title, reason: copyrightReason });
      
      fetchAssets();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to apply copyright strike');
      console.error('Error applying copyright strike:', error);
    } finally {
      setCopyrightLoading(false);
    }
  };

  const handleRemoveCopyrightStrike = async (assetId, assetTitle) => {
    if (window.confirm(`Are you sure you want to remove the copyright strike from "${assetTitle}"?`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/admin/assets/${assetId}/copyright-strike`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Copyright strike removed successfully');
        
        // Broadcast real-time update to other admins
        broadcastUpdate('copyright-strike-removed', { _id: assetId, title: assetTitle });
        
        fetchAssets();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to remove copyright strike');
        console.error('Error removing copyright strike:', error);
      }
    }
  };

  const getCategoryBadgeClass = (category) => {
    const categoryClasses = {
      'Motion Graphics': 'bg-primary',
      'Web Design': 'bg-info',
      'Logo Design': 'bg-warning',
      'Print Design': 'bg-success',
      'Photography': 'bg-secondary',
      'Illustration': 'bg-danger',
      'UI/UX': 'bg-dark',
      'Branding': 'bg-info'
    };
    return categoryClasses[category] || 'bg-secondary';
  };

  const getLicenseBadgeClass = (license) => {
    return license === 'Free' ? 'bg-success' : 'bg-warning';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text, maxLength = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const formatLastUpdated = () => {
    const now = new Date();
    const diff = Math.floor((now - lastUpdated) / 1000);
    
    if (diff < 10) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return new Date(lastUpdated).toLocaleTimeString();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Asset Management</h3>
        <div className="live-indicator">
          <span className="status-dot live"></span>
          <small className="text-muted ms-2">
            Last updated: {formatLastUpdated()}
          </small>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button 
            className="btn-close float-end" 
            onClick={() => setError(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
          <button 
            className="btn-close float-end" 
            onClick={() => setSuccess(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="search-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by title, description, or keywords..."
            />
          </div>
          <div className="filter-group">
            <label>Category</label>
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All Categories</option>
              <option value="Motion Graphics">Motion Graphics</option>
              <option value="Web Design">Web Design</option>
              <option value="Logo Design">Logo Design</option>
              <option value="Print Design">Print Design</option>
              <option value="Photography">Photography</option>
              <option value="Illustration">Illustration</option>
              <option value="UI/UX">UI/UX</option>
              <option value="Branding">Branding</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="filter-group">
            <label>License</label>
            <select name="license" value={filters.license} onChange={handleFilterChange}>
              <option value="">All Licenses</option>
              <option value="Free">Free</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Per Page</label>
            <select name="limit" value={filters.limit} onChange={handleFilterChange}>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      {loading ? (
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
                  <th>Title</th>
                  <th>Creator</th>
                  <th>Category</th>
                  <th>License</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>Downloads</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset._id}>
                    <td>
                      <div>
                        <div className="fw-semibold">{truncateText(asset.title, 30)}</div>
                        <div className="text-muted small">{truncateText(asset.description, 40)}</div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="fw-semibold">{asset.creator?.name || 'Unknown'}</div>
                        <div className="text-muted small">{asset.creator?.email}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-role ${getCategoryBadgeClass(asset.category)}`}>
                        {asset.category}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-status ${getLicenseBadgeClass(asset.license)}`}>
                        {asset.license}
                      </span>
                    </td>
                    <td>
                      {asset.copyrightStrike?.isStruck ? (
                        <span className="badge badge-danger">
                          <i className="fas fa-ban me-1"></i>
                          Copyright Strike
                        </span>
                      ) : (
                        <span className="badge badge-success">
                          <i className="fas fa-check me-1"></i>
                          Active
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="text-primary fw-semibold">
                        <i className="fas fa-eye me-1"></i>
                        {asset.viewCount || 0}
                      </span>
                    </td>
                    <td>
                      <span className="text-success fw-semibold">
                        <i className="fas fa-download me-1"></i>
                        {asset.downloadCount || 0}
                      </span>
                    </td>
                    <td>{formatDate(asset.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        {asset.copyrightStrike?.isStruck ? (
                          <button
                            className="btn-action btn-warning"
                            onClick={() => handleRemoveCopyrightStrike(asset._id, asset.title)}
                            title="Remove Copyright Strike"
                          >
                            <i className="fas fa-undo"></i>
                          </button>
                        ) : (
                          <button
                            className="btn-action btn-danger"
                            onClick={() => handleCopyrightStrike(asset)}
                            title="Apply Copyright Strike"
                          >
                            <i className="fas fa-ban"></i>
                          </button>
                        )}
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDeleteAsset(asset._id, asset.title)}
                          title="Delete Asset"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-wrapper">
              <nav>
                <ul className="pagination">
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
                    <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
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
            </div>
          )}
        </>
      )}

      {/* Copyright Strike Modal */}
      <div className={`modal fade ${showCopyrightModal ? 'show' : ''}`} 
           style={{ display: showCopyrightModal ? 'block' : 'none' }}
           tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Apply Copyright Strike</h5>
              <button type="button" className="btn-close" onClick={() => setShowCopyrightModal(false)}></button>
            </div>
            <div className="modal-body">
              {selectedAsset && (
                <div className="mb-3">
                  <strong>Asset:</strong> {selectedAsset.title}
                  <br />
                  <strong>Creator:</strong> {selectedAsset.creator?.name || 'Unknown'}
                </div>
              )}
              <div className="mb-3">
                <label htmlFor="copyrightReason" className="form-label">Reason for Copyright Strike *</label>
                <textarea
                  id="copyrightReason"
                  className="form-control"
                  rows="4"
                  value={copyrightReason}
                  onChange={(e) => setCopyrightReason(e.target.value)}
                  placeholder="Please provide a detailed reason for the copyright strike..."
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCopyrightModal(false)}>
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={handleCopyrightStrikeSubmit}
                disabled={copyrightLoading || !copyrightReason.trim()}
              >
                {copyrightLoading ? 'Applying...' : 'Apply Copyright Strike'}
              </button>
            </div>
          </div>
        </div>
      </div>
      {showCopyrightModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default AdminAssets; 