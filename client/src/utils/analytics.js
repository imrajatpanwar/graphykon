import api from '../config/api';

// Generate a simple session ID for anonymous users
const getSessionId = () => {
  let sessionId = localStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Track an analytics event
export const trackEvent = async (assetId, type, metadata = {}) => {
  try {
    const token = localStorage.getItem('token');
    const userId = token ? JSON.parse(localStorage.getItem('user'))?.id : null;
    
    await api.post('/analytics/track', {
      assetId,
      type,
      userId,
      sessionId: getSessionId(),
      metadata
    });
  } catch (error) {
    console.error('Analytics tracking failed:', error);
    // Don't throw error to avoid breaking user experience
  }
};

// Track asset view
export const trackView = (assetId, metadata = {}) => {
  return trackEvent(assetId, 'view', metadata);
};

// Track asset download
export const trackDownload = (assetId, metadata = {}) => {
  return trackEvent(assetId, 'download', metadata);
};

// Track asset like
export const trackLike = (assetId, metadata = {}) => {
  return trackEvent(assetId, 'like', metadata);
};

// Track asset share
export const trackShare = (assetId, platform, metadata = {}) => {
  return trackEvent(assetId, 'share', { ...metadata, platform });
};

// Track user follow
export const trackFollow = (creatorId, metadata = {}) => {
  return trackEvent(creatorId, 'follow', metadata);
};

// Auto-track page views for assets
export const trackAssetPageView = (assetId) => {
  // Only track if not already tracked in this session
  const viewedAssets = JSON.parse(localStorage.getItem('viewed_assets') || '[]');
  if (!viewedAssets.includes(assetId)) {
    viewedAssets.push(assetId);
    localStorage.setItem('viewed_assets', JSON.stringify(viewedAssets));
    trackView(assetId, { source: 'page_view' });
  }
};

// Clear viewed assets (call on logout)
export const clearViewedAssets = () => {
  localStorage.removeItem('viewed_assets');
  localStorage.removeItem('analytics_session_id');
}; 