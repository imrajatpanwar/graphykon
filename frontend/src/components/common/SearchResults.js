import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Badge } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ReactComponent as PremiumIcon } from '../image/premium_tag.svg';
import getApiConfig from '../../config/api';

function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const query = searchParams.get('q') || '';

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query.trim()) {
        setAssets([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      
      try {
        const apiConfig = getApiConfig();
        const response = await axios.get(`${apiConfig.baseURL}/api/search?q=${encodeURIComponent(query)}`);
        setAssets(response.data);
      } catch (error) {
        console.error('Failed to fetch search results:', error);
        setError('Failed to load search results');
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  const handleAssetClick = (assetId) => {
    navigate(`/asset/${assetId}`);
  };

  const handleCreatorClick = (username) => {
    navigate(`/${username}`);
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-2">Searching...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <div className="mb-4">
        <h2>Search Results</h2>
        <p className="text-muted">
          {query ? `Results for "${query}"` : 'Enter a search term'}
          {assets.length > 0 && ` (${assets.length} found)`}
        </p>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {!query.trim() ? (
        <Alert variant="info">
          Please enter a search term to find assets by title, creator name, or username.
        </Alert>
      ) : assets.length === 0 ? (
        <Alert variant="warning">
          No assets found for "{query}". Try searching with different keywords.
        </Alert>
      ) : (
        <Row className="g-4">
          {assets.map((asset) => (
            <Col key={asset._id} xs={12} sm={6} md={4} lg={3}>
              <Card 
                className="h-100 shadow-sm"
                style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                onClick={() => handleAssetClick(asset._id)}
              >
                <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                  <Card.Img
                    variant="top"
                    src={
                      asset.showcaseImages && asset.showcaseImages.length > 0
                        ? `${getApiConfig().baseURL}/${asset.showcaseImages[0]}`
                        : 'https://via.placeholder.com/300x200?text=No+Image'
                    }
                    style={{ 
                      height: '200px', 
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                  {/* Premium Icon */}
                  {asset.license === 'Premium' && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '24px',
                        height: '24px',
                        zIndex: 10
                      }}
                    >
                      <PremiumIcon style={{ width: '100%', height: '100%' }} />
                    </div>
                  )}
                </div>
                <Card.Body className="d-flex flex-column">
                  <div className="mb-2">
                    <Badge bg="light" text="dark" className="mb-2">
                      {asset.category || 'Design'}
                    </Badge>
                    {asset.license === 'Premium' && (
                      <Badge bg="warning" text="dark" className="mb-2 ms-2">
                        Premium
                      </Badge>
                    )}
                  </div>
                  
                  <Card.Title 
                    style={{ 
                      fontSize: '16px', 
                      fontWeight: '600',
                      lineHeight: '1.3',
                      marginBottom: '8px'
                    }}
                  >
                    {asset.title}
                  </Card.Title>
                  
                  <Card.Text 
                    className="text-muted flex-grow-1"
                    style={{ 
                      fontSize: '13px',
                      lineHeight: '1.4',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {asset.description}
                  </Card.Text>
                  
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <small className="text-muted">
                        <i className="bi bi-eye me-1"></i>
                        {asset.viewCount || 0}
                      </small>
                      <small className="text-muted">
                        <i className="bi bi-download me-1"></i>
                        {asset.downloadCount || 0}
                      </small>
                    </div>
                    
                    <div 
                      className="d-flex align-items-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreatorClick(asset.creator?.username);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {asset.creator?.profileImage ? (
                        <img
                          src={`${getApiConfig().baseURL}/${asset.creator.profileImage}`}
                          alt={asset.creator.displayName || asset.creator.username}
                          style={{ 
                            width: '24px', 
                            height: '24px', 
                            borderRadius: '50%', 
                            objectFit: 'cover',
                            marginRight: '8px'
                          }}
                        />
                      ) : (
                        <div 
                          style={{ 
                            width: '24px', 
                            height: '24px', 
                            borderRadius: '50%', 
                            backgroundColor: '#e9ecef',
                            marginRight: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <span style={{ fontSize: '10px', color: '#6c757d' }}>👤</span>
                        </div>
                      )}
                      <small className="text-muted">
                        {asset.creator?.displayName || asset.creator?.username || 'Unknown'}
                      </small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}

export default SearchResults; 