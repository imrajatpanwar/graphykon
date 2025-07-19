import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import getApiConfig from '../../config/api';
import useAdminRealTime from '../../hooks/useAdminRealTime';

const AdminCopyrightAppeals = () => {
  useAuth();
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [responseStatus, setResponseStatus] = useState('approved');
  const [adminResponse, setAdminResponse] = useState('');
  const [responseLoading, setResponseLoading] = useState(false);
  
  // Enhanced filtering and search
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    dateRange: 'all',
    search: ''
  });
  const [sortBy, setSortBy] = useState('appealedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedAppeals, setSelectedAppeals] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  const fetchAppeals = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 10,
        sortBy,
        sortOrder,
        ...filters
      });

      const apiConfig = getApiConfig();
      const response = await axios.get(`${apiConfig.baseURL}/api/admin/copyright-appeals?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAppeals(response.data.appeals);
      setTotalPages(response.data.totalPages);
      setStats(response.data.stats);
      setLastUpdated(new Date());
    } catch (error) {
      setError('Failed to fetch appeals');
      console.error('Error fetching appeals:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, sortBy, sortOrder]);

  // Real-time update handler for appeals
  const handleRealTimeUpdate = useCallback((updateData) => {
    console.log('Appeals real-time update:', updateData);
    
    if (updateData.action === 'appeal-responded') {
      setAppeals(prevAppeals => 
        prevAppeals.map(appeal => 
          appeal._id === updateData.data._id 
            ? { ...appeal, copyrightStrike: { ...appeal.copyrightStrike, appeal: { ...appeal.copyrightStrike.appeal, status: updateData.data.status } } }
            : appeal
        )
      );
      setSuccess(`Appeal for "${updateData.data.title}" was ${updateData.data.status} by another admin`);
      setLastUpdated(new Date());
      fetchAppeals(); // Refresh stats
    } else {
      fetchAppeals();
    }
  }, [fetchAppeals]);

  const { broadcastUpdate } = useAdminRealTime('appeals', handleRealTimeUpdate);

  useEffect(() => {
    fetchAppeals();
  }, [fetchAppeals]);

  const handleRespondToAppeal = async (appeal) => {
    setSelectedAppeal(appeal);
    setResponseStatus('approved');
    setAdminResponse('');
    setShowResponseModal(true);
  };

  const handleViewDetails = (appeal) => {
    setSelectedAppeal(appeal);
    setShowDetailModal(true);
  };

  const handleResponseSubmit = async () => {
    if (!adminResponse.trim()) {
      setError('Please provide a response');
      return;
    }

    try {
      setResponseLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(`/api/admin/copyright-appeals/${selectedAppeal._id}/respond`, {
        status: responseStatus,
        adminResponse: adminResponse
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess(`Appeal ${responseStatus} successfully`);
      setShowResponseModal(false);
      setSelectedAppeal(null);
      setAdminResponse('');
      
      // Broadcast real-time update to other admins
      broadcastUpdate('appeal-responded', { 
        _id: selectedAppeal._id, 
        title: selectedAppeal.title, 
        status: responseStatus 
      });
      
      fetchAppeals();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to respond to appeal');
      console.error('Error responding to appeal:', error);
    } finally {
      setResponseLoading(false);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedAppeals.length === 0) {
      setError('Please select appeals and choose an action');
      return;
    }

    try {
      setBulkLoading(true);
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/copyright-appeals/bulk-action', {
        appealIds: selectedAppeals,
        action: bulkAction
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(`Bulk action completed successfully`);
      setSelectedAppeals([]);
      setBulkAction('');
      fetchAppeals();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to perform bulk action');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedAppeals.length === appeals.length) {
      setSelectedAppeals([]);
    } else {
      setSelectedAppeals(appeals.map(appeal => appeal._id));
    }
  };

  const handleSelectAppeal = (appealId) => {
    setSelectedAppeals(prev => 
      prev.includes(appealId) 
        ? prev.filter(id => id !== appealId)
        : [...prev, appealId]
    );
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const exportAppeals = async () => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        ...filters,
        sortBy,
        sortOrder,
        export: 'true'
      });

      const apiConfig = getApiConfig();
      const response = await axios.get(`${apiConfig.baseURL}/api/admin/copyright-appeals/export?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `copyright-appeals-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError('Failed to export appeals');
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      'pending': 'bg-warning',
      'approved': 'bg-success',
      'rejected': 'bg-danger'
    };
    return statusClasses[status] || 'bg-secondary';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
        <h3>Copyright Appeals</h3>
        <div className="live-indicator">
          <span className="status-dot live"></span>
          <small className="text-muted ms-2">
            Last updated: {formatLastUpdated()}
          </small>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card stat-card">
            <div className="card-body text-center">
              <h4 className="text-primary">{stats.total}</h4>
              <p className="text-muted mb-0">Total Appeals</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stat-card">
            <div className="card-body text-center">
              <h4 className="text-warning">{stats.pending}</h4>
              <p className="text-muted mb-0">Pending</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stat-card">
            <div className="card-body text-center">
              <h4 className="text-success">{stats.approved}</h4>
              <p className="text-muted mb-0">Approved</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stat-card">
            <div className="card-body text-center">
              <h4 className="text-danger">{stats.rejected}</h4>
              <p className="text-muted mb-0">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <label className="form-label">Status</label>
              <select 
                className="form-select" 
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Category</label>
              <select 
                className="form-select" 
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="all">All Categories</option>
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
            <div className="col-md-3">
              <label className="form-label">Date Range</label>
              <select 
                className="form-select" 
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Search</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search assets, creators..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
          
          <div className="row mt-3">
            <div className="col-md-6">
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={exportAppeals}
                >
                  <i className="fas fa-download me-1"></i>
                  Export CSV
                </button>
                                 <button 
                   className="btn btn-outline-secondary btn-sm"
                   onClick={fetchAppeals}
                 >
                   <i className="fas fa-sync-alt me-1"></i>
                   Refresh
                 </button>
                 <button 
                   className="btn btn-outline-info btn-sm"
                   onClick={() => window.open('/api/admin/copyright-appeals/stats', '_blank')}
                 >
                   <i className="fas fa-chart-bar me-1"></i>
                   View Stats
                 </button>
              </div>
            </div>
                         <div className="col-md-6 text-end">
               <div className="d-flex gap-2 justify-content-end align-items-center">
                 {selectedAppeals.length > 0 && (
                   <span className="text-muted small">
                     {selectedAppeals.length} appeal{selectedAppeals.length !== 1 ? 's' : ''} selected
                   </span>
                 )}
                 <select 
                   className="form-select form-select-sm" 
                   style={{ width: 'auto' }}
                   value={bulkAction}
                   onChange={(e) => setBulkAction(e.target.value)}
                 >
                   <option value="">Bulk Actions</option>
                   <option value="approve">Approve Selected</option>
                   <option value="reject">Reject Selected</option>
                 </select>
                 <button 
                   className="btn btn-primary btn-sm"
                   onClick={handleBulkAction}
                   disabled={!bulkAction || selectedAppeals.length === 0 || bulkLoading}
                 >
                   {bulkLoading ? 'Processing...' : 'Apply'}
                 </button>
               </div>
             </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
          <button 
            className="btn-close float-end" 
            onClick={() => setError(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button 
            className="btn-close float-end" 
            onClick={() => setSuccess(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : appeals.length === 0 ? (
        <div className="text-center py-5">
          <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
          <h5 className="text-muted">No Copyright Appeals</h5>
          <p className="text-muted">There are currently no copyright appeals matching your criteria.</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-striped admin-table">
              <thead>
                <tr>
                  <th>
                    <input 
                      type="checkbox" 
                      className="form-check-input"
                      checked={selectedAppeals.length === appeals.length && appeals.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>
                    <button 
                      className="btn btn-link p-0 text-decoration-none"
                      onClick={() => handleSortChange('title')}
                    >
                      Asset
                      {sortBy === 'title' && (
                        <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                      )}
                    </button>
                  </th>
                  <th>Creator</th>
                  <th>Strike Reason</th>
                  <th>Appeal Reason</th>
                  <th>
                    <button 
                      className="btn btn-link p-0 text-decoration-none"
                      onClick={() => handleSortChange('status')}
                    >
                      Status
                      {sortBy === 'status' && (
                        <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                      )}
                    </button>
                  </th>
                  <th>
                    <button 
                      className="btn btn-link p-0 text-decoration-none"
                      onClick={() => handleSortChange('appealedAt')}
                    >
                      Appealed
                      {sortBy === 'appealedAt' && (
                        <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                      )}
                    </button>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appeals.map((appeal) => (
                  <tr key={appeal._id}>
                    <td>
                      <input 
                        type="checkbox" 
                        className="form-check-input"
                        checked={selectedAppeals.includes(appeal._id)}
                        onChange={() => handleSelectAppeal(appeal._id)}
                      />
                    </td>
                    <td>
                      <div>
                        <div className="fw-semibold">{truncateText(appeal.title, 30)}</div>
                        <div className="text-muted small">{appeal.category}</div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="fw-semibold">{appeal.creator?.name || 'Unknown'}</div>
                        <div className="text-muted small">{appeal.creator?.email}</div>
                      </div>
                    </td>
                    <td>
                      <div className="text-danger">
                        {truncateText(appeal.copyrightStrike.reason, 40)}
                      </div>
                    </td>
                    <td>
                      <div>
                        {truncateText(appeal.copyrightStrike.appeal.appealReason, 40)}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-status ${getStatusBadgeClass(appeal.copyrightStrike.appeal.status)}`}>
                        {appeal.copyrightStrike.appeal.status.charAt(0).toUpperCase() + appeal.copyrightStrike.appeal.status.slice(1)}
                      </span>
                    </td>
                    <td>{formatDate(appeal.copyrightStrike.appeal.appealedAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-action btn-info"
                          onClick={() => handleViewDetails(appeal)}
                          title="View Details"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        {appeal.copyrightStrike.appeal.status === 'pending' && (
                          <button
                            className="btn-action btn-primary"
                            onClick={() => handleRespondToAppeal(appeal)}
                            title="Respond to Appeal"
                          >
                            <i className="fas fa-reply"></i>
                          </button>
                        )}
                        {appeal.copyrightStrike.appeal.status !== 'pending' && (
                          <div className="text-muted small">
                            {appeal.copyrightStrike.appeal.adminResponse && (
                              <div>
                                <strong>Response:</strong> {truncateText(appeal.copyrightStrike.appeal.adminResponse, 30)}
                              </div>
                            )}
                            {appeal.copyrightStrike.appeal.respondedBy && (
                              <div>
                                <strong>By:</strong> {appeal.copyrightStrike.appeal.respondedBy.name}
                              </div>
                            )}
                            {appeal.copyrightStrike.appeal.respondedAt && (
                              <div>
                                {formatDate(appeal.copyrightStrike.appeal.respondedAt)}
                              </div>
                            )}
                          </div>
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

      {/* Response Modal */}
      <div className={`modal fade ${showResponseModal ? 'show' : ''}`} 
           style={{ display: showResponseModal ? 'block' : 'none' }}
           tabIndex="-1">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Respond to Copyright Appeal</h5>
              <button type="button" className="btn-close" onClick={() => setShowResponseModal(false)}></button>
            </div>
            <div className="modal-body">
              {selectedAppeal && (
                <>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <strong>Asset:</strong> {selectedAppeal.title}
                    </div>
                    <div className="col-md-6">
                      <strong>Creator:</strong> {selectedAppeal.creator?.name || 'Unknown'}
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <strong>Strike Reason:</strong>
                      <div className="text-danger mt-1">{selectedAppeal.copyrightStrike.reason}</div>
                    </div>
                    <div className="col-md-6">
                      <strong>Appeal Reason:</strong>
                      <div className="mt-1">{selectedAppeal.copyrightStrike.appeal.appealReason}</div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="responseStatus" className="form-label">Decision *</label>
                    <select
                      id="responseStatus"
                      className="form-select"
                      value={responseStatus}
                      onChange={(e) => setResponseStatus(e.target.value)}
                    >
                      <option value="approved">Approve Appeal</option>
                      <option value="rejected">Reject Appeal</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="adminResponse" className="form-label">Admin Response *</label>
                    <textarea
                      id="adminResponse"
                      className="form-control"
                      rows="4"
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      placeholder="Please provide a detailed response to the appeal..."
                      required
                    />
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowResponseModal(false)}>
                Cancel
              </button>
              <button 
                type="button" 
                className={`btn ${responseStatus === 'approved' ? 'btn-success' : 'btn-danger'}`}
                onClick={handleResponseSubmit}
                disabled={responseLoading || !adminResponse.trim()}
              >
                {responseLoading ? 'Submitting...' : `${responseStatus === 'approved' ? 'Approve' : 'Reject'} Appeal`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail View Modal */}
      <div className={`modal fade ${showDetailModal ? 'show' : ''}`} 
           style={{ display: showDetailModal ? 'block' : 'none' }}
           tabIndex="-1">
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Appeal Details</h5>
              <button type="button" className="btn-close" onClick={() => setShowDetailModal(false)}></button>
            </div>
            <div className="modal-body">
              {selectedAppeal && (
                <div className="row">
                  <div className="col-md-6">
                    <h6>Asset Information</h6>
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <td><strong>Title:</strong></td>
                          <td>{selectedAppeal.title}</td>
                        </tr>
                        <tr>
                          <td><strong>Category:</strong></td>
                          <td>{selectedAppeal.category}</td>
                        </tr>
                        <tr>
                          <td><strong>Description:</strong></td>
                          <td>{selectedAppeal.description}</td>
                        </tr>
                        <tr>
                          <td><strong>Created:</strong></td>
                          <td>{formatDate(selectedAppeal.createdAt)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-md-6">
                    <h6>Creator Information</h6>
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <td><strong>Name:</strong></td>
                          <td>{selectedAppeal.creator?.name || 'Unknown'}</td>
                        </tr>
                        <tr>
                          <td><strong>Email:</strong></td>
                          <td>{selectedAppeal.creator?.email}</td>
                        </tr>
                        <tr>
                          <td><strong>Display Name:</strong></td>
                          <td>{selectedAppeal.creator?.displayName}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-12 mt-3">
                    <h6>Copyright Strike Details</h6>
                    <div className="alert alert-danger">
                      <strong>Strike Reason:</strong><br/>
                      {selectedAppeal.copyrightStrike.reason}
                    </div>
                    <div className="alert alert-warning">
                      <strong>Appeal Reason:</strong><br/>
                      {selectedAppeal.copyrightStrike.appeal.appealReason}
                    </div>
                                         {selectedAppeal.copyrightStrike.appeal.adminResponse && (
                       <div className="alert alert-info">
                         <strong>Admin Response:</strong><br/>
                         {selectedAppeal.copyrightStrike.appeal.adminResponse}
                         {selectedAppeal.copyrightStrike.appeal.respondedBy && (
                           <div className="mt-2">
                             <small className="text-muted">
                               Responded by: {selectedAppeal.copyrightStrike.appeal.respondedBy.name}
                             </small>
                           </div>
                         )}
                       </div>
                     )}
                  </div>
                  <div className="col-12 mt-3">
                    <h6>Timeline</h6>
                    <div className="timeline">
                      <div className="timeline-item">
                        <div className="timeline-marker bg-danger"></div>
                        <div className="timeline-content">
                          <strong>Copyright Strike Issued</strong><br/>
                          {formatDate(selectedAppeal.copyrightStrike.struckAt)}
                        </div>
                      </div>
                      <div className="timeline-item">
                        <div className="timeline-marker bg-warning"></div>
                        <div className="timeline-content">
                          <strong>Appeal Submitted</strong><br/>
                          {formatDate(selectedAppeal.copyrightStrike.appeal.appealedAt)}
                        </div>
                      </div>
                      {selectedAppeal.copyrightStrike.appeal.respondedAt && (
                        <div className="timeline-item">
                          <div className={`timeline-marker ${selectedAppeal.copyrightStrike.appeal.status === 'approved' ? 'bg-success' : 'bg-danger'}`}></div>
                          <div className="timeline-content">
                            <strong>Appeal {selectedAppeal.copyrightStrike.appeal.status.charAt(0).toUpperCase() + selectedAppeal.copyrightStrike.appeal.status.slice(1)}</strong><br/>
                            {formatDate(selectedAppeal.copyrightStrike.appeal.respondedAt)}
                          </div>
                        </div>
                                             )}
                     </div>
                   </div>
                   {selectedAppeal.copyrightStrike.appeal.appealHistory && selectedAppeal.copyrightStrike.appeal.appealHistory.length > 0 && (
                     <div className="col-12 mt-3">
                       <h6>Appeal History</h6>
                       <div className="timeline">
                         {selectedAppeal.copyrightStrike.appeal.appealHistory.map((history, index) => (
                           <div key={index} className="timeline-item">
                             <div className={`timeline-marker ${
                               history.action === 'submitted' ? 'bg-warning' :
                               history.status === 'approved' ? 'bg-success' :
                               history.status === 'rejected' ? 'bg-danger' : 'bg-secondary'
                             }`}></div>
                             <div className="timeline-content">
                               <strong>{history.action.charAt(0).toUpperCase() + history.action.slice(1)}</strong>
                               {history.status && (
                                 <span className={`badge ms-2 ${getStatusBadgeClass(history.status)}`}>
                                   {history.status.charAt(0).toUpperCase() + history.status.slice(1)}
                                 </span>
                               )}
                               {history.note && (
                                 <div className="mt-1">
                                   <small>{history.note}</small>
                                 </div>
                               )}
                               <div className="mt-1">
                                 <small className="text-muted">
                                   {formatDate(history.timestamp)}
                                 </small>
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               )}
            </div>
            <div className="modal-footer">
              {selectedAppeal?.copyrightStrike.appeal.status === 'pending' && (
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => {
                    setShowDetailModal(false);
                    handleRespondToAppeal(selectedAppeal);
                  }}
                >
                  Respond to Appeal
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {showResponseModal && <div className="modal-backdrop fade show"></div>}
      {showDetailModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default AdminCopyrightAppeals; 