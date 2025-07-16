import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AdminGraphs = () => {
  const [graphs, setGraphs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    limit: 10
  });

  const fetchGraphs = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: filters.limit,
        search: filters.search
      });

      const response = await axios.get(`/api/admin/graphs?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGraphs(response.data.graphs);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      setError('Failed to fetch graphs');
      console.error('Error fetching graphs:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchGraphs();
  }, [fetchGraphs]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleDeleteGraph = async (graphId, graphTitle) => {
    if (window.confirm(`Are you sure you want to delete graph "${graphTitle}"? This action cannot be undone.`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/admin/graphs/${graphId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Graph deleted successfully');
        fetchGraphs();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete graph');
        console.error('Error deleting graph:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return 'No description';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Graph Management</h3>
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
              placeholder="Search by title or description..."
            />
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

      {/* Graphs Table */}
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
                  <th>Description</th>
                  <th>Visibility</th>
                  <th>Nodes/Edges</th>
                  <th>Created</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {graphs.map((graph) => (
                  <tr key={graph._id}>
                    <td>
                      <div className="fw-semibold">{truncateText(graph.title, 30)}</div>
                    </td>
                    <td>
                      <div>
                        <div className="fw-semibold">{graph.createdBy?.name || 'Unknown'}</div>
                        <div className="text-muted small">{graph.createdBy?.email}</div>
                      </div>
                    </td>
                    <td>
                      <div className="text-muted small">{truncateText(graph.description, 40)}</div>
                    </td>
                    <td>
                      {graph.isPublic ? (
                        <span className="badge bg-success">
                          <i className="fas fa-globe me-1"></i>
                          Public
                        </span>
                      ) : (
                        <span className="badge bg-secondary">
                          <i className="fas fa-lock me-1"></i>
                          Private
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="text-center">
                        <div className="text-primary fw-semibold">
                          <i className="fas fa-circle me-1"></i>
                          {graph.nodes?.length || 0} nodes
                        </div>
                        <div className="text-secondary fw-semibold">
                          <i className="fas fa-arrow-right me-1"></i>
                          {graph.edges?.length || 0} edges
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(graph.createdAt)}</td>
                    <td>{formatDate(graph.updatedAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDeleteGraph(graph._id, graph.title)}
                          title="Delete Graph"
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

          {graphs.length === 0 && (
            <div className="text-center py-4">
              <div className="text-muted">
                <i className="fas fa-project-diagram fa-3x mb-3 opacity-50"></i>
                <h5>No graphs found</h5>
                <p>No graphs match your current search criteria.</p>
              </div>
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
    </div>
  );
};

export default AdminGraphs; 