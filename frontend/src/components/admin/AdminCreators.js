import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import getApiConfig from '../../config/api';
import useAdminRealTime from '../../hooks/useAdminRealTime';
import VerificationTick from '../common/VerificationTick';

const AdminCreators = () => {
  useAuth();
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    limit: 10
  });
  const [editingCreator, setEditingCreator] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchCreators = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: filters.limit,
        search: filters.search,
        status: filters.status,
        // Filter only creators
        isCreator: 'true'
      });

      const apiConfig = getApiConfig();
      const response = await axios.get(`${apiConfig.baseURL}/api/admin/users?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Backend now filters by isCreator, so we can use the results directly
      setCreators(response.data.users);
      setTotalPages(response.data.totalPages);
      setLastUpdated(new Date());
    } catch (error) {
      setError('Failed to fetch creators');
      console.error('Error fetching creators:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  // Real-time update handler for creators
  const handleRealTimeUpdate = useCallback((updateData) => {
    console.log('Creators real-time update:', updateData);
    
    if (updateData.action === 'deleted') {
      setCreators(prevCreators => prevCreators.filter(creator => creator._id !== updateData.data._id));
      setSuccess(`Creator "${updateData.data.name}" was deleted by another admin`);
      setLastUpdated(new Date());
    } else if (updateData.action === 'updated') {
      // Only update if still a creator
      if (updateData.data.isCreator) {
        setCreators(prevCreators => prevCreators.map(creator => 
          creator._id === updateData.data._id ? updateData.data : creator
        ));
        setSuccess(`Creator "${updateData.data.name}" was updated by another admin`);
      } else {
        // Remove from creators list if no longer a creator
        setCreators(prevCreators => prevCreators.filter(creator => creator._id !== updateData.data._id));
        setSuccess(`"${updateData.data.name}" is no longer a creator`);
      }
      setLastUpdated(new Date());
    } else {
      // For other updates, refresh the list
      fetchCreators();
    }
  }, [fetchCreators]);

  // Use real-time hook for creators
  const { broadcastUpdate } = useAdminRealTime('users', handleRealTimeUpdate);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleEditCreator = (creator) => {
    setEditingCreator({ ...creator });
    setShowEditModal(true);
  };

  const handleUpdateCreator = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/admin/users/${editingCreator._id}`, editingCreator, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Creator updated successfully');
      setShowEditModal(false);
      setEditingCreator(null);
      
      // Broadcast real-time update to other admins
      broadcastUpdate('updated', response.data.user);
      
      fetchCreators();
    } catch (error) {
      setError('Failed to update creator');
      console.error('Error updating creator:', error);
    }
  };

  const handleDeleteCreator = async (creatorId, creatorName) => {
    if (window.confirm(`Are you sure you want to delete creator "${creatorName}"? This action cannot be undone.`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/admin/users/${creatorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Creator deleted successfully');
        
        // Broadcast real-time update to other admins
        broadcastUpdate('deleted', { _id: creatorId, name: creatorName });
        
        fetchCreators();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete creator');
        console.error('Error deleting creator:', error);
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'bg-success';
      case 'suspended': return 'bg-warning';
      case 'inactive': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
        <h3>Creator Management</h3>
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
              placeholder="Search by name, email, or display name..."
            />
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
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

      {/* Creators Table */}
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
                  <th>Creator</th>
                  <th>Email</th>
                  <th>Display Name</th>
                  <th>Bio</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {creators.map((creator) => (
                  <tr key={creator._id}>
                    <td>
                      <div>
                        <div className="fw-semibold d-flex align-items-center">
                          {creator.name}
                          <VerificationTick user={creator} size={16} />
                        </div>
                        {creator.username && (
                          <div className="text-muted small">@{creator.username}</div>
                        )}
                      </div>
                    </td>
                    <td>{creator.email}</td>
                    <td>{creator.displayName || '-'}</td>
                    <td>
                      <div className="bio-cell">
                        {creator.bio ? (
                          <span title={creator.bio}>
                            {creator.bio.length > 30 ? creator.bio.substring(0, 30) + '...' : creator.bio}
                          </span>
                        ) : (
                          '-'
                        )}
                      </div>
                    </td>
                    <td>{creator.location || '-'}</td>
                    <td>
                      <span className={`badge badge-status ${getStatusBadgeClass(creator.status)}`}>
                        {creator.status || 'active'}
                      </span>
                    </td>
                    <td>{formatDate(creator.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleEditCreator(creator)}
                          title="Edit Creator"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDeleteCreator(creator._id, creator.name)}
                          title="Delete Creator"
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

          {creators.length === 0 && !loading && (
            <div className="text-center py-4">
              <p className="text-muted">No creators found.</p>
            </div>
          )}

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

      {/* Edit Creator Modal */}
      {showEditModal && editingCreator && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Creator</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <form onSubmit={handleUpdateCreator}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingCreator.name}
                          onChange={(e) => setEditingCreator({...editingCreator, name: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          value={editingCreator.email}
                          onChange={(e) => setEditingCreator({...editingCreator, email: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Display Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingCreator.displayName || ''}
                          onChange={(e) => setEditingCreator({...editingCreator, displayName: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Username</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingCreator.username || ''}
                          onChange={(e) => setEditingCreator({...editingCreator, username: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Bio</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={editingCreator.bio || ''}
                      onChange={(e) => setEditingCreator({...editingCreator, bio: e.target.value})}
                      maxLength="100"
                    />
                    <div className="form-text">
                      {editingCreator.bio ? editingCreator.bio.length : 0}/100 characters
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Location</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingCreator.location || ''}
                          onChange={(e) => setEditingCreator({...editingCreator, location: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Phone Number</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingCreator.phoneNumber || ''}
                          onChange={(e) => setEditingCreator({...editingCreator, phoneNumber: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={editingCreator.status || 'active'}
                          onChange={(e) => setEditingCreator({...editingCreator, status: e.target.value})}
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Role</label>
                        <select
                          className="form-select"
                          value={editingCreator.role || 'creator'}
                          onChange={(e) => setEditingCreator({...editingCreator, role: e.target.value})}
                        >
                          <option value="creator">Creator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={editingCreator.isCreator || false}
                        onChange={(e) => setEditingCreator({...editingCreator, isCreator: e.target.checked})}
                      />
                      <label className="form-check-label">Is Creator</label>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={editingCreator.isAdmin || false}
                        onChange={(e) => setEditingCreator({...editingCreator, isAdmin: e.target.checked})}
                      />
                      <label className="form-check-label">Is Admin</label>
                    </div>
                  </div>
                  
                  {/* Verification Controls */}
                  <div className="mb-3">
                    <h6 className="form-label">Verification Status</h6>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={editingCreator.verification?.isBlueVerified || false}
                        onChange={(e) => setEditingCreator({
                          ...editingCreator, 
                          verification: {
                            ...editingCreator.verification,
                            isBlueVerified: e.target.checked
                          }
                        })}
                      />
                      <label className="form-check-label">Blue Tick (Admin Verified)</label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={editingCreator.verification?.isGrayVerified || false}
                        onChange={(e) => setEditingCreator({
                          ...editingCreator, 
                          verification: {
                            ...editingCreator.verification,
                            isGrayVerified: e.target.checked
                          }
                        })}
                      />
                      <label className="form-check-label">Gray Tick (Special Verification)</label>
                    </div>
                    <small className="form-text text-muted">
                      Golden Tick is automatically assigned to Premium users.
                    </small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Creator
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCreators; 