import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Form, Alert, Modal, Badge, Spinner } from 'react-bootstrap';
import axios from 'axios';

const AdminTrending = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [trendingCount, setTrendingCount] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [modalAction, setModalAction] = useState('');

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/admin/trending/manage`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: 20,
          search: searchTerm
        }
      });

      setAssets(response.data.assets);
      setTotalPages(response.data.totalPages);
      setTrendingCount(response.data.trendingCount);
      setError('');
    } catch (error) {
      setError('Failed to load assets');
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleAddToTrending = async (asset) => {
    if (trendingCount >= 10) {
      setError('Maximum 10 trending assets allowed');
      return;
    }
    
    setSelectedAsset(asset);
    setModalAction('add');
    setShowConfirmModal(true);
  };

  const handleRemoveFromTrending = async (asset) => {
    setSelectedAsset(asset);
    setModalAction('remove');
    setShowConfirmModal(true);
  };

  const confirmAction = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (modalAction === 'add') {
        await axios.post(
          `http://localhost:5000/api/admin/trending/add/${selectedAsset._id}`,
          { order: trendingCount + 1 },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccess('Asset added to trending successfully');
      } else if (modalAction === 'remove') {
        await axios.delete(
          `http://localhost:5000/api/admin/trending/remove/${selectedAsset._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccess('Asset removed from trending successfully');
      }

      setShowConfirmModal(false);
      setSelectedAsset(null);
      setModalAction('');
      fetchAssets();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Operation failed');
      setShowConfirmModal(false);
      setTimeout(() => setError(''), 3000);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const truncateText = (text, maxLength = 50) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div className="admin-trending">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3>🔥 Trending Assets Management</h3>
          <p className="text-muted">
            Manage which assets appear in the trending section ({trendingCount}/10 trending)
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="row mb-4">
        <div className="col-md-6">
          <Form.Group>
            <Form.Control
              type="text"
              placeholder="Search assets by title or description..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </Form.Group>
        </div>
      </div>

      {/* Status Messages */}
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Assets Table */}
      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Creator</th>
                  <th>Category</th>
                  <th>Views</th>
                  <th>Downloads</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset._id}>
                    <td>
                      <img
                        src={asset.showcaseImages?.[0] ? `http://localhost:5000/${asset.showcaseImages[0]}` : 'https://via.placeholder.com/60x40?text=No+Image'}
                        alt={asset.title}
                        style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: '4px' }}
                      />
                    </td>
                    <td>
                      <div>
                        <strong>{truncateText(asset.title, 30)}</strong>
                        {asset.isTrending && (
                          <Badge bg="warning" className="ms-2">
                            #{asset.trendingOrder}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td>{asset.creator?.displayName || asset.creator?.username || 'Unknown'}</td>
                    <td>{asset.category}</td>
                    <td>{asset.viewCount}</td>
                    <td>{asset.downloadCount}</td>
                    <td>
                      {asset.isTrending ? (
                        <Badge bg="success">Trending</Badge>
                      ) : (
                        <Badge bg="secondary">Regular</Badge>
                      )}
                    </td>
                    <td>{formatDate(asset.createdAt)}</td>
                    <td>
                      {asset.isTrending ? (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveFromTrending(asset)}
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleAddToTrending(asset)}
                          disabled={trendingCount >= 10}
                        >
                          Add to Trending
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
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
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalAction === 'add' ? 'Add to Trending' : 'Remove from Trending'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAsset && (
            <div>
              <p>
                Are you sure you want to {modalAction === 'add' ? 'add' : 'remove'} this asset {modalAction === 'add' ? 'to' : 'from'} trending?
              </p>
              <div className="d-flex align-items-center">
                <img
                  src={selectedAsset.showcaseImages?.[0] ? `http://localhost:5000/${selectedAsset.showcaseImages[0]}` : 'https://via.placeholder.com/60x40?text=No+Image'}
                  alt={selectedAsset.title}
                  style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: '4px', marginRight: '10px' }}
                />
                <div>
                  <strong>{selectedAsset.title}</strong>
                  <br />
                  <small className="text-muted">by {selectedAsset.creator?.displayName || selectedAsset.creator?.username}</small>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button 
            variant={modalAction === 'add' ? 'success' : 'danger'} 
            onClick={confirmAction}
          >
            {modalAction === 'add' ? 'Add to Trending' : 'Remove from Trending'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminTrending; 