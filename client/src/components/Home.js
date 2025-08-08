import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdOutlineRemoveRedEye, MdOutlineDownload } from 'react-icons/md';
import api from '../config/api';
import SkeletonLoader from './SkeletonLoader';
import './Home.css';

const Home = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
        <div className="home-assets-grid">
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
        <div className="home-assets-grid">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="home-asset-card"
              onClick={() => navigate(`/asset/${asset.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/asset/${asset.id}`);
                }
              }}
            >
              <div className="home-asset-thumbnail">
                {getImageUrl(asset) ? (
                  <>
                    <img 
                      src={getImageUrl(asset)} 
                      alt={asset.title}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const placeholder = e.target.parentElement.querySelector('.home-asset-placeholder');
                        if (placeholder) {
                          placeholder.style.display = 'flex';
                        }
                      }}
                    />
                                      <div className="home-asset-placeholder" style={{display: 'none'}}>
                    <span className="home-placeholder-text">{asset.title}</span>
                  </div>
                  </>
                ) : (
                  <div className="home-asset-placeholder">
                    <span className="home-placeholder-text">{asset.title}</span>
                    <div style={{fontSize: '0.7rem', marginTop: '0.5rem', opacity: 0.8}}>
                      No cover image
                    </div>
                  </div>
                )}
              </div>
              <div className="home-asset-details">
                <div className="home-asset-info-container">
                  <div className="home-creator-profile-image">
                    {asset.creator && asset.creator.profileImage ? (
                      <img 
                        src={`https://graphykon.com/api/assets/image/${asset.creator.profileImage.split('/').pop()}`} 
                        alt={asset.creator.name || asset.creator.username || 'Creator'}
                      />
                    ) : (
                      <div className="home-default-profile">
                        {asset.creator && (asset.creator.name || asset.creator.username) ? 
                          (asset.creator.name || asset.creator.username).charAt(0).toUpperCase() : 
                          'U'
                        }
                      </div>
                    )}
                  </div>
                  <div className="home-asset-text-info">
                    <h3 className="home-asset-title">{asset.title}</h3>
                    <p className="home-creator-name">
                      {asset.creator && asset.creator.name ? 
                        asset.creator.name : 
                        asset.creator && asset.creator.username ? 
                          asset.creator.username : 
                          'Unknown Creator'
                      }
                    </p>
                  </div>
                  <div className="home-asset-stats">
                    <span className="home-view-stat">
                      <MdOutlineRemoveRedEye size={14} />
                      {asset.views || 0}
                    </span>
                    <span className="home-download-stat">
                      <MdOutlineDownload size={14} />
                      {asset.downloads || 0}
                    </span>
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