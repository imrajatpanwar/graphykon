import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    limit: 10
  });

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: filters.limit,
        search: filters.search
      });

      const response = await axios.get(`/api/admin/reviews?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setReviews(response.data.reviews);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      setError('Failed to fetch reviews');
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleDeleteReview = async (reviewId, reviewText) => {
    if (window.confirm(`Are you sure you want to delete this review? This action cannot be undone.`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/admin/reviews/${reviewId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Review deleted successfully');
        fetchReviews();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete review');
        console.error('Error deleting review:', error);
      }
    }
  };

  const getRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i 
          key={i} 
          className={`fas fa-star ${i <= rating ? 'text-warning' : 'text-muted'}`}
        ></i>
      );
    }
    return stars;
  };

  const getRatingBadgeClass = (rating) => {
    if (rating >= 4) return 'bg-success';
    if (rating >= 3) return 'bg-warning';
    if (rating >= 2) return 'bg-secondary';
    return 'bg-danger';
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

  const truncateText = (text, maxLength = 100) => {
    if (!text) return 'No review text';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Review Management</h3>
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
              placeholder="Search by review text..."
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

      {/* Reviews Table */}
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
                  <th>Reviewer</th>
                  <th>Creator Reviewed</th>
                  <th>Rating</th>
                  <th>Review Text</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review._id}>
                    <td>
                      <div>
                        <div className="fw-semibold">{review.reviewer?.name || 'Unknown'}</div>
                        <div className="text-muted small">{review.reviewer?.email}</div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="fw-semibold">{review.creator?.name || 'Unknown'}</div>
                        <div className="text-muted small">{review.creator?.email}</div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className={`badge badge-status ${getRatingBadgeClass(review.rating)} me-2`}>
                          {review.rating}/5
                        </span>
                        <div className="rating-stars">
                          {getRatingStars(review.rating)}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="review-text" title={review.reviewText}>
                        {truncateText(review.reviewText, 80)}
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="fw-semibold">{formatDate(review.createdAt)}</div>
                        {review.updatedAt !== review.createdAt && (
                          <div className="text-muted small">
                            Updated: {formatDate(review.updatedAt)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDeleteReview(review._id, review.reviewText)}
                          title="Delete Review"
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

          {reviews.length === 0 && (
            <div className="text-center py-4">
              <div className="text-muted">
                <i className="fas fa-star fa-3x mb-3 opacity-50"></i>
                <h5>No reviews found</h5>
                <p>No reviews match your current search criteria.</p>
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

export default AdminReviews; 