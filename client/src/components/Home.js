import React, { useState, useEffect } from 'react';
import api from '../config/api';
import SkeletonLoader from './SkeletonLoader';
import './Home.css';

const Home = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      console.log('Fetching assets from:', api.defaults.baseURL + '/assets/public');
      console.log('API config:', api.defaults);
      const response = await api.get('/assets/public');
      console.log('Response received:', response);
      if (response.data.success) {
        setAssets(response.data.assets);
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
      console.error('Error details:', err.response?.data, err.response?.status);
      console.error('Error config:', err.config);
      setError('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (asset) => {
    if (asset.coverImages && asset.coverImages.length > 0) {
      return `https://graphykon.com/api/assets/image/${asset.coverImages[0].filename}`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="assets-grid">
          {[...Array(8)].map((_, index) => (
            <SkeletonLoader key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <div className="error-message">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={fetchAssets} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      {assets.length === 0 ? (
        <div className="no-assets">
          <h3>No assets available yet</h3>
          <p>Be the first to share your creative work!</p>
        </div>
      ) : (
        <div className="assets-grid">
          {assets.map((asset) => (
            <div key={asset.id} className="asset-card">
              <div className="asset-thumbnail">
                {getImageUrl(asset) ? (
                  <>
                    <img 
                      src={getImageUrl(asset)} 
                      alt={asset.title}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const placeholder = e.target.parentElement.querySelector('.asset-placeholder');
                        if (placeholder) {
                          placeholder.style.display = 'flex';
                        }
                      }}
                    />
                                      <div className="asset-placeholder" style={{display: 'none'}}>
                    <span className="placeholder-text">{asset.title}</span>
                  </div>
                  </>
                ) : (
                  <div className="asset-placeholder">
                    <span className="placeholder-text">{asset.title}</span>
                    <div style={{fontSize: '0.7rem', marginTop: '0.5rem', opacity: 0.8}}>
                      No cover image
                    </div>
                  </div>
                )}
              </div>
              <div className="asset-details">
                <div className="asset-info-container">
                  <div className="creator-profile-image">
                    {asset.creator && asset.creator.profileImage ? (
                      <img 
                        src={`https://graphykon.com/api/assets/image/${asset.creator.profileImage}`} 
                        alt={asset.creator.name || asset.creator.username || 'Creator'}
                      />
                    ) : (
                      <div className="default-profile">
                        {asset.creator && (asset.creator.name || asset.creator.username) ? 
                          (asset.creator.name || asset.creator.username).charAt(0).toUpperCase() : 
                          'U'
                        }
                      </div>
                    )}
                  </div>
                  <div className="asset-text-info">
                    <h3 className="asset-title">{asset.title}</h3>
                    <p className="creator-name">
                      {asset.creator && asset.creator.name ? 
                        asset.creator.name : 
                        asset.creator && asset.creator.username ? 
                          asset.creator.username : 
                          'Unknown Creator'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home; 