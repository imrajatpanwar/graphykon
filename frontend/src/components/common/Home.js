import React, { useEffect, useState } from 'react';
import { Alert } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ReactComponent as PremiumIcon } from '../image/premium_tag.svg';
import { ReactComponent as DownloadIcon } from '../image/Download_Gray.svg';
import { ReactComponent as TrendingIcon } from '../image/trending.svg';
import getApiConfig from '../../config/api';
import './Home.css';

// Skeleton Loading Component
const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-image">
      <div className="skeleton-shimmer" />
    </div>
    <div className="skeleton-info">
      <div className="skeleton-avatar">
        <div className="skeleton-shimmer" />
      </div>
      <div className="skeleton-text">
        <div className="skeleton-title">
          <div className="skeleton-shimmer" />
        </div>
        <div className="skeleton-meta">
          <div className="skeleton-creator">
            <div className="skeleton-shimmer" />
          </div>
          <div className="skeleton-stats">
            <div className="skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Skeleton Grid Component
const SkeletonGrid = ({ count = 5 }) => (
  <div className="skeleton-grid">
    {Array.from({ length: count }, (_, index) => (
      <SkeletonCard key={index} />
    ))}
  </div>
);

// Asset Card Component
const AssetCard = ({ asset, onClick, onCreatorClick }) => {
  const apiConfig = getApiConfig();
  
  return (
    <div className="asset-card" onClick={() => onClick(asset)}>
      <div className="asset-image-container">
        <img
          src={asset.showcaseImages && asset.showcaseImages.length > 0 
            ? `${apiConfig.baseURL}/${asset.showcaseImages[0]}` 
            : 'https://via.placeholder.com/300x200?text=No+Image'}
          alt={asset.title}
          className="asset-image"
        />
        {asset.license === 'Premium' && (
          <div 
            className="premium-badge"
            onClick={(e) => {
              e.stopPropagation();
              // Navigate to pricing page
            }}
            title="Premium Asset"
          >
            <PremiumIcon style={{ width: '100%', height: '100%' }} />
          </div>
        )}
      </div>
      <div className="asset-info">
        {asset.creator?.profileImage && (
          <img
            src={`${apiConfig.baseURL}/${asset.creator.profileImage}`}
            alt={asset.creator.displayName || asset.creator.username}
            className="creator-avatar"
          />
        )}
        <div className="asset-details">
          <h3 className="asset-title">{asset.title}</h3>
          <div className="asset-meta">
            <span 
              className="creator-name"
              onClick={(e) => onCreatorClick(e, asset.creator?.username)}
            >
              {asset.creator?.displayName || asset.creator?.username || 'Unknown'}
            </span>
            <div className="asset-stats">
              <span>
                <i className="bi bi-eye"></i> {asset.viewCount || 0}
              </span>
              <span>
                <DownloadIcon className="download-icon" />
                {asset.downloadCount || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function Home() {
  const [assets, setAssets] = useState([]);
  const [trendingAssets, setTrendingAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [error, setError] = useState('');
  const [trendingError, setTrendingError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const apiConfig = getApiConfig();
    
    // Fetch trending assets
    axios.get(`${apiConfig.baseURL}/api/admin/trending`)
      .then(res => setTrendingAssets(res.data))
      .catch(() => setTrendingError('Failed to load trending assets'))
      .finally(() => setTrendingLoading(false));

    // Fetch all assets
    axios.get(`${apiConfig.baseURL}/api/assets`)
      .then(res => setAssets(res.data))
      .catch(() => setError('Failed to load assets'))
      .finally(() => setLoading(false));
  }, []);

  const handleCardClick = (asset) => {
    navigate(`/assets/${asset._id}`);
  };

  const handleCreatorClick = (e, creatorUsername) => {
    e.stopPropagation();
    if (creatorUsername) {
      navigate(`/${creatorUsername}`);
    }
  };

  return (
    <div className="home-container">
      {/* Trending Section */}
      <div className="trending-title">
        <TrendingIcon className="trending-icon" />
        Trending
      </div>
      {trendingLoading ? (
        <SkeletonGrid count={5} />
      ) : trendingError ? (
        <div className="error-message">
          <Alert variant="warning">{trendingError}</Alert>
        </div>
      ) : trendingAssets.length === 0 ? (
        <div className="no-assets">No trending assets available.</div>
      ) : (
        <div className="trending-grid">
          {trendingAssets.map(asset => (
            <AssetCard 
              key={asset._id}
              asset={asset}
              onClick={handleCardClick}
              onCreatorClick={handleCreatorClick}
            />
          ))}
        </div>
      )}
      {/* Explore Section */}
      <div className="explore-title">Explore</div>
      {loading ? (
        <div className="explore-grid">
          {Array.from({ length: 8 }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : error ? (
        <div className="error-message">
          <Alert variant="danger">{error}</Alert>
        </div>
      ) : (
        <div className="explore-grid">
          {assets.length === 0 ? (
            <div className="no-assets">No assets found.</div>
          ) : (
            assets.map(asset => (
              <AssetCard 
                key={asset._id}
                asset={asset}
                onClick={handleCardClick}
                onCreatorClick={handleCreatorClick}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Home; 