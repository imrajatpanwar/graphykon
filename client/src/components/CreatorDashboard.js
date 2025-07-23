import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './CreatorDashboard.css';

const CreatorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Redirect if not a creator
  React.useEffect(() => {
    if (user && !user.creator) {
      navigate('/be-a-creator');
    }
  }, [user, navigate]);

  if (!user || !user.creator) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'assets':
        return <Assets />;
      case 'analytics':
        return <div className="tab-content"><h2>Analytics</h2><p>Analytics content coming soon...</p></div>;
      case 'copyright':
        return <div className="tab-content"><h2>Copyright</h2><p>Copyright content coming soon...</p></div>;
      case 'earn':
        return <div className="tab-content"><h2>Earn</h2><p>Earnings content coming soon...</p></div>;
      case 'setting':
        return <div className="tab-content"><h2>Settings</h2><p>Settings content coming soon...</p></div>;
      default:
        return (
          <div className="main-content">
            <div className="content-header">
              <h1>Studio Dashboard</h1>
            </div>

            <div className="dashboard-grid">
              {/* Studio Analytics Card */}
              <div className="card analytics-card">
                <h3>Studio Analytics</h3>
                <div className="metric">
                  <span className="metric-label">Current Followers</span>
                  <span className="metric-value">0</span>
                </div>
              </div>

              {/* Overall Growth Card */}
              <div className="card growth-card">
                <h3>Overall Growth</h3>
                <div className="chart-container">
                  <svg width="100%" height="140" viewBox="0 0 400 140">
                    {/* Grid lines */}
                    <defs>
                      <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    
                    {/* Background grid */}
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    {/* Month labels */}
                    <text x="20" y="130" textAnchor="middle" fontSize="10" fill="#666">Jan</text>
                    <text x="53" y="130" textAnchor="middle" fontSize="10" fill="#666">Feb</text>
                    <text x="86" y="130" textAnchor="middle" fontSize="10" fill="#666">Mar</text>
                    <text x="119" y="130" textAnchor="middle" fontSize="10" fill="#666">Apr</text>
                    <text x="152" y="130" textAnchor="middle" fontSize="10" fill="#666">May</text>
                    <text x="185" y="130" textAnchor="middle" fontSize="10" fill="#666">Jun</text>
                    <text x="218" y="130" textAnchor="middle" fontSize="10" fill="#666">Jul</text>
                    <text x="251" y="130" textAnchor="middle" fontSize="10" fill="#666">Aug</text>
                    <text x="284" y="130" textAnchor="middle" fontSize="10" fill="#666">Sep</text>
                    <text x="317" y="130" textAnchor="middle" fontSize="10" fill="#666">Oct</text>
                    <text x="350" y="130" textAnchor="middle" fontSize="10" fill="#666">Nov</text>
                    <text x="383" y="130" textAnchor="middle" fontSize="10" fill="#666">Dec</text>
                    
                    {/* Growth line with hill and valley pattern */}
                    <path 
                      d="M20,100 L53,80 L86,60 L119,40 L152,25 L185,15 L218,10 L251,25 L284,50 L317,80 L350,60 L383,35" 
                      stroke="#007bff" 
                      strokeWidth="3" 
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* Gradient fill under the line */}
                    <path 
                      d="M20,100 L53,80 L86,60 L119,40 L152,25 L185,15 L218,10 L251,25 L284,50 L317,80 L350,60 L383,35 L383,120 L20,120 Z" 
                      fill="url(#areaGradient)" 
                      opacity="0.1"
                    />
                    
                    {/* Gradient definition */}
                    <defs>
                      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#007bff" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#007bff" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* Summary Card */}
              <div className="card summary-card">
                <h3>Summary</h3>
                <p className="summary-subtitle">Last 28 days</p>
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
                </div>
              </div>

              {/* Call to Action Card */}
              <div className="card cta-card">
                <h3>Get Started</h3>
                <p>Want to see metrics on your recent Assets? Upload and Publish a New Asset to get Started.</p>
                <button className="upload-btn" onClick={() => setActiveTab('assets')}>
                  Upload Assets
                </button>
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
              <img src={user.profileImage} alt="Profile" />
            ) : (
              <div className="avatar-placeholder">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            )}
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

// Import Assets component
const Assets = () => {
  const { user } = useAuth();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadedAssets, setUploadedAssets] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    category: '',
    formats: {
      jpg: false,
      png: false,
      psd: false,
      pdf: false
    }
  });
  const [coverImage, setCoverImage] = useState(null);
  const [showcaseImages, setShowcaseImages] = useState([]);

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

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
    }
  };

  const handleShowcaseImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length <= 4) {
      setShowcaseImages(files);
    } else {
      alert('Maximum 4 showcase images allowed');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create new asset object
    const newAsset = {
      id: Date.now(),
      ...formData,
      coverImage: coverImage ? URL.createObjectURL(coverImage) : null,
      showcaseImages: showcaseImages.map(file => URL.createObjectURL(file)),
      uploadDate: new Date().toISOString(),
      status: 'published'
    };

    // Add to uploaded assets
    setUploadedAssets(prev => [newAsset, ...prev]);

    // Reset form
    setFormData({
      title: '',
      description: '',
      tags: '',
      category: '',
      formats: {
        jpg: false,
        png: false,
        psd: false,
        pdf: false
      }
    });
    setCoverImage(null);
    setShowcaseImages([]);
    setShowUploadForm(false);
  };

  const isFormValid = () => {
    return (
      formData.title.trim() &&
      formData.description.trim() &&
      formData.tags.trim() &&
      formData.category.trim() &&
      coverImage &&
      Object.values(formData.formats).some(format => format)
    );
  };

  return (
    <div className="assets-page">
      <div className="assets-header">
        <h1>Assets</h1>
        <button 
          className="upload-asset-btn"
          onClick={() => setShowUploadForm(true)}
        >
          Upload Asset
        </button>
      </div>

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="modal-overlay">
          <div className="upload-modal">
            <div className="modal-header">
              <h2>Upload New Asset</h2>
              <button 
                className="close-btn"
                onClick={() => setShowUploadForm(false)}
              >
                ×
              </button>
            </div>

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
                <label htmlFor="coverImage">Cover Image *</label>
                <input
                  type="file"
                  id="coverImage"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  required
                />
                <small>Main thumbnail of the asset</small>
                {coverImage && (
                  <div className="image-preview">
                    <img src={URL.createObjectURL(coverImage)} alt="Cover preview" />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="showcaseImages">Showcase Images (Max 4)</label>
                <input
                  type="file"
                  id="showcaseImages"
                  accept="image/*"
                  multiple
                  onChange={handleShowcaseImagesChange}
                />
                <small>Additional preview images</small>
                {showcaseImages.length > 0 && (
                  <div className="showcase-preview">
                    {showcaseImages.map((file, index) => (
                      <img 
                        key={index} 
                        src={URL.createObjectURL(file)} 
                        alt={`Showcase ${index + 1}`} 
                      />
                    ))}
                  </div>
                )}
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

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowUploadForm(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={!isFormValid()}
                >
                  Upload Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Uploaded Assets Display */}
      <div className="assets-grid">
        {uploadedAssets.length === 0 ? (
          <div className="empty-state">
            <h3>No Assets Uploaded Yet</h3>
            <p>Start by uploading your first asset to showcase your work.</p>
            <button 
              className="upload-first-btn"
              onClick={() => setShowUploadForm(true)}
            >
              Upload Your First Asset
            </button>
          </div>
        ) : (
          uploadedAssets.map(asset => (
            <div key={asset.id} className="asset-card">
              <div className="asset-image">
                {asset.coverImage ? (
                  <img src={asset.coverImage} alt={asset.title} />
                ) : (
                  <div className="asset-placeholder">No Image</div>
                )}
                <div className="asset-overlay">
                  <button className="edit-btn">Edit</button>
                  <button className="delete-btn">Delete</button>
                </div>
              </div>
              <div className="asset-info">
                <h3>{asset.title}</h3>
                <p className="asset-category">{asset.category}</p>
                <p className="asset-description">{asset.description}</p>
                <div className="asset-tags">
                  {asset.tags.split(',').map((tag, index) => (
                    <span key={index} className="tag">{tag.trim()}</span>
                  ))}
                </div>
                <div className="asset-formats">
                  {Object.entries(asset.formats)
                    .filter(([_, available]) => available)
                    .map(([format, _]) => (
                      <span key={format} className="format-badge">{format.toUpperCase()}</span>
                    ))}
                </div>
                <p className="upload-date">
                  Uploaded: {new Date(asset.uploadDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CreatorDashboard; 