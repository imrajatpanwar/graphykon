import React, { useState, useEffect } from 'react';
import api from '../config/api';
import SkeletonLoader from './SkeletonLoader';
import '../global.css';

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
      const response = await api.get('/assets/public');
      if (response.data.success) {
        setAssets(response.data.assets);
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
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
        <div className="hero-section">
          <h1>Discover Amazing Design Assets</h1>
          <p>Browse and download high-quality graphics created by talented designers</p>
        </div>
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
      <div className="hero-section">
        <h1>Discover Amazing Design Assets</h1>
        <p>Browse and download high-quality graphics created by talented designers</p>
      </div>
      
      {assets.length === 0 ? (
        <div className="no-assets">
          <h3>No assets available yet</h3>
          <p>Be the first to share your creative work!</p>
        </div>
      ) : (
        <div className="assets-grid">
          {assets.map((asset) => (
            <div key={asset.id} className="asset-card">
              <div className="asset-image">
                {getImageUrl(asset) ? (
                  <img 
                    src={getImageUrl(asset)} 
                    alt={asset.title}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="asset-placeholder" style={{ display: getImageUrl(asset) ? 'none' : 'flex' }}>
                  <span>No Preview</span>
                </div>
              </div>
              <div className="asset-info">
                <h3 className="asset-title">{asset.title}</h3>
                <p className="asset-description">{asset.description}</p>
                <div className="asset-meta">
                  <span className="asset-category">{asset.category}</span>
                  <span className="asset-dimensions">{asset.width} × {asset.height}</span>
                </div>
                <div className="asset-stats">
                  <span className="downloads">↓ {asset.downloads}</span>
                  <span className="views">👁 {asset.views}</span>
                </div>
                <div className="asset-formats">
                  {Object.entries(asset.formats).map(([format, available]) => 
                    available && (
                      <span key={format} className="format-tag">
                        {format.toUpperCase()}
                      </span>
                    )
                  )}
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