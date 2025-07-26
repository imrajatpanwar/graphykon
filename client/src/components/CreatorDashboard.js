import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
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
        return <Analytics />;
      case 'copyright':
        return <div className="tab-content"><h2>Copyright</h2><p>Copyright content coming soon...</p></div>;
      case 'earn':
        return <div className="tab-content"><h2>Earn</h2><p>Earnings content coming soon...</p></div>;
      case 'setting':
        return <UserSettings />;
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
              <img 
                src={user.profileImage.startsWith('data:') ? user.profileImage : `https://graphykon.com${user.profileImage}`} 
                alt="Profile" 
              />
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
    const fetchAssets = async () => {
      try {
        setFetchingAssets(true);
        const response = await api.get('/assets');
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
      const response = await api.post('/assets/upload', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
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
    <div className="assets-page">
      {!showUploadForm && (
        <div className="assets-header">
          <h1>Assets</h1>
          <button 
            className="upload-asset-btn"
            onClick={() => setShowUploadForm(true)}
          >
            Upload Asset
          </button>
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

      {/* Uploaded Assets Display */}
      {!showUploadForm && (
        <div className="assets-grid">
          {fetchingAssets ? (
            <div className="loading-state">
              <h3>Loading Assets...</h3>
              <p>Please wait while we fetch your assets.</p>
            </div>
          ) : uploadedAssets.length === 0 ? (
            <div className="empty-state">
              <h3>No Assets Uploaded Yet</h3>
              <p>Start by uploading your first asset to showcase your work.</p>
            </div>
          ) : (
            uploadedAssets.map(asset => (
              <div key={asset.id} className="asset-card">
                <div className="asset-image">
                  {asset.coverImages && asset.coverImages.length > 0 ? (
                    <img src={`https://graphykon.com/uploads/${asset.coverImages[0].filename}`} alt={asset.title} />
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
                    Uploaded: {new Date(asset.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
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
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, 1y

  // Fetch analytics data
  React.useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // Fetch all analytics data in parallel
        const [overviewRes, monthlyRes, topAssetsRes, categoryRes, activityRes] = await Promise.all([
          api.get(`/analytics/overview?timeRange=${timeRange}`),
          api.get('/analytics/monthly'),
          api.get(`/analytics/top-assets?timeRange=${timeRange}&limit=4`),
          api.get(`/analytics/category-breakdown?timeRange=${timeRange}`),
          api.get('/analytics/recent-activity?limit=4')
        ]);

        setAnalyticsData({
          overview: overviewRes.data.overview,
          changes: overviewRes.data.changes,
          monthlyStats: monthlyRes.data.monthlyStats,
          topAssets: topAssetsRes.data.topAssets,
          categoryBreakdown: categoryRes.data.categoryBreakdown,
          recentActivity: activityRes.data.recentActivity
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
        // Fallback to mock data if API fails
        const mockData = {
          overview: {
            totalAssets: 12,
            totalViews: 2456,
            totalDownloads: 189,
            totalEarnings: 156.78,
            followers: 89
          },
          changes: {
            views: 12,
            downloads: 8,
            earnings: 15,
            followers: 5
          },
          recentActivity: [
            { id: 1, type: 'download', asset: 'Modern Logo Pack', user: 'Designer123', time: '2 hours ago' },
            { id: 2, type: 'view', asset: 'UI Kit Collection', user: 'Anonymous', time: '4 hours ago' },
            { id: 3, type: 'download', asset: 'Icon Set Pro', user: 'CreativeStudio', time: '1 day ago' },
            { id: 4, type: 'view', asset: 'Typography Bundle', user: 'Anonymous', time: '2 days ago' }
          ],
          topAssets: [
            { id: 1, title: 'Modern Logo Pack', views: 456, downloads: 34, earnings: 23.45 },
            { id: 2, title: 'UI Kit Collection', views: 389, downloads: 28, earnings: 19.67 },
            { id: 3, title: 'Icon Set Pro', views: 312, downloads: 22, earnings: 15.89 },
            { id: 4, title: 'Typography Bundle', views: 298, downloads: 19, earnings: 12.34 }
          ],
          monthlyStats: [
            { month: 'Jan', views: 1200, downloads: 89, earnings: 67.45 },
            { month: 'Feb', views: 1450, downloads: 112, earnings: 78.90 },
            { month: 'Mar', views: 1320, downloads: 98, earnings: 71.23 },
            { month: 'Apr', views: 1680, downloads: 134, earnings: 89.67 },
            { month: 'May', views: 1890, downloads: 156, earnings: 102.34 },
            { month: 'Jun', views: 2456, downloads: 189, earnings: 156.78 }
          ],
          categoryBreakdown: [
            { category: 'Logos', assets: 4, views: 890, downloads: 67 },
            { category: 'UI Kits', assets: 3, views: 756, downloads: 54 },
            { category: 'Icons', assets: 2, views: 432, downloads: 31 },
            { category: 'Typography', assets: 2, views: 298, downloads: 19 },
            { category: 'Illustrations', assets: 1, views: 80, downloads: 18 }
          ]
        };
        setAnalyticsData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-header">
          <h1>Analytics</h1>
        </div>
        <div className="loading-state">
          <h3>Loading Analytics...</h3>
          <p>Please wait while we fetch your analytics data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h1>Analytics</h1>
        <div className="time-range-selector">
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="analytics-overview">
        <div className="overview-card">
          <div className="overview-icon">📊</div>
          <div className="overview-content">
            <h3>Total Assets</h3>
            <p className="overview-value">{analyticsData.overview.totalAssets}</p>
            <span className="overview-change positive">+2 this month</span>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-icon">👁️</div>
          <div className="overview-content">
            <h3>Total Views</h3>
            <p className="overview-value">{analyticsData.overview.totalViews.toLocaleString()}</p>
            <span className={`overview-change ${analyticsData.changes?.views >= 0 ? 'positive' : 'negative'}`}>
              {analyticsData.changes?.views >= 0 ? '+' : ''}{analyticsData.changes?.views || 0}% vs last period
            </span>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-icon">⬇️</div>
          <div className="overview-content">
            <h3>Total Downloads</h3>
            <p className="overview-value">{analyticsData.overview.totalDownloads.toLocaleString()}</p>
            <span className={`overview-change ${analyticsData.changes?.downloads >= 0 ? 'positive' : 'negative'}`}>
              {analyticsData.changes?.downloads >= 0 ? '+' : ''}{analyticsData.changes?.downloads || 0}% vs last period
            </span>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-icon">💰</div>
          <div className="overview-content">
            <h3>Total Earnings</h3>
            <p className="overview-value">${analyticsData.overview.totalEarnings.toFixed(2)}</p>
            <span className={`overview-change ${analyticsData.changes?.earnings >= 0 ? 'positive' : 'negative'}`}>
              {analyticsData.changes?.earnings >= 0 ? '+' : ''}{analyticsData.changes?.earnings || 0}% vs last period
            </span>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-icon">👥</div>
          <div className="overview-content">
            <h3>Followers</h3>
            <p className="overview-value">{analyticsData.overview.followers}</p>
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
              <path 
                d={`M ${analyticsData.monthlyStats.map((stat, index) => 
                  `${100 + index * 100},${300 - (stat.views / 25)}`
                ).join(' L ')}`}
                stroke="#007bff" 
                strokeWidth="3" 
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Downloads line */}
              <path 
                d={`M ${analyticsData.monthlyStats.map((stat, index) => 
                  `${100 + index * 100},${300 - (stat.downloads * 2)}`
                ).join(' L ')}`}
                stroke="#28a745" 
                strokeWidth="3" 
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Legend */}
              <circle cx="50" cy="50" r="5" fill="#007bff"/>
              <text x="65" y="55" fontSize="12" fill="#333">Views</text>
              <circle cx="50" cy="80" r="5" fill="#28a745"/>
              <text x="65" y="85" fontSize="12" fill="#333">Downloads</text>
            </svg>
          </div>
        </div>

        <div className="chart-container">
          <h3>Category Performance</h3>
          <div className="category-chart">
            {analyticsData.categoryBreakdown.map((category, index) => (
              <div key={index} className="category-bar">
                <div className="category-info">
                  <span className="category-name">{category.category}</span>
                  <span className="category-stats">
                    {category.views} views • {category.downloads} downloads
                  </span>
                </div>
                <div className="category-progress">
                  <div 
                    className="progress-bar" 
                    style={{ 
                      width: `${(category.views / Math.max(...analyticsData.categoryBreakdown.map(c => c.views))) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Assets and Recent Activity */}
      <div className="analytics-details">
        <div className="top-assets">
          <h3>Top Performing Assets</h3>
          <div className="assets-list">
            {analyticsData.topAssets.map((asset, index) => (
              <div key={asset.id} className="asset-item">
                <div className="asset-rank">#{index + 1}</div>
                <div className="asset-info">
                  <h4>{asset.title}</h4>
                  <div className="asset-stats">
                    <span>{asset.views} views</span>
                    <span>{asset.downloads} downloads</span>
                    <span>${asset.earnings.toFixed(2)} earned</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="recent-activity">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {analyticsData.recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className={`activity-icon ${activity.type}`}>
                  {activity.type === 'download' ? '⬇️' : '👁️'}
                </div>
                <div className="activity-content">
                  <p>
                    <strong>{activity.user}</strong> {activity.type === 'download' ? 'downloaded' : 'viewed'} 
                    <strong>{activity.asset}</strong>
                  </p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
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
      
      // Add text fields
      Object.keys(profileData).forEach(key => {
        if (profileData[key]) {
          formDataToSend.append(key, profileData[key]);
          console.log(`Added field ${key}:`, profileData[key]);
        }
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
                  src={profileImage ? URL.createObjectURL(profileImage) : (user?.profileImage?.startsWith('data:') ? user.profileImage : `https://graphykon.com${user.profileImage}`)} 
                  alt="Profile" 
                  className="profile-image"
                />
              ) : (
                <div className="profile-image-placeholder">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
              {isEditing && (
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

export default CreatorDashboard; 