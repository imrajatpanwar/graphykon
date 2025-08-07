import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { MdOutlineFileUpload } from 'react-icons/md';
import SkeletonLoader from './SkeletonLoader';
import './Studio.css';

// Utility function to get the correct image URL for assets
const getImageUrl = (filename) => {
  if (!filename) {
    console.warn('getImageUrl: No filename provided');
    return null;
  }
  
  console.log('getImageUrl input:', filename);
  
  // If it's already a complete URL, return as is
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    console.log('getImageUrl: Already complete URL:', filename);
    return filename;
  }
  
  // Remove any leading slashes from filename
  let cleanFilename = filename.replace(/^\/+/, '');
  
  // Remove any path prefix that might be stored in the database
  // The filename might be stored as full path like "/var/www/graphykon/server/uploads/filename"
  if (cleanFilename.includes('/')) {
    cleanFilename = cleanFilename.split('/').pop();
  }
  
  // Use the API endpoint for images which has proper CORS headers
  // Add cache-busting parameter to bypass Cloudflare cache
  const timestamp = Date.now();
  const finalUrl = `https://graphykon.com/api/assets/image/${cleanFilename}?v=${timestamp}`;
  console.log('getImageUrl output:', finalUrl);
  
  return finalUrl;
};

// Utility function to load image with authentication and return blob URL
const loadAuthenticatedImage = async (filename) => {
  if (!filename) {
    console.warn('loadAuthenticatedImage: No filename provided');
    return null;
  }

  try {
    // Remove any leading slashes from filename
    let cleanFilename = filename.replace(/^\/+/, '');
    
    // Remove any path prefix that might be stored in the database
    if (cleanFilename.includes('/')) {
      cleanFilename = cleanFilename.split('/').pop();
    }

    const token = localStorage.getItem('token');
    const imageUrl = `https://graphykon.com/api/assets/image/${cleanFilename}`;
    
    console.log('Loading authenticated image:', imageUrl);

    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'image/*'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to load image: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    console.log('✓ Image loaded successfully as blob:', blobUrl);
    return blobUrl;
  } catch (error) {
    console.error('✗ Error loading authenticated image:', error);
    return null;
  }
};

// Utility function to get the correct profile image URL
const getProfileImageUrl = (profileImagePath) => {
  if (!profileImagePath) {
    console.warn('getProfileImageUrl: No profile image path provided');
    return null;
  }
  
  console.log('getProfileImageUrl input:', profileImagePath);
  
  // If it's a data URL (base64), return as is
  if (profileImagePath.startsWith('data:')) {
    console.log('getProfileImageUrl: Data URL detected');
    return profileImagePath;
  }
  
  // If it's already a complete URL, return as is
  if (profileImagePath.startsWith('http://') || profileImagePath.startsWith('https://')) {
    console.log('getProfileImageUrl: Already complete URL:', profileImagePath);
    return profileImagePath;
  }
  
  // Extract filename from path like "/uploads/profiles/filename"
  let filename = profileImagePath;
  if (filename.includes('/')) {
    filename = filename.split('/').pop();
  }
  
  // Use the API endpoint for profile images with proper CORS headers
  // Add cache-busting parameter to bypass Cloudflare cache
  const timestamp = Date.now();
  const finalUrl = `https://graphykon.com/api/assets/image/${filename}?v=${timestamp}`;
  console.log('getProfileImageUrl output:', finalUrl);
  
  return finalUrl;
};

// Custom component for authenticated images
const AuthenticatedImage = ({ filename, alt, className, onLoad, onError }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const blobUrlRef = useRef(null);

  const handleLoad = useCallback(() => {
    onLoad && onLoad();
  }, [onLoad]);

  const handleError = useCallback(() => {
    onError && onError();
  }, [onError]);

  useEffect(() => {
    if (!filename) {
      setLoading(false);
      setError(true);
      return;
    }

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);
        const url = await loadAuthenticatedImage(filename);
        if (url) {
          setBlobUrl(url);
          blobUrlRef.current = url;
          handleLoad();
        } else {
          setError(true);
          handleError();
        }
      } catch (err) {
        console.error('Error loading image:', err);
        setError(true);
        handleError();
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    // Cleanup blob URL when component unmounts
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [filename, handleLoad, handleError]);

  if (loading) {
    return (
      <div className={className} style={{ 
        background: '#f0f0f0', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#999',
        fontSize: '12px'
      }}>
        Loading...
      </div>
    );
  }

  if (error || !blobUrl) {
    return null; // Let the parent handle showing placeholder
  }

  return (
    <img 
      src={blobUrl} 
      alt={alt} 
      className={`authenticated-image ${className || ''}`}
      style={{ display: 'block' }}
    />
  );
};

// Component for asset thumbnails with proper fallback handling
const AssetThumbnail = ({ asset }) => {
  const [imageError, setImageError] = useState(false);

  const hasImages = asset.coverImages && asset.coverImages.length > 0;
  const showPlaceholder = !hasImages || imageError;

  return (
    <div className="asset-thumbnail">
      {hasImages && !imageError && (
        <AuthenticatedImage
          filename={asset.coverImages[0].filename}
          alt={asset.title}
          onLoad={() => {
            console.log('✓ Authenticated image loaded successfully:', asset.title);
            setImageError(false);
          }}
          onError={() => {
            console.error('✗ Authenticated image failed to load:', {
              asset: asset.title,
              filename: asset.coverImages[0].filename,
              coverImages: asset.coverImages
            });
            setImageError(true);
          }}
        />
      )}
      <div 
        className="thumbnail-placeholder" 
        style={{
          display: showPlaceholder ? 'flex' : 'none'
        }}
      >
        <span>SOCIAL<br/>MEDIA</span>
      </div>
    </div>
  );
};

const Studio = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardLoading, setDashboardLoading] = useState(true);



  // Redirect if not a creator
  React.useEffect(() => {
    if (user && !user.creator) {
      navigate('/be-a-creator');
    }
  }, [user, navigate]);

  // Simulate dashboard loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDashboardLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);



  if (!user || !user.creator) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'assets':
        return <Assets />;
      case 'analytics':
        return <Analytics />;
      case 'copyright':
        return <SkeletonLoader type="card" count={3} />;
      case 'earn':
        return <SkeletonLoader type="card" count={4} />;
      case 'setting':
        return <UserSettings />;
      default:
        return (
          <div className="main-content">
            <div className="content-header">
              <div className="header-content">
                <h1>Studio Dashboard</h1>
                <button className="upload-assets-btn" onClick={() => setActiveTab('assets')}>Upload Assets</button>
              </div>
            </div>

            <div className="dashboard-layout">
              {/* Left Sidebar */}
              <div className="left-sidebar">
                {dashboardLoading ? (
                  <SkeletonLoader type="studio-sidebar" />
                ) : (
                  <>
                    {/* Studio Analytics & Summary Combined */}
                    <div className="card analytics-summary-card">
                  <div className="analytics-header">
                    <h3>Studio Analytics</h3>
                    <div className="current-followers">
                      <div className="followers-label">Current Followers</div>
                      <div className="followers-value">0</div>
                    </div>
                  </div>
                  
                  <div className="summary-section">
                    <div className="summary-subtitle">Last 28 days</div>
                    <div className="summary-metrics">
                      <div className="summary-item">
                        <span className="summary-label">Total Uploads</span>
                        <span className="summary-value">0</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Asset Views</span>
                        <span className="summary-value">0</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Downloads</span>
                        <span className="summary-value">0</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Earnings</span>
                        <span className="summary-value">0</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Copyright's</span>
                        <span className="summary-value">0</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Profile View</span>
                        <span className="summary-value">0</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Need Expert Help */}
                <div className="card help-card">
                  <h3>Need Expert Help ?</h3>
                  <div className="help-content">
                    <p>Get expert support to start your project with ease.</p>
                    <div className="help-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                  </>
                )}
              </div>

              {/* Main Content Area */}
              <div className="main-content-area">
                {dashboardLoading ? (
                  <SkeletonLoader type="studio-main" />
                ) : (
                  <>
                    {/* Full Width Growth Card */}
                    <div className="full-width-growth">
                  <div className="card growth-card">
                    <h3>Audience Growth</h3>
                    <div className="growth-subtitle">Reaching More People, Faster</div>
                    <div className="growth-chart">
                      <svg width="100%" height="200" viewBox="0 0 800 200">
                        {/* Grid lines */}
                        <defs>
                          <pattern id="growthGrid" width="80" height="25" patternUnits="userSpaceOnUse">
                            <path d="M 80 0 L 0 0 0 25" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
                          </pattern>
                        </defs>
                        
                        <rect width="100%" height="100%" fill="url(#growthGrid)" />
                        
                        {/* X-axis labels */}
                        <text x="10" y="190" textAnchor="middle" fontSize="12" fill="#666">Jan</text>
                        <text x="75" y="190" textAnchor="middle" fontSize="12" fill="#666">Feb</text>
                        <text x="140" y="190" textAnchor="middle" fontSize="12" fill="#666">Mar</text>
                        <text x="205" y="190" textAnchor="middle" fontSize="12" fill="#666">Apr</text>
                        <text x="270" y="190" textAnchor="middle" fontSize="12" fill="#666">May</text>
                        <text x="335" y="190" textAnchor="middle" fontSize="12" fill="#666">Jun</text>
                        <text x="400" y="190" textAnchor="middle" fontSize="12" fill="#666">Jul</text>
                        <text x="465" y="190" textAnchor="middle" fontSize="12" fill="#666">Aug</text>
                        <text x="530" y="190" textAnchor="middle" fontSize="12" fill="#666">Sep</text>
                        <text x="595" y="190" textAnchor="middle" fontSize="12" fill="#666">Oct</text>
                        <text x="660" y="190" textAnchor="middle" fontSize="12" fill="#666">Nov</text>
                        <text x="725" y="190" textAnchor="middle" fontSize="12" fill="#666">Dec</text>
                        
                        {/* Growth line */}
                        <path 
                          d="M 10,160 L 75,140 L 140,120 L 205,100 L 270,90 L 335,80 L 400,70 L 465,85 L 530,75 L 595,60 L 660,50 L 725,40"
                          stroke="#007bff" 
                          strokeWidth="3" 
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        
                        {/* Second growth line */}
                        <path 
                          d="M 10,140 L 75,130 L 140,125 L 205,135 L 270,120 L 335,110 L 400,100 L 465,115 L 530,95 L 595,85 L 660,75 L 725,65"
                          stroke="#28a745" 
                          strokeWidth="2" 
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray="5,5"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Two Column Layout Below */}
                <div className="two-column-layout">
                  {/* Left Column - Trending Search */}
                  <div className="trending-section">
                    <div className="card trending-card">
                      <h3>Suggested Trending Search</h3>
                      <div className="trending-subtitle">Popular Keywords Today</div>
                      <div className="trending-list">
                        <div className="trending-item trending">
                          <span className="trending-text">Trending Color Palettes</span>
                          <img src={require('./image/growth_icon.svg')} alt="Growth" className="trending-icon" width="16" height="16" />
                        </div>
                        <div className="trending-item trending">
                          <span className="trending-text">Free 3D Mockup Downloads</span>
                          <img src={require('./image/growth_icon.svg')} alt="Growth" className="trending-icon" width="16" height="16" />
                        </div>
                        <div className="trending-item trending">
                          <span className="trending-text">Logo Design Inspiration</span>
                          <img src={require('./image/growth_icon.svg')} alt="Growth" className="trending-icon" width="16" height="16" />
                        </div>
                        <div className="trending-item">
                          <span className="trending-text">Best Portfolio Websites for Designers</span>
                        </div>
                        <div className="trending-item">
                          <span className="trending-text">AI Tools for Graphic Designers</span>
                        </div>
                      </div>
                    </div>

                    {/* Fade Effect */}
                    <div className="fade-effect">
                      <svg width="100%" height="250" viewBox="0 0 509 238" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="100%" height="100%" fill="url(#paint0_linear_1883_167)"/>
                        <defs>
                          <linearGradient id="paint0_linear_1883_167" x1="50%" y1="5.8%" x2="50%" y2="100%" gradientUnits="userSpaceOnUse">
                            <stop stopColor="white" stopOpacity="0"/>
                            <stop offset="1" stopColor="white"/>
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>

                    {/* Upgrade to PRO Button */}
                    <div className="upgrade-section">
                      <button className="upgrade-pro-btn">
                        <span>Upgrade to</span>
                        <span className="pro-badge">PRO</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column - Project Image */}
                  <div className="project-section">
                    <div className="project-image-card">
                      <img 
                        src={require('./image/start_project.png')} 
                        alt="Business professionals transitioning from digital to physical workspace"
                        className="project-img"
                      />
                      <div className="unlock-project-container">
                        <span className="unlock-text">Unlock Your First</span>
                        <button className="project-btn">
                          <img src="/src/components/image/unlock.svg" alt="Unlock" />
                          PROJECT
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="studio-dashboard">
      {/* Left Sidebar */}
      <div className="sidebar">
        {/* Profile Section */}
        <div className="profile-section">
          <div className="avatar">
            {user.profileImage ? (
              <img 
                src={getProfileImageUrl(user.profileImage)} 
                alt="Profile"
                onError={(e) => {
                  console.error('Profile image failed to load:', e.target.src);
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
                onLoad={() => {
                  console.log('✓ Profile image loaded successfully');
                }}
              />
            ) : null}
            <div className="avatar-placeholder" style={{display: user.profileImage ? 'none' : 'flex'}}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
          </div>
          <h2 className="studio-title">Your Studio</h2>
          <p className="user-name">{user.name}</p>
        </div>

        {/* Navigation Menu */}
        <nav className="nav-menu">
          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
            <span>Dashboard</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'assets' ? 'active' : ''}`}
            onClick={() => setActiveTab('assets')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
            </svg>
            <span>Assets</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
            </svg>
            <span>Analytics</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'copyright' ? 'active' : ''}`}
            onClick={() => setActiveTab('copyright')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>Copyright</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'earn' ? 'active' : ''}`}
            onClick={() => setActiveTab('earn')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
            </svg>
            <span>Earn</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'setting' ? 'active' : ''}`}
            onClick={() => setActiveTab('setting')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
            </svg>
            <span>Setting</span>
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      {renderContent()}
    </div>
  );
};

// Assets component
const Assets = () => {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadedAssets, setUploadedAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingAssets, setFetchingAssets] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    category: '',
    width: '',
    height: '',
    credit: false,
    formats: {
      jpg: false,
      png: false,
      psd: false,
      pdf: false
    }
  });
  const [coverImages, setCoverImages] = useState([]);
  const [mainFile, setMainFile] = useState(null);

  // Fetch assets on component mount
  React.useEffect(() => {
    const testUploadsEndpoint = async () => {
      try {
        // Test if uploads endpoint is accessible
        const testResponse = await fetch('https://graphykon.com/uploads/', {
          method: 'HEAD',
          mode: 'cors'
        });
        console.log('Uploads endpoint test:', testResponse.status);
      } catch (error) {
        console.error('Uploads endpoint test failed:', error);
      }
    };

    const fetchAssets = async () => {
      try {
        setFetchingAssets(true);
        
        // Test uploads endpoint first
        await testUploadsEndpoint();
        
        const response = await api.get('/assets');
        console.log('=== ASSETS FETCH RESPONSE ===');
        console.log('Response data:', response.data);
        console.log('Assets array:', response.data.assets);
        console.log('Assets count:', response.data.assets?.length || 0);
        
        if (response.data.assets && response.data.assets.length > 0) {
          console.log('=== FIRST ASSET DETAILS ===');
          console.log('Full asset:', response.data.assets[0]);
          console.log('Cover images:', response.data.assets[0].coverImages);
          if (response.data.assets[0].coverImages && response.data.assets[0].coverImages.length > 0) {
            console.log('First cover image:', response.data.assets[0].coverImages[0]);
            console.log('Constructed URL:', getImageUrl(response.data.assets[0].coverImages[0].filename));
          }
          console.log('===========================');
        }
        console.log('=============================');
        
        // Debug each asset
        if (response.data.assets) {
          response.data.assets.forEach((asset, index) => {
            console.log(`Asset ${index + 1}: ${asset.title}`);
            console.log('- Cover Images:', asset.coverImages);
            console.log('- Cover Images Length:', asset.coverImages?.length || 0);
            if (asset.coverImages && asset.coverImages.length > 0) {
              console.log('- First Cover Image Filename:', asset.coverImages[0].filename);
              console.log('- Constructed URL:', getImageUrl(asset.coverImages[0].filename));
            } else {
              console.log('- No cover images found, will show placeholder');
            }
          });
        }
        
        setUploadedAssets(response.data.assets);
      } catch (error) {
        console.error('Error fetching assets:', error);
      } finally {
        setFetchingAssets(false);
      }
    };

    fetchAssets();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormatChange = (format) => {
    setFormData(prev => ({
      ...prev,
      formats: {
        ...prev.formats,
        [format]: !prev.formats[format]
      }
    }));
  };

  const handleCreditChange = () => {
    setFormData(prev => ({
      ...prev,
      credit: !prev.credit
    }));
  };

  const handleCoverImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length <= 4) {
      setCoverImages(files);
    } else {
      alert('Maximum 4 cover images allowed');
    }
  };

  const handleMainFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 500 * 1024 * 1024; // 500MB in bytes
      if (file.size > maxSize) {
        alert('File size must be less than 500MB');
        e.target.value = '';
        return;
      }
      setMainFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }
    
    if (!formData.description.trim()) {
      alert('Description is required');
      return;
    }
    
    if (!formData.tags.trim()) {
      alert('Tags are required');
      return;
    }
    
    if (!formData.category) {
      alert('Category is required');
      return;
    }
    
    if (!formData.width.trim()) {
      alert('Width is required');
      return;
    }
    
    if (!formData.height.trim()) {
      alert('Height is required');
      return;
    }
    
    if (!mainFile) {
      alert('Main file is required');
      return;
    }
    
    if (coverImages.length === 0) {
      alert('At least one cover image is required');
      return;
    }
    
    // Check if at least one format is selected
    const hasFormat = Object.values(formData.formats).some(format => format);
    if (!hasFormat) {
      alert('At least one format must be selected');
      return;
    }
    
    try {
      setLoading(true);
      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add text fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('tags', formData.tags);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('width', formData.width);
      formDataToSend.append('height', formData.height);
      formDataToSend.append('credit', formData.credit);
      formDataToSend.append('formats.jpg', formData.formats.jpg);
      formDataToSend.append('formats.png', formData.formats.png);
      formDataToSend.append('formats.psd', formData.formats.psd);
      formDataToSend.append('formats.pdf', formData.formats.pdf);
      
      // Add files
      if (mainFile) {
        formDataToSend.append('mainFile', mainFile);
      }
      
      coverImages.forEach(image => {
        formDataToSend.append('coverImages', image);
      });
      
      // Upload to backend
      const response = await api.post('/assets/upload', formDataToSend);
      
      // Add to uploaded assets
      setUploadedAssets(prev => [response.data.asset, ...prev]);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        tags: '',
        category: '',
        width: '',
        height: '',
        credit: false,
        formats: {
          jpg: false,
          png: false,
          psd: false,
          pdf: false
        }
      });
      setCoverImages([]);
      setMainFile(null);
      setShowUploadForm(false);
      
      alert('Asset uploaded successfully!');
      
    } catch (error) {
      console.error('Upload error:', error);
      
      if (error.response?.data?.errors) {
        // Show validation errors
        const errorMessages = error.response.data.errors.map(err => `${err.param}: ${err.msg}`).join('\n');
        alert(`Validation errors:\n${errorMessages}`);
      } else {
        alert(error.response?.data?.message || 'Failed to upload asset');
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="studio-content-page">
      {!showUploadForm && (
        <div className="studio-content-header">
          <div className="content-title-section">
            <h1>Studio Content</h1>
            <span className="assets-count">{uploadedAssets.length} Assets Uploaded</span>
          </div>
          <div className="header-actions">
            <div className="search-container">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search Graphykon..."
                className="search-input"
              />
            </div>

            <button 
              className="Upload_button"
              onClick={() => setShowUploadForm(true)}
            >
              Upload
              <MdOutlineFileUpload />
            </button>
          </div>
        </div>
      )}

      {/* Upload Form Inline */}
      {showUploadForm && (
        <div className="upload-form-container">
          <div className="form-header">
            <h2>Upload New Asset</h2>
            <div className="form-header-actions">
              <button 
                className="upload-asset-btn"
                onClick={() => setShowUploadForm(true)}
              >
                Upload Now
              </button>
              <button 
                className="cancel-btn"
                onClick={() => setShowUploadForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="upload-form-layout">
            <form onSubmit={handleSubmit} className="upload-form">
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter asset title"
                  required
                />
                <small>Used as the page title for SEO</small>
              </div>

              <div className="form-group">
                <label htmlFor="mainFile">Main File * (Max 500MB)</label>
                <input
                  type="file"
                  id="mainFile"
                  accept=".jpg,.jpeg,.png,.psd,.pdf,.ai,.eps,.svg,.zip,.rar"
                  onChange={handleMainFileChange}
                  required
                />
                <small>Main asset file (JPG, PNG, PSD, PDF, AI, EPS, SVG, ZIP, RAR)</small>
              </div>

              <div className="form-group">
                <label htmlFor="coverImages">Cover Images * (Max 4)</label>
                <input
                  type="file"
                  id="coverImages"
                  accept="image/*"
                  multiple
                  onChange={handleCoverImagesChange}
                  required
                />
                <small>Main images of the asset (select multiple images)</small>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter asset description"
                  rows="3"
                  required
                />
                <small>Used as meta description for SEO</small>
              </div>

              <div className="form-group">
                <label htmlFor="tags">Tags / Keywords *</label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="Enter tags separated by commas"
                  required
                />
                <small>For better search and SEO</small>
              </div>

              <div className="form-group">
                <label htmlFor="category">Category / Type *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a category</option>
                  <option value="Logo">Logo</option>
                  <option value="UI Kit">UI Kit</option>
                  <option value="Illustration">Illustration</option>
                  <option value="Icon Set">Icon Set</option>
                  <option value="Template">Template</option>
                  <option value="Mockup">Mockup</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Asset Dimension *</label>
                <div className="dimension-inputs">
                  <div className="dimension-input">
                    <input
                      type="text"
                      id="width"
                      name="width"
                      value={formData.width}
                      onChange={handleInputChange}
                      placeholder="Width (e.g., 4000px)"
                      required
                    />
                  </div>
                  <div className="dimension-input">
                    <input
                      type="text"
                      id="height"
                      name="height"
                      value={formData.height}
                      onChange={handleInputChange}
                      placeholder="Height (e.g., 4000px)"
                      required
                    />
                  </div>
                </div>
                <small>Enter the width and height of your asset</small>
              </div>



              <div className="form-group">
                <label>Available Formats *</label>
                <div className="format-options">
                  {Object.entries(formData.formats).map(([format, checked]) => (
                    <label key={format} className="format-option">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleFormatChange(format)}
                      />
                      <span>{format.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
                <small>Select at least one format</small>
              </div>

              <div className="form-group">
                <label>Credit Requirement</label>
                <div className="credit-option">
                  <label className="credit-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.credit}
                      onChange={handleCreditChange}
                    />
                    <span>Credit Required</span>
                  </label>
                </div>
                <small>Check if attribution is required when using this asset</small>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Uploading...' : 'Upload Asset'}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowUploadForm(false)}
                >
                  Cancel
                </button>
              </div>

            </form>

            {/* Preview Section */}
            <div className="upload-preview">
              <h3>Preview</h3>
              <div className="preview-content">


                {/* Cover Images Preview */}
                {coverImages.length > 0 && (
                  <div className="preview-cover-images">
                    {coverImages.map((file, index) => (
                      <div key={index} className="preview-cover-image">
                        <img src={URL.createObjectURL(file)} alt={`Cover ${index + 1}`} />
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Title */}
                {formData.title && (
                  <h2 className="preview-title">{formData.title}</h2>
                )}
                
                {/* Description */}
                {formData.description && (
                  <p className="preview-description">{formData.description}</p>
                )}
                
                {/* Tags */}
                {formData.tags && (
                  <div className="preview-tags">
                    {formData.tags.split(',').map((tag, index) => (
                      <span key={index} className="preview-tag">{tag.trim()}</span>
                    ))}
                  </div>
                )}
                
                {/* Technical Details */}
                <div className="preview-details">
                  <div className="preview-details-left">
                    <div className="preview-detail-item">
                      <span className="detail-label">Format:</span>
                      <span className="detail-value">
                        {Object.entries(formData.formats)
                          .filter(([_, available]) => available)
                          .map(([format, _]) => format.toUpperCase())
                          .join(', ')}
                      </span>
                    </div>
                    <div className="preview-detail-item">
                      <span className="detail-label">Dimension:</span>
                      <span className="detail-value">
                        {formData.width && formData.height 
                          ? `${formData.width} x ${formData.height}` 
                          : 'Not specified'}
                      </span>
                    </div>
                    <div className="preview-detail-item">
                      <span className="detail-label">File Size:</span>
                      <span className="detail-value">
                        {mainFile ? `${(mainFile.size / (1024 * 1024)).toFixed(2)} MB` : '0 MB'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="preview-details-right">
                    <div className="preview-detail-item">
                      <span className="detail-label">Category:</span>
                      <span className="detail-value">{formData.category}</span>
                    </div>
                    <div className="preview-detail-item">
                      <span className="detail-label">Created:</span>
                      <span className="detail-value">{new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                    </div>
                    <div className="preview-detail-item">
                      <span className="detail-label">Credit:</span>
                      <span className="detail-value">{formData.credit ? 'Required' : 'Not-Required'}</span>
                    </div>
                  </div>
                </div>
                

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assets Table Display */}
      {!showUploadForm && (
        <div className="assets-table-container">
          {fetchingAssets ? (
            <div className="assets-loading-container">
              <SkeletonLoader type="assets-page" />
            </div>
          ) : uploadedAssets.length === 0 ? (
            <div className="empty-state">
              <h3>No Assets Uploaded Yet</h3>
              <p>Start by uploading your first asset to showcase your work.</p>
            </div>
          ) : (
            <>
              <div className="table-header">
                <div className="table-row header-row">
                  <div className="table-cell checkbox-cell">
                    <input type="checkbox" className="select-all-checkbox" />
                  </div>
                  <div className="table-cell asset-cell">Assets</div>
                  <div className="table-cell date-cell">Date</div>
                  <div className="table-cell visibility-cell">Visibility</div>
                  <div className="table-cell monetization-cell">Monetization</div>
                  <div className="table-cell restrictions-cell">Restrictions</div>
                  <div className="table-cell impressions-cell">Impressions</div>
                </div>
              </div>
              
              <div className="table-body">
                {uploadedAssets.map(asset => (
                  <div key={asset.id} className="table-row asset-row">
                    <div className="table-cell checkbox-cell">
                      <input type="checkbox" className="asset-checkbox" />
                    </div>
                    
                    <div className="table-cell asset-cell">
                      <div className="asset-content">
                        <AssetThumbnail asset={asset} />
                        
                        <div className="asset-details">
                          <h3 className="asset-title">{asset.title}</h3>
                          <p className="asset-description-short">{asset.description}</p>
                          <div className="asset-stats">
                            <span className="download-stat">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                              </svg>
                              10,000
                            </span>
                            <span className="view-stat">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                              </svg>
                              1,000
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="table-cell date-cell">
                      <span className="date-text">{new Date(asset.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    
                    <div className="table-cell visibility-cell">
                      <div className="visibility-status public">
                        <div className="status-dot"></div>
                        <span>Public</span>
                      </div>
                    </div>
                    
                    <div className="table-cell monetization-cell">
                      <div className="monetization-value">
                        <span className="currency-symbol">₹</span>
                        <span className="amount">10,000</span>
                      </div>
                    </div>
                    
                    <div className="table-cell restrictions-cell">
                      <span className="restrictions-text">None</span>
                    </div>
                    
                    <div className="table-cell impressions-cell">
                      <span className="impressions-count">50,000</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Analytics component
const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalAssets: 0,
      totalViews: 0,
      totalDownloads: 0,
      totalEarnings: 0,
      followers: 0
    },
    recentActivity: [],
    topAssets: [],
    monthlyStats: [],
    categoryBreakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, 1y

  // Fetch analytics data
  React.useEffect(() => {
    const fetchAnalytics = async () => {
      const timeoutId = setTimeout(() => {
        setLoading(false);
        setError('Request timed out. Please try refreshing.');
      }, 10000); // 10 second timeout

      try {
        setLoading(true);
        setError(null);
        
        // Fetch all analytics data in parallel
        const [overviewRes, monthlyRes, topAssetsRes, categoryRes, activityRes] = await Promise.all([
          api.get(`/analytics/overview?timeRange=${timeRange}`),
          api.get('/analytics/monthly'),
          api.get(`/analytics/top-assets?timeRange=${timeRange}&limit=4`),
          api.get(`/analytics/category-breakdown?timeRange=${timeRange}`),
          api.get('/analytics/recent-activity?limit=4')
        ]);

        clearTimeout(timeoutId);

        setAnalyticsData({
          overview: overviewRes.data.overview || {
            totalAssets: 0,
            totalViews: 0,
            totalDownloads: 0,
            totalEarnings: 0,
            followers: 0
          },
          changes: overviewRes.data.changes || {},
          monthlyStats: monthlyRes.data.monthlyStats || [],
          topAssets: topAssetsRes.data.topAssets || [],
          categoryBreakdown: categoryRes.data.categoryBreakdown || [],
          recentActivity: activityRes.data.recentActivity || []
        });

        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching analytics:', error);
        
        // Better error messages based on error type
        let errorMessage = 'Failed to load analytics data';
        if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
          errorMessage = 'Unable to connect to analytics service. Please check your connection.';
        } else if (error.response?.status === 404) {
          errorMessage = 'Analytics service not available. Showing empty data.';
        } else if (error.response?.status === 401) {
          errorMessage = 'Authentication required. Please login again.';
        } else if (error.response?.status >= 500) {
          errorMessage = 'Analytics service temporarily unavailable. Please try again later.';
        }
        
        setError(errorMessage);
        
        // Set empty state data on error (could add demo data here if needed)
        setAnalyticsData({
          overview: {
            totalAssets: 0,
            totalViews: 0,
            totalDownloads: 0,
            totalEarnings: 0,
            followers: 0
          },
          changes: {},
          monthlyStats: [],
          topAssets: [],
          categoryBreakdown: [],
          recentActivity: []
        });
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchAnalytics();
  }, [timeRange]);

  // Manual refresh function
  const handleRefresh = () => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [overviewRes, monthlyRes, topAssetsRes, categoryRes, activityRes] = await Promise.all([
          api.get(`/analytics/overview?timeRange=${timeRange}`),
          api.get('/analytics/monthly'),
          api.get(`/analytics/top-assets?timeRange=${timeRange}&limit=4`),
          api.get(`/analytics/category-breakdown?timeRange=${timeRange}`),
          api.get('/analytics/recent-activity?limit=4')
        ]);

        setAnalyticsData({
          overview: overviewRes.data.overview || {
            totalAssets: 0,
            totalViews: 0,
            totalDownloads: 0,
            totalEarnings: 0,
            followers: 0
          },
          changes: overviewRes.data.changes || {},
          monthlyStats: monthlyRes.data.monthlyStats || [],
          topAssets: topAssetsRes.data.topAssets || [],
          categoryBreakdown: categoryRes.data.categoryBreakdown || [],
          recentActivity: activityRes.data.recentActivity || []
        });

        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setError(error.response?.data?.message || 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  };

  if (loading) {
    return <SkeletonLoader type="analytics-page" />;
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div className="analytics-title-section">
          <h1>Analytics</h1>
          {lastUpdated && (
            <span className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="analytics-controls">
          <button 
            onClick={handleRefresh}
            className="refresh-btn"
            disabled={loading}
            title="Refresh analytics data"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <div className="time-range-selector">
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="analytics-error">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <h3>Unable to load analytics</h3>
            <p>{error}</p>
            <button onClick={handleRefresh} className="retry-btn">
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="analytics-overview">
        <div className="overview-card">
          <div className="overview-icon">📊</div>
          <div className="overview-content">
            <h3>Total Assets</h3>
            <p className="overview-value">
              {analyticsData.overview.totalAssets > 0 ? analyticsData.overview.totalAssets : 'No data'}
            </p>
            <span className="overview-change positive">+2 this month</span>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-icon">👁️</div>
          <div className="overview-content">
            <h3>Total Views</h3>
            <p className="overview-value">
              {analyticsData.overview.totalViews > 0 ? analyticsData.overview.totalViews.toLocaleString() : 'No data'}
            </p>
            <span className={`overview-change ${analyticsData.changes?.views >= 0 ? 'positive' : 'negative'}`}>
              {analyticsData.changes?.views >= 0 ? '+' : ''}{analyticsData.changes?.views || 0}% vs last period
            </span>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-icon">⬇️</div>
          <div className="overview-content">
            <h3>Total Downloads</h3>
            <p className="overview-value">
              {analyticsData.overview.totalDownloads > 0 ? analyticsData.overview.totalDownloads.toLocaleString() : 'No data'}
            </p>
            <span className={`overview-change ${analyticsData.changes?.downloads >= 0 ? 'positive' : 'negative'}`}>
              {analyticsData.changes?.downloads >= 0 ? '+' : ''}{analyticsData.changes?.downloads || 0}% vs last period
            </span>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-icon">💰</div>
          <div className="overview-content">
            <h3>Total Earnings</h3>
            <p className="overview-value">
              {analyticsData.overview.totalEarnings > 0 ? `$${analyticsData.overview.totalEarnings.toFixed(2)}` : 'No data'}
            </p>
            <span className={`overview-change ${analyticsData.changes?.earnings >= 0 ? 'positive' : 'negative'}`}>
              {analyticsData.changes?.earnings >= 0 ? '+' : ''}{analyticsData.changes?.earnings || 0}% vs last period
            </span>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-icon">👥</div>
          <div className="overview-content">
            <h3>Followers</h3>
            <p className="overview-value">
              {analyticsData.overview.followers > 0 ? analyticsData.overview.followers : 'No data'}
            </p>
            <span className={`overview-change ${analyticsData.changes?.followers >= 0 ? 'positive' : 'negative'}`}>
              {analyticsData.changes?.followers >= 0 ? '+' : ''}{analyticsData.changes?.followers || 0} this period
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="analytics-charts">
        <div className="chart-container">
          <h3>Monthly Performance</h3>
          {analyticsData.monthlyStats && analyticsData.monthlyStats.length > 0 ? (
            <div className="chart">
              <svg width="100%" height="300" viewBox="0 0 800 300">
                {/* Grid lines */}
                <defs>
                  <pattern id="chartGrid" width="100" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 100 0 L 0 0 0 50" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
                  </pattern>
                </defs>
                
                <rect width="100%" height="100%" fill="url(#chartGrid)" />
                
                {/* X-axis labels */}
                {analyticsData.monthlyStats.map((stat, index) => (
                  <text 
                    key={index}
                    x={100 + index * 100} 
                    y="290" 
                    textAnchor="middle" 
                    fontSize="12" 
                    fill="#666"
                  >
                    {stat.month}
                  </text>
                ))}
                
                {/* Views line */}
                {analyticsData.monthlyStats.length > 1 && (
                  <path 
                    d={`M ${analyticsData.monthlyStats.map((stat, index) => 
                      `${100 + index * 100},${300 - Math.min((stat.views || 0) / 25, 250)}`
                    ).join(' L ')}`}
                    stroke="#007bff" 
                    strokeWidth="3" 
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                
                {/* Downloads line */}
                {analyticsData.monthlyStats.length > 1 && (
                  <path 
                    d={`M ${analyticsData.monthlyStats.map((stat, index) => 
                      `${100 + index * 100},${300 - Math.min((stat.downloads || 0) * 2, 250)}`
                    ).join(' L ')}`}
                    stroke="#28a745" 
                    strokeWidth="3" 
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                
                {/* Data points */}
                {analyticsData.monthlyStats.map((stat, index) => (
                  <g key={index}>
                    <circle 
                      cx={100 + index * 100} 
                      cy={300 - Math.min((stat.views || 0) / 25, 250)} 
                      r="4" 
                      fill="#007bff"
                    />
                    <circle 
                      cx={100 + index * 100} 
                      cy={300 - Math.min((stat.downloads || 0) * 2, 250)} 
                      r="4" 
                      fill="#28a745"
                    />
                  </g>
                ))}
                
                {/* Legend */}
                <circle cx="50" cy="50" r="5" fill="#007bff"/>
                <text x="65" y="55" fontSize="12" fill="#333">Views</text>
                <circle cx="50" cy="80" r="5" fill="#28a745"/>
                <text x="65" y="85" fontSize="12" fill="#333">Downloads</text>
              </svg>
            </div>
          ) : (
            <div className="chart-empty-state">
              <div className="empty-chart-icon">📊</div>
              <h4>No data available</h4>
              <p>Chart will appear when you have data for the selected time period.</p>
            </div>
          )}
        </div>

        <div className="chart-container">
          <h3>Category Performance</h3>
          {analyticsData.categoryBreakdown && analyticsData.categoryBreakdown.length > 0 ? (
            <div className="category-chart">
              {analyticsData.categoryBreakdown.map((category, index) => {
                const maxViews = Math.max(...analyticsData.categoryBreakdown.map(c => c.views || 0));
                const progressWidth = maxViews > 0 ? ((category.views || 0) / maxViews) * 100 : 0;
                
                return (
                  <div key={index} className="category-bar">
                    <div className="category-info">
                      <span className="category-name">{category.category}</span>
                      <span className="category-stats">
                        {(category.views || 0).toLocaleString()} views • {(category.downloads || 0).toLocaleString()} downloads
                      </span>
                    </div>
                    <div className="category-progress">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${progressWidth}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="chart-empty-state">
              <div className="empty-chart-icon">📈</div>
              <h4>No category data</h4>
              <p>Category breakdown will appear when you have uploaded assets.</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Assets and Recent Activity */}
      <div className="analytics-details">
        <div className="top-assets">
          <h3>Top Performing Assets</h3>
          {analyticsData.topAssets && analyticsData.topAssets.length > 0 ? (
            <div className="assets-list">
              {analyticsData.topAssets.map((asset, index) => (
                <div key={asset.id} className="asset-item">
                  <div className="asset-rank">#{index + 1}</div>
                  <div className="asset-info">
                    <h4>{asset.title}</h4>
                    <div className="asset-stats">
                      <span className="stat-item">
                        <span className="stat-icon">👁️</span>
                        {(asset.views || 0).toLocaleString()} views
                      </span>
                      <span className="stat-item">
                        <span className="stat-icon">⬇️</span>
                        {(asset.downloads || 0).toLocaleString()} downloads
                      </span>
                      <span className="stat-item">
                        <span className="stat-icon">💰</span>
                        ${(asset.earnings || 0).toFixed(2)} earned
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="analytics-empty-state">
              <div className="empty-icon">🏆</div>
              <h4>No top assets yet</h4>
              <p>Your top performing assets will appear here once you have some views and downloads.</p>
            </div>
          )}
        </div>

        <div className="recent-activity">
          <h3>Recent Activity</h3>
          {analyticsData.recentActivity && analyticsData.recentActivity.length > 0 ? (
            <div className="activity-list">
              {analyticsData.recentActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className={`activity-icon ${activity.type}`}>
                    {activity.type === 'download' ? '⬇️' : '👁️'}
                  </div>
                  <div className="activity-content">
                    <p>
                      <strong>{activity.user}</strong> {activity.type === 'download' ? 'downloaded' : 'viewed'} 
                      <strong> {activity.asset}</strong>
                    </p>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="analytics-empty-state">
              <div className="empty-icon">📱</div>
              <h4>No recent activity</h4>
              <p>Recent views and downloads will appear here as users interact with your assets.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// UserSettings component
const UserSettings = () => {
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Simulate loading for settings page
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: name === 'username' ? value.toLowerCase() : value
    }));
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        alert('Profile image must be less than 5MB');
        e.target.value = '';
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        e.target.value = '';
        return;
      }
      
      setProfileImage(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      console.log('Starting profile update...');
      console.log('Profile data:', profileData);
      console.log('Profile image:', profileImage);
      
      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add text fields - always send required fields, only send optional fields if they have values
      formDataToSend.append('name', profileData.name || '');
      formDataToSend.append('username', profileData.username || '');
      formDataToSend.append('email', profileData.email || '');
      
      // Add optional fields only if they have values
      if (profileData.phone) {
        formDataToSend.append('phone', profileData.phone);
      }
      if (profileData.location) {
        formDataToSend.append('location', profileData.location);
      }
      if (profileData.bio) {
        formDataToSend.append('bio', profileData.bio);
      }
      
      console.log('Form data being sent:', {
        name: profileData.name || '',
        username: profileData.username || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        location: profileData.location || '',
        bio: profileData.bio || ''
      });
      
      // Add profile image if selected
      if (profileImage) {
        formDataToSend.append('profileImage', profileImage);
        console.log('Added profile image:', profileImage.name);
      }
      
      console.log('Making API call to /auth/profile...');
      
      // Make API call to update profile
      const response = await api.put('/auth/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('API response:', response.data);
      
      // Update user data in context
      updateUser(response.data.user);
      
      setIsEditing(false);
      setProfileImage(null);
      
      console.log('Profile update successful!');
      
    } catch (error) {
      console.error('Profile update error details:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      alert(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setProfileData({
      name: user?.name || '',
      username: user?.username || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.location || '',
      bio: user?.bio || ''
    });
    setProfileImage(null);
    setIsEditing(false);
  };

  const handleDeleteProfileImage = async () => {
    if (!window.confirm('Are you sure you want to remove your profile image?')) {
      return;
    }

    try {
      const response = await api.delete('/auth/profile-image');
      
      // Update user data in context
      updateUser(response.data.user);
      
      alert('Profile image removed successfully!');
      
    } catch (error) {
      console.error('Profile image deletion error:', error);
      alert(error.response?.data?.message || 'Failed to remove profile image');
    }
  };

  if (loading) {
    return <SkeletonLoader type="settings-page" />;
  }

  return (
    <div className="user-settings">
      <div className="settings-header">
        <h1>User Settings</h1>
        <div className="settings-actions">
          {!isEditing ? (
            <button 
              className="edit-btn"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          ) : (
            <div className="edit-actions">
              <button 
                className="cancel-btn"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                className="save-btn"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="settings-content">
        <div className="profile-section">
          <div className="profile-image-section">
            <div className="profile-image-container">
              {(profileImage ? URL.createObjectURL(profileImage) : user?.profileImage) ? (
                <img 
                  src={profileImage ? URL.createObjectURL(profileImage) : getProfileImageUrl(user.profileImage)} 
                  alt="Profile" 
                  className="profile-image"
                  onError={(e) => {
                    console.error('Settings profile image failed to load:', e.target.src);
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                  onLoad={() => {
                    console.log('✓ Settings profile image loaded successfully');
                  }}
                />
              ) : null}
              <div className="profile-image-placeholder" style={{display: (profileImage || user?.profileImage) ? 'none' : 'flex'}}>
                <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              {isEditing && (
                <>
                  <div className="image-upload-overlay">
                    <label htmlFor="profileImageUpload" className="upload-label">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 7v2.99s-1.99.01-2 0V7h-3s.01-1.99 0-2h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z"/>
                      </svg>
                      Change Photo
                    </label>

                    <input
                      type="file"
                      id="profileImageUpload"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                  {user?.profileImage && (
                    <button 
                      className="delete-profile-image-btn"
                      onClick={handleDeleteProfileImage}
                      title="Remove profile image"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <form onSubmit={handleSave} className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profileData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="username">Username *</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={profileData.username}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={profileData.location}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="City, Country"
              />
            </div>

            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={profileData.bio}
                onChange={handleInputChange}
                disabled={!isEditing}
                rows="4"
                placeholder="Tell us about yourself..."
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Studio; 