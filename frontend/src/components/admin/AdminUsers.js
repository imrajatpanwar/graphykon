import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import useAdminRealTime from '../../hooks/useAdminRealTime';
import VerificationTick from '../common/VerificationTick';

const AdminUsers = () => {
  // Remove destructuring, just call useAuth for possible side effects
  useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    limit: 10
  });
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: filters.limit,
        search: filters.search,
        role: filters.role,
        status: filters.status
      });

      const response = await axios.get(`/api/admin/users?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsers(response.data.users);
      setTotalPages(response.data.totalPages);
      setLastUpdated(new Date());
    } catch (error) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  // Real-time update handler for users
  const handleRealTimeUpdate = useCallback((updateData) => {
    console.log('Users real-time update:', updateData);
    
    if (updateData.action === 'deleted') {
      // Remove deleted user from list
      setUsers(prevUsers => prevUsers.filter(user => user._id !== updateData.data._id));
      setSuccess(`User "${updateData.data.name}" was deleted by another admin`);
      setLastUpdated(new Date());
    } else if (updateData.action === 'updated') {
      // Update user in list
      setUsers(prevUsers => prevUsers.map(user => 
        user._id === updateData.data._id ? updateData.data : user
      ));
      setSuccess(`User "${updateData.data.name}" was updated by another admin`);
      setLastUpdated(new Date());
    } else {
      // For other updates, refresh the list
      fetchUsers();
    }
  }, [fetchUsers]);

  // Use real-time hook for users
  const { broadcastUpdate } = useAdminRealTime('users', handleRealTimeUpdate);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleEditUser = (user) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/admin/users/${editingUser._id}`, editingUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('User updated successfully');
      setShowEditModal(false);
      setEditingUser(null);
      
      // Broadcast real-time update to other admins
      broadcastUpdate('updated', response.data.user);
      
      fetchUsers();
    } catch (error) {
      setError('Failed to update user');
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('User deleted successfully');
        
        // Broadcast real-time update to other admins
        broadcastUpdate('deleted', { _id: userId, name: userName });
        
        fetchUsers();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete user');
        console.error('Error deleting user:', error);
      }
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'bg-danger';
      case 'creator': return 'bg-primary';
      default: return 'bg-secondary';
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
        <h3>User Management</h3>
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
            <label>Role</label>
            <select name="role" value={filters.role} onChange={handleFilterChange}>
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="creator">Creator</option>
              <option value="admin">Admin</option>
            </select>
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

      {/* Users Table */}
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
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Creator</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div>
                        <div className="fw-semibold d-flex align-items-center">
                          {user.name}
                          <VerificationTick user={user} size={16} />
                        </div>
                        {user.displayName && (
                          <div className="text-muted small">@{user.displayName}</div>
                        )}
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge badge-role ${getRoleBadgeClass(user.role)}`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-status ${getStatusBadgeClass(user.status)}`}>
                        {user.status || 'active'}
                      </span>
                    </td>
                    <td>
                      {user.isCreator ? (
                        <span className="text-success">
                          <i className="fas fa-check"></i> Yes
                        </span>
                      ) : (
                        <span className="text-muted">No</span>
                      )}
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleEditUser(user)}
                          title="Edit User"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDeleteUser(user._id, user.name)}
                          title="Delete User"
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

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit User</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <form onSubmit={handleUpdateUser}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Role</label>
                    <select
                      className="form-select"
                      value={editingUser.role || 'user'}
                      onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                    >
                      <option value="user">User</option>
                      <option value="creator">Creator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={editingUser.status || 'active'}
                      onChange={(e) => setEditingUser({...editingUser, status: e.target.value})}
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={editingUser.isCreator || false}
                        onChange={(e) => setEditingUser({...editingUser, isCreator: e.target.checked})}
                      />
                      <label className="form-check-label">Is Creator</label>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={editingUser.isAdmin || false}
                        onChange={(e) => setEditingUser({...editingUser, isAdmin: e.target.checked})}
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
                        checked={editingUser.verification?.isBlueVerified || false}
                        onChange={(e) => setEditingUser({
                          ...editingUser, 
                          verification: {
                            ...editingUser.verification,
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
                        checked={editingUser.verification?.isGrayVerified || false}
                        onChange={(e) => setEditingUser({
                          ...editingUser, 
                          verification: {
                            ...editingUser.verification,
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
                    Update User
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

export default AdminUsers; 