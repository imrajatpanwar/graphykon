import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/api';
import SkeletonLoader from './SkeletonLoader';

const AssetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/assets/public/${id}`);
        if (res.data?.success) {
          setAsset(res.data.asset);
        } else {
          setError('Asset not found');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load asset');
      } finally {
        setLoading(false);
      }
    };

    fetchAsset();
  }, [id]);

  useEffect(() => {
    // Record a view when the detail page is opened
    const recordView = async () => {
      try {
        await api.post(`/assets/${id}/view`);
      } catch (err) {
        // Non-blocking; ignore errors
      }
    };
    recordView();
  }, [id]);

  if (loading) {
    return <SkeletonLoader type="card" count={1} />;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="retry-btn">Go Back</button>
      </div>
    );
  }

  if (!asset) return null;

  const imageUrl = asset.coverImages && asset.coverImages.length > 0
    ? `https://graphykon.com/api/assets/image/${asset.coverImages[0].filename}`
    : null;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
        ← Back
      </button>

      <div className="asset-card" style={{ minWidth: 'unset' }}>
        <div className="asset-thumbnail" style={{ height: 320 }}>
          {imageUrl ? (
            <img src={imageUrl} alt={asset.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div className="asset-placeholder">
              <span className="placeholder-text">{asset.title}</span>
            </div>
          )}
        </div>
        <div className="asset-details">
          <h2 className="asset-title" style={{ margin: 0 }}>{asset.title}</h2>
          <p style={{ color: '#555', marginTop: '0.5rem' }}>{asset.description}</p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: 14, color: '#666' }}>
            <span>Category: {asset.category}</span>
            <span>Dimensions: {asset.width} × {asset.height}</span>
            <span>Views: {asset.views || 0}</span>
            <span>Downloads: {asset.downloads || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetDetail;


