import React, { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Spinner, Alert, Button, Nav, Form, Modal, Table } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaRegEdit } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { FaCamera } from 'react-icons/fa';
import VerificationTick from '../common/VerificationTick';
import Messages from '../messages/Messages';
import getApiConfig from '../../config/api';
import './CreatorDashboard.css';

const sidebarItems = [
  { label: 'Dashboard', icon: 'bi bi-speedometer2', key: 'dashboard' },
  { label: 'Your Uploads', icon: 'bi bi-cloud-arrow-up', key: 'uploads' },
  { label: 'Upload Asset', icon: 'bi bi-cloud-plus', key: 'upload-asset' },
  { label: 'Analytics & Insights', icon: 'bi bi-bar-chart-line', key: 'analytics' },
  { label: 'Monetization', icon: 'bi bi-currency-dollar', key: 'monetization' },
  { label: 'Messages', icon: 'bi bi-chat-dots', key: 'messages' },
  { label: 'Copyright', icon: 'bi bi-shield-lock', key: 'copyright' },
  { label: 'Notifications', icon: 'bi bi-bell', key: 'notifications' },
  { label: 'Support / Help Center', icon: 'bi bi-question-circle', key: 'support' },
  { label: 'Studio Settings', icon: 'bi bi-gear', key: 'settings' },
];

function CreatorDashboard() {
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState(location.state?.activeSection || 'dashboard');
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState({ displayName: '', username: '', location: '', phoneNumber: '', bio: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [uploadData, setUploadData] = useState({
    title: '',
    category: 'Other',
    coverPage: null,
    showcaseImages: [],
    description: '',
    keywords: '',
    assetFile: null,
    fileSize: '',
    license: 'Free',
    format: [],
    creditRequired: false,
    creditText: ''
  });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [uploadsLoading, setUploadsLoading] = useState(false);
  const [uploadsError, setUploadsError] = useState('');
  const [success, setSuccess] = useState(null);

  const { user, setUser } = useAuth();
  const [editAsset, setEditAsset] = useState(null);
  const [editAssetData, setEditAssetData] = useState({ 
    title: '', 
    category: '', 
    description: '', 
    keywords: '', 
    license: '',
    format: [],
    creditRequired: false,
    creditText: '',
    dimension: { width: 6000, height: 4000 },
    coverPage: null,
    assetFile: null,
    showcaseImages: []
  });
  const [editAssetLoading, setEditAssetLoading] = useState(false);
  const [editAssetError, setEditAssetError] = useState('');
  const [editAssetSuccess, setEditAssetSuccess] = useState('');
  const [showEditAssetModal, setShowEditAssetModal] = useState(false);
  const [deleteAssetId, setDeleteAssetId] = useState(null);
  const [deleteAssetLoading, setDeleteAssetLoading] = useState(false);
  const [deleteAssetError, setDeleteAssetError] = useState('');
  const [followers, setFollowers] = useState([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [coverImage, setCoverImage] = useState(null);
  const [assetCount, setAssetCount] = useState(0);
  const [coverImageUploading, setCoverImageUploading] = useState(false);
  const [coverUploadSuccess, setCoverUploadSuccess] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [selectedAssetForAppeal, setSelectedAssetForAppeal] = useState(null);
  const [appealReason, setAppealReason] = useState('');
  const [appealLoading, setAppealLoading] = useState(false);
  
  // Monetization state
  const [monetizationData, setMonetizationData] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    monthlyEarnings: [],
    topEarningAssets: []
  });
  const [monetizationLoading, setMonetizationLoading] = useState(false);
  const [monetizationError, setMonetizationError] = useState('');
  const [earningsHistory, setEarningsHistory] = useState([]);
  const [earningsHistoryLoading, setEarningsHistoryLoading] = useState(false);
  const [assetsSummary, setAssetsSummary] = useState([]);
  const [assetsSummaryLoading, setAssetsSummaryLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const apiConfig = getApiConfig();
        const response = await axios.get(`${apiConfig.baseURL}/api/creator/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setProfile(response.data);
        setError('');
      } catch (err) {
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchProfile();
  }, [user]);

  // Fetch uploads
  const fetchUploads = useCallback(async () => {
    setUploadsLoading(true);
    setUploadsError('');
    try {
      const apiConfig = getApiConfig();
      const response = await axios.get(`${apiConfig.baseURL}/api/creator/assets`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setUploads(response.data);
      setAssetCount(response.data.length);
    } catch (err) {
      setUploadsError('Failed to load uploads');
    } finally {
      setUploadsLoading(false);
    }
  }, []);

  // Fetch followers and following
  const fetchFollowers = useCallback(async () => {
    setFollowersLoading(true);
    try {
      const currentUserId = user?._id || user?.id;
      if (!currentUserId) return; // Don't fetch if no user
      const apiConfig = getApiConfig();
      const response = await axios.get(`${apiConfig.baseURL}/api/auth/user/${currentUserId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Fetched followers data in dashboard:', response.data.followers);
      setFollowers(response.data.followers || []);
    } catch (err) {
      console.error('Failed to load followers:', err);
    } finally {
      setFollowersLoading(false);
    }
  }, [user]);

  // Fetch monetization data
  const fetchMonetizationData = useCallback(async () => {
    setMonetizationLoading(true);
    setMonetizationError('');
    try {
      const apiConfig = getApiConfig();
      const token = localStorage.getItem('token');
      console.log('Fetching monetization data with token:', token ? 'Present' : 'Missing');
      
      const response = await axios.get(`${apiConfig.baseURL}/api/monetization/overview`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Monetization data response:', response.data);
      setMonetizationData(response.data);
    } catch (err) {
      console.error('Monetization API Error:', err.response?.data || err.message);
      console.error('Full error object:', err);
      setMonetizationError(`Failed to load monetization data: ${err.response?.data?.message || err.message}`);
    } finally {
      setMonetizationLoading(false);
    }
  }, []);

  // Fetch earnings history
  const fetchEarningsHistory = useCallback(async () => {
    setEarningsHistoryLoading(true);
    try {
      const apiConfig = getApiConfig();
      const token = localStorage.getItem('token');
      const response = await axios.get(`${apiConfig.baseURL}/api/monetization/earnings-history`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Earnings history response:', response.data);
      setEarningsHistory(response.data.earnings);
    } catch (err) {
      console.error('Failed to load earnings history:', err.response?.data || err.message);
    } finally {
      setEarningsHistoryLoading(false);
    }
  }, []);

  // Fetch assets summary
  const fetchAssetsSummary = useCallback(async () => {
    setAssetsSummaryLoading(true);
    try {
      const apiConfig = getApiConfig();
      const token = localStorage.getItem('token');
      const response = await axios.get(`${apiConfig.baseURL}/api/monetization/assets-summary`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Assets summary response:', response.data);
      setAssetsSummary(response.data);
    } catch (err) {
      console.error('Failed to load assets summary:', err.response?.data || err.message);
    } finally {
      setAssetsSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    if ((activeSection === 'uploads' || activeSection === 'dashboard' || activeSection === 'analytics') && user) {
      fetchUploads();
    }
    if ((activeSection === 'settings' || activeSection === 'dashboard') && user) {
      fetchFollowers();
    }
    if (activeSection === 'monetization' && user) {
      fetchMonetizationData();
      fetchEarningsHistory();
      fetchAssetsSummary();
    }
  }, [activeSection, user, fetchUploads, fetchFollowers, fetchMonetizationData, fetchEarningsHistory, fetchAssetsSummary]);

  // Handle navigation from AssetDetail page with editAssetId
  useEffect(() => {
    if (location.state?.editAssetId && uploads.length > 0) {
      const assetToEdit = uploads.find(asset => asset._id === location.state.editAssetId);
      if (assetToEdit) {
        handleEditAssetClick(assetToEdit);
        // Clear the navigation state to prevent reopening modal on re-render
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, uploads]);

  // Auto-refresh followers data every 30 seconds when dashboard or settings is active
  useEffect(() => {
    if ((activeSection === 'dashboard' || activeSection === 'settings') && user) {
      const interval = setInterval(() => {
        fetchFollowers();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [activeSection, user, fetchFollowers]);

  useEffect(() => {
    const handleFollowersUpdated = () => {
      console.log('Received followersUpdated event in CreatorDashboard.js, fetching followers...');
      fetchFollowers();
    };
    window.addEventListener('followersUpdated', handleFollowersUpdated);
    return () => window.removeEventListener('followersUpdated', handleFollowersUpdated);
  }, [fetchFollowers]);

  // Cleanup object URLs when component unmounts or images change
  useEffect(() => {
    return () => {
      // Cleanup showcase images
      uploadData.showcaseImages.forEach(file => {
        if (file && typeof file === 'object' && file.constructor === File) {
          URL.revokeObjectURL(URL.createObjectURL(file));
        }
      });
      
      // Cleanup cover page
      if (uploadData.coverPage && typeof uploadData.coverPage === 'object' && uploadData.coverPage.constructor === File) {
        URL.revokeObjectURL(URL.createObjectURL(uploadData.coverPage));
      }
    };
  }, [uploadData.showcaseImages, uploadData.coverPage]);

  // Open edit modal and prefill data
  const handleEdit = () => {
    setEditData({
      displayName: profile.displayName || '',
      username: profile.username || '',
      location: profile.location || '',
      phoneNumber: profile.phoneNumber || '',
      bio: profile.bio || ''
    });
    setEditError('');
    setEditSuccess('');
    setShowEdit(true);
  };

  // Handle edit form change
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  // Handle edit form submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');
    try {
      const apiConfig = getApiConfig();
      const response = await axios.put(
        `${apiConfig.baseURL}/api/creator/profile`,
        editData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setProfile(response.data);
      setUser(response.data); // Update user context so bio displays immediately
      setEditSuccess('Profile updated successfully!');
      setShowEdit(false);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle upload form change
  const handleUploadChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    if (files) {
      if (name === 'showcaseImages') {
        // Handle multiple showcase images with limit
        const fileArray = Array.from(files);
        const maxImages = 10;
        
        if (fileArray.length > maxImages) {
          setUploadError(`Maximum ${maxImages} showcase images allowed. Only the first ${maxImages} images will be selected.`);
          setUploadData(prev => ({ ...prev, [name]: fileArray.slice(0, maxImages) }));
        } else {
          setUploadError(''); // Clear any previous error
          setUploadData(prev => ({ ...prev, [name]: fileArray }));
        }
      } else if (name === 'assetFile') {
        // Handle asset file and calculate file size
        const file = files[0];
        const fileSize = file ? formatFileSize(file.size) : '';
        setUploadData(prev => ({ ...prev, [name]: file, fileSize }));
      } else {
        // Handle single file (coverPage)
        setUploadData(prev => ({ ...prev, [name]: files[0] }));
      }
    } else if (type === 'checkbox') {
      if (name === 'format') {
        setUploadData(prev => ({
          ...prev,
          format: checked 
            ? [...prev.format, value]
            : prev.format.filter(f => f !== value)
        }));
      } else if (name === 'creditRequired') {
        setUploadData(prev => ({ ...prev, [name]: checked }));
      }
    } else {
      setUploadData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Remove individual showcase image
  const removeShowcaseImage = (indexToRemove) => {
    setUploadData(prev => ({
      ...prev,
      showcaseImages: prev.showcaseImages.filter((_, index) => index !== indexToRemove)
    }));
  };

  // Handle upload form submit
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadLoading(true);
    setUploadError('');
    setUploadSuccess(false);
    
    // Validate required fields
    if (!uploadData.coverPage) {
      setUploadError('Please select a cover page image.');
      setUploadLoading(false);
      return;
    }
    
    // Showcase images are now optional
    // if (uploadData.showcaseImages.length === 0) {
    //   setUploadError('Please select at least one showcase image.');
    //   setUploadLoading(false);
    //   return;
    // }
    
    try {
      const formData = new FormData();
      formData.append('title', uploadData.title);
      formData.append('category', uploadData.category);
      formData.append('coverPage', uploadData.coverPage);
      
      // Append multiple showcase images
      uploadData.showcaseImages.forEach((image, index) => {
        formData.append('showcaseImages', image);
      });
      
      formData.append('description', uploadData.description);
      formData.append('keywords', uploadData.keywords);
      formData.append('assetFile', uploadData.assetFile);
      formData.append('fileSize', uploadData.fileSize);
      formData.append('license', uploadData.license);
      formData.append('format', JSON.stringify(uploadData.format));
      formData.append('creditRequired', uploadData.creditRequired);
      formData.append('creditText', uploadData.creditText);

      const apiConfig = getApiConfig();
      await axios.post(`${apiConfig.baseURL}/api/creator/upload-asset`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setUploadSuccess(true);
      setUploadData({ 
        title: '', 
        category: 'Other',
        coverPage: null,
        showcaseImages: [], 
        description: '', 
        keywords: '', 
        assetFile: null,
        fileSize: '',
        license: 'Free',
        format: [],
        creditRequired: false,
        creditText: ''
      });
      setActiveSection('uploads');
      fetchUploads(); // Refresh list
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to upload asset');
    } finally {
      setUploadLoading(false);
    }
  };

  // Edit asset handlers
  const handleEditAssetClick = (asset) => {
    setEditAsset(asset);
    setEditAssetData({
      title: asset.title,
      category: asset.category,
      description: asset.description,
      keywords: asset.keywords,
      license: asset.license,
      format: asset.format || [],
      creditRequired: asset.creditRequired,
      creditText: asset.creditText || '',
      dimension: asset.dimension || { width: 6000, height: 4000 },
      coverPage: null,
      assetFile: null,
      showcaseImages: []
    });
    setEditAssetError('');
    setEditAssetSuccess('');
    setShowEditAssetModal(true);
  };

  const handleEditAssetChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    
    if (files) {
      if (name === 'showcaseImages') {
        const fileArray = Array.from(files);
        const maxImages = 10;
        
        if (fileArray.length > maxImages) {
          setEditAssetError(`Maximum ${maxImages} showcase images allowed.`);
          setEditAssetData(prev => ({ ...prev, [name]: fileArray.slice(0, maxImages) }));
        } else {
          setEditAssetError('');
          setEditAssetData(prev => ({ ...prev, [name]: fileArray }));
        }
      } else {
        setEditAssetData(prev => ({ ...prev, [name]: files[0] }));
      }
    } else if (type === 'checkbox') {
      if (name === 'format') {
        setEditAssetData(prev => ({
          ...prev,
          format: checked 
            ? [...prev.format, value]
            : prev.format.filter(f => f !== value)
        }));
      } else {
        setEditAssetData(prev => ({ ...prev, [name]: checked }));
      }
    } else if (name === 'dimensionWidth' || name === 'dimensionHeight') {
      const dimensionKey = name === 'dimensionWidth' ? 'width' : 'height';
      setEditAssetData(prev => ({
        ...prev,
        dimension: { ...prev.dimension, [dimensionKey]: parseInt(value) || 0 }
      }));
    } else {
      setEditAssetData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditAssetSubmit = async (e) => {
    e.preventDefault();
    setEditAssetLoading(true);
    setEditAssetError('');
    setEditAssetSuccess('');
    
    try {
      const formData = new FormData();
      
      // Add basic fields
      formData.append('title', editAssetData.title);
      formData.append('category', editAssetData.category);
      formData.append('description', editAssetData.description);
      formData.append('keywords', editAssetData.keywords);
      formData.append('license', editAssetData.license);
      formData.append('format', JSON.stringify(editAssetData.format));
      formData.append('creditRequired', editAssetData.creditRequired);
      formData.append('creditText', editAssetData.creditText);
      formData.append('dimension', JSON.stringify(editAssetData.dimension));
      
      // Add files if they exist
      if (editAssetData.coverPage) {
        formData.append('coverPage', editAssetData.coverPage);
      }
      if (editAssetData.assetFile) {
        formData.append('assetFile', editAssetData.assetFile);
        // Calculate file size for new asset file
        const fileSize = formatFileSize(editAssetData.assetFile.size);
        formData.append('fileSize', fileSize);
      }
      if (editAssetData.showcaseImages.length > 0) {
        editAssetData.showcaseImages.forEach((image) => {
          formData.append('showcaseImages', image);
        });
      }

      const apiConfig = getApiConfig();
      await axios.put(
        `${apiConfig.baseURL}/api/creator/assets/${editAsset._id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setEditAssetSuccess('Asset updated successfully!');
      setShowEditAssetModal(false);
      fetchUploads();
    } catch (err) {
      setEditAssetError(err.response?.data?.message || 'Failed to update asset');
    } finally {
      setEditAssetLoading(false);
    }
  };

  // Delete asset handlers
  const handleDeleteAssetClick = (id) => {
    setDeleteAssetId(id);
    setDeleteAssetError('');
  };

  const handleDeleteAssetConfirm = async () => {
    setDeleteAssetLoading(true);
    setDeleteAssetError('');
    try {
      const apiConfig = getApiConfig();
      await axios.delete(`${apiConfig.baseURL}/api/creator/assets/${deleteAssetId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setDeleteAssetId(null);
      fetchUploads();
    } catch (err) {
      setDeleteAssetError(err.response?.data?.message || 'Failed to delete asset');
    } finally {
      setDeleteAssetLoading(false);
    }
  };

  const handleCoverImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('File selected:', file.name, file.type, file.size);
      setCoverImage(file);
      
      // Start upload immediately
      await handleCoverImageUpload(file);
    }
  };

  const handleCoverImageUpload = async (fileToUpload = null) => {
    console.log('Starting cover image upload...');
    
    const uploadFile = fileToUpload || coverImage;
    
    if (!uploadFile) {
      console.log('No cover image selected');
      setError('Please select a file to upload.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No authentication token found');
      setError('You must be logged in to upload images.');
      return;
    }

    console.log('Cover image file:', uploadFile.name, uploadFile.type, uploadFile.size);
    
    setCoverImageUploading(true);
    setCoverUploadSuccess(false);
    setError('');
    
    const formData = new FormData();
    formData.append('userCoverImage', uploadFile);
    
    console.log('FormData created, making API call...');

    try {
      console.log('Token:', token ? 'Present' : 'Missing');
      
      const apiConfig = getApiConfig();
      const res = await axios.put(`${apiConfig.baseURL}/api/creator/profile/cover-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Upload successful:', res.data);
      setUser(res.data);
      setCoverUploadSuccess(true);
      
      // Show success message then cleanup
      setTimeout(() => {
        setCoverUploadSuccess(false);
        setCoverImage(null);
        // Reset file input
        const fileInput = document.getElementById('cover-upload');
        if (fileInput) fileInput.value = '';
      }, 1500); // Show success for 1.5 seconds
      
    } catch (err) {
      console.error('Upload error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      let errorMessage = 'Failed to upload cover image.';
      
      if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data?.message || 'Invalid file or request.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setCoverImageUploading(false);
    }
  };

  const handleAppealClick = (asset) => {
    setSelectedAssetForAppeal(asset);
    setAppealReason('');
    setShowAppealModal(true);
  };

  const handleAppealSubmit = async () => {
    if (!appealReason.trim()) {
      setError('Please provide a reason for your appeal');
      return;
    }

    try {
      setAppealLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(`/api/creator/assets/${selectedAssetForAppeal._id}/appeal`, {
        appealReason: appealReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Appeal submitted successfully');
      setShowAppealModal(false);
      setSelectedAssetForAppeal(null);
      setAppealReason('');
      
      // Refresh uploads to show updated appeal status
      fetchUploads();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit appeal');
      console.error('Error submitting appeal:', error);
    } finally {
      setAppealLoading(false);
    }
  };

  return (
    <div className="d-flex creator-dashboard-container" style={{ minHeight: '100vh' }}>
      {/* Modern Sidebar */}
      <div className="modern-sidebar" style={{ 
        width: '280px', 
        minWidth: '280px', 
        backgroundColor: '#ffffff', 
        borderRight: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh'
      }}>
        {/* Scrollable Content */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE and Edge
        }}
        className="sidebar-scrollbar-hide"
        >
          <div className="p-4">
            {/* Profile Section */}
            <div className="profile-section" style={{ 
              textAlign: 'center', 
              marginBottom: '2rem',
              paddingBottom: '1.5rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{ 
                width: '130px', 
                height: '130px', 
                margin: '0px auto 16px',
                borderRadius: '50%',
                backgroundColor: 'rgb(156, 163, 175)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {user?.profileImage ? (
                  <img 
                    src={`${getApiConfig().baseURL}/${user.profileImage}`} 
                    alt="Profile" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <i className="bi bi-person" style={{ fontSize: '2rem', color: '#ffffff' }}></i>
                )}
              </div>
              <h5 style={{ 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                margin: '0 0 0.25rem 0',
                color: '#111827'
              }}>
                Your Studio
              </h5>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#6b7280', 
                margin: 0 
              }}>
                {user?.displayName || user?.name || 'Creator'}
              </p>
            </div>

            {/* Navigation Menu */}
          <Nav className="flex-column">
            {sidebarItems.map((item) => (
              <Nav.Link
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                  className={`modern-nav-link d-flex align-items-center px-3 py-3 mb-1`}
                style={{ 
                    fontWeight: '500',
                    fontSize: '0.875rem', 
                  cursor: 'pointer',
                  borderRadius: '8px',
                    transition: 'all 0.15s ease',
                    color: activeSection === item.key ? '#111827' : '#6b7280',
                    backgroundColor: activeSection === item.key ? '#f3f4f6' : 'transparent',
                    border: 'none',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== item.key) {
                      e.target.style.backgroundColor = '#f9fafb';
                      e.target.style.color = '#374151';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== item.key) {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = '#6b7280';
                    }
                  }}
                >
                  <i className={`${item.icon} me-3`} style={{ 
                    fontSize: '1.1rem', 
                    width: '20px',
                    color: activeSection === item.key ? '#111827' : '#9ca3af'
                  }}></i>
                {item.label}
              </Nav.Link>
            ))}
          </Nav>
          </div>
        </div>


      </div>

      {/* Main Content - Full Width */}
      <div className="flex-grow-1 p-4">
        {activeSection === 'dashboard' && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="mb-1" style={{ fontWeight: 700, fontSize: '2rem' }}>Studio Dashboard</h2>
                <div style={{ color: '#6b7280', fontSize: '1rem' }}>Welcome back, {user?.displayName || user?.name || 'Creator'}!</div>
              </div>
              <div className="d-flex gap-2">
                <Button variant="primary" onClick={() => setActiveSection('upload-asset')}>Upload Asset</Button>
              </div>
            </div>
            {loading ? (
              <div className="text-center my-5">
                <Spinner animation="border" />
              </div>
            ) : error ? (
              <Alert variant="danger">{error}</Alert>
            ) : (
              <>
                <Row className="g-4">
                  {/* Studio Analytics - Left Side */}
                  <Col md={6}>
                    <Card className="shadow-sm border-0" style={{ height: 'fit-content' }}>
                      <Card.Body>
                        <h5 className="mb-3">Studio Analytics</h5>
                        <div className="mb-4">
                          <div className="text-muted small mb-1">Current Followers</div>
                          <div className="display-1 fw-bold">{followersLoading ? <Spinner size="sm" /> : followers.length}</div>
                        </div>
                        
                        <div className="mb-3">
                          <h6 className="mb-3">Summary</h6>
                          <div className="text-muted small mb-2">Last 28 days</div>
                        </div>
                        
                        <div className="d-flex flex-column gap-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <span>Total Uploads</span>
                            <span className="fw-bold">{uploadsLoading ? <Spinner size="sm" /> : uploads.length}</span>
                        </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span>Asset Views</span>
                            <span className="fw-bold">{uploadsLoading ? <Spinner size="sm" /> : uploads.reduce((total, asset) => total + (asset.viewCount || 0), 0)}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span>Downloads</span>
                            <span className="fw-bold">{uploadsLoading ? <Spinner size="sm" /> : uploads.reduce((total, asset) => total + (asset.downloadCount || 0), 0)}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span>Earnings</span>
                            <span className="fw-bold">{uploadsLoading ? <Spinner size="sm" /> : uploads.reduce((total, asset) => total + (asset.totalEarnings || 0), 0)}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span>Copyright's</span>
                            <span className="fw-bold">{uploadsLoading ? <Spinner size="sm" /> : uploads.filter(asset => asset.copyrightStrike?.isStruck).length}</span>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  {/* Overall Growth - Right Side */}
                  <Col md={6}>
                    <Card className="shadow-sm border-0 mb-3">
                      <Card.Body>
                        <h5 className="mb-3">Overall Growth</h5>
                        {/* Real Chart with actual data */}
                        <div style={{ width: '100%', height: 200, background: '#f8f9fa', borderRadius: 8, position: 'relative', overflow: 'hidden' }}>
                          {(() => {
                            // Generate chart data based on uploads
                            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            const currentDate = new Date();
                            const chartData = [];
                            
                            // Create data for last 12 months
                            for (let i = 11; i >= 0; i--) {
                              const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                              const monthlyUploads = uploads.filter(upload => {
                                const uploadDate = new Date(upload.createdAt);
                                return uploadDate.getMonth() === date.getMonth() && 
                                       uploadDate.getFullYear() === date.getFullYear();
                              });
                              
                              const monthlyViews = monthlyUploads.reduce((sum, upload) => sum + (upload.viewCount || 0), 0);
                              const monthlyDownloads = monthlyUploads.reduce((sum, upload) => sum + (upload.downloadCount || 0), 0);
                              
                              chartData.push({
                                month: months[date.getMonth()],
                                uploads: monthlyUploads.length,
                                views: monthlyViews,
                                downloads: monthlyDownloads,
                                cumulativeUploads: uploads.filter(upload => new Date(upload.createdAt) <= date).length
                              });
                            }
                            
                            // Find max values for scaling
                            const maxValue = Math.max(...chartData.map(d => d.views || 1), 1);
                            const chartWidth = 380;
                            const chartHeight = 160;
                            const padding = 20;
                            
                            // Generate SVG points for the line
                            const points = chartData.map((data, index) => {
                              const x = padding + (index * (chartWidth - 2 * padding)) / (chartData.length - 1);
                              const y = chartHeight - padding - ((data.views / maxValue) * (chartHeight - 2 * padding));
                              return `${x},${y}`;
                            }).join(' ');
                            
                            // Generate area fill points
                            const areaPoints = `${padding},${chartHeight - padding} ${points} ${padding + (chartWidth - 2 * padding)},${chartHeight - padding}`;
                            
                            return (
                              <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth + 20} ${chartHeight + 40}`} style={{ background: '#f8f9fa' }}>
                                {/* Grid lines */}
                                {[0, 1, 2, 3, 4].map(i => (
                                  <line
                                    key={i}
                                    x1={padding}
                                    y1={padding + (i * (chartHeight - 2 * padding)) / 4}
                                    x2={chartWidth - padding}
                                    y2={padding + (i * (chartHeight - 2 * padding)) / 4}
                                    stroke="#e5e7eb"
                                    strokeWidth="1"
                                    opacity="0.5"
                                  />
                                ))}
                                
                                {/* Area fill */}
                                <polygon
                                  points={areaPoints}
                                  fill="url(#gradient)"
                                  opacity="0.1"
                                />
                                
                                {/* Main line */}
                                <polyline
                                  points={points}
                                  fill="none"
                                  stroke="#3b82f6"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                
                                {/* Data points */}
                                {chartData.map((data, index) => {
                                  const x = padding + (index * (chartWidth - 2 * padding)) / (chartData.length - 1);
                                  const y = chartHeight - padding - ((data.views / maxValue) * (chartHeight - 2 * padding));
                                  return (
                                    <g key={index}>
                                      <circle
                                        cx={x}
                                        cy={y}
                                        r="4"
                                        fill="#3b82f6"
                                        stroke="#fff"
                                        strokeWidth="2"
                                      />
                                      {/* Hover tooltip */}
                                      <title>{`${data.month}: ${data.views} views, ${data.downloads} downloads`}</title>
                                    </g>
                                  );
                                })}
                                
                                {/* Gradient definition */}
                                <defs>
                                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                                  </linearGradient>
                                </defs>
                                
                                {/* Month labels */}
                                {chartData.map((data, index) => {
                                  if (index % 2 === 0) { // Show every other month to avoid crowding
                                    const x = padding + (index * (chartWidth - 2 * padding)) / (chartData.length - 1);
                                    return (
                                      <text
                                        key={index}
                                        x={x}
                                        y={chartHeight + 15}
                                        textAnchor="middle"
                                        fill="#6b7280"
                                        fontSize="12"
                                      >
                                        {data.month}
                                      </text>
                                    );
                                  }
                                  return null;
                                })}
                                
                                {/* Y-axis labels */}
                                <text x="5" y="20" fill="#6b7280" fontSize="10">{maxValue}</text>
                                <text x="5" y={chartHeight - 15} fill="#6b7280" fontSize="10">0</text>
                              </svg>
                            );
                          })()}
                        </div>
                        
                        {/* Chart legend/info */}
                        <div className="mt-3 d-flex justify-content-between text-muted small">
                          <span>📈 Views over time</span>
                          <span>Hover points for details</span>
                        </div>
                      </Card.Body>
                    </Card>
                    
                    {/* Upload Assets Section */}
                    <Card className="shadow-sm border-0">
                      <Card.Body className="text-center">
                        <div className="mb-3">
                          <small className="text-muted">Want to see metrics on your recent Assets?</small><br/>
                          <small className="text-muted">Upload and Publish a New Asset to get Started.</small>
                        </div>
                        <Button 
                          variant="dark" 
                          onClick={() => setActiveSection('upload-asset')}
                          style={{ 
                            backgroundColor: '#2d3748', 
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 24px',
                            fontWeight: '500'
                          }}
                        >
                          Upload Assets
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </>
            )}
          </>
        )}
        {activeSection === 'uploads' && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="mb-0">Your Uploads</h2>
              <Button variant="primary" onClick={() => setActiveSection('upload-asset')}>
                Upload Asset
              </Button>
            </div>
            {uploadsLoading ? (
              <div className="text-center my-5">
                <Spinner animation="border" />
              </div>
            ) : uploadsError ? (
              <Alert variant="danger">{uploadsError}</Alert>
            ) : (
              <Card className="mb-4">
                <Card.Body>
                  {uploads.length === 0 ? (
                    <div className="text-center text-muted">No uploads yet.</div>
                  ) : (
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Cover</th>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Keywords</th>
                            <th>File</th>
                            <th>Status</th>
                            <th>Views</th>
                            <th>Downloads</th>
                            <th>Earnings</th>
                            <th>Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {uploads.map(asset => (
                            <tr key={asset._id}>
                              <td>
                                {asset.showcaseImages && asset.showcaseImages.length > 0 ? (
                                  <img src={`${getApiConfig().baseURL}/${asset.showcaseImages[0]}`} alt="showcase" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                                ) : (
                                  <span className="text-muted">No image</span>
                                )}
                              </td>
                              <td>{asset.title}</td>
                              <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{asset.description}</td>
                              <td>{asset.keywords}</td>
                              <td>
                                {asset.assetFile ? (
                                  <a href={`${getApiConfig().baseURL}/${asset.assetFile}`} target="_blank" rel="noopener noreferrer">Download</a>
                                ) : (
                                  <span className="text-muted">No file</span>
                                )}
                              </td>
                              <td>
                                {asset.copyrightStrike?.isStruck ? (
                                  <span className="badge bg-danger">Copyright Strike</span>
                                ) : (
                                  <span className="badge bg-success">Active</span>
                                )}
                              </td>
                              <td>
                                <span className="badge bg-primary">{asset.viewCount || 0}</span>
                              </td>
                              <td>
                                <span className="badge bg-secondary">{asset.downloadCount || 0}</span>
                              </td>
                              <td>
                                {asset.license === 'Premium' ? (
                                  <span className="text-success fw-bold">₹{(asset.totalEarnings || 0).toFixed(2)}</span>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                              <td>{asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : ''}</td>
                              <td>
                                <button
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    marginRight: 12,
                                    color: '#6c757d',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem',
                                    verticalAlign: 'middle'
                                  }}
                                  onClick={() => handleEditAssetClick(asset)}
                                  title="Edit"
                                >
                                  <FaRegEdit />
                                </button>
                                <button
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    color: '#dc3545',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem',
                                    verticalAlign: 'middle'
                                  }}
                                  onClick={() => handleDeleteAssetClick(asset._id)}
                                  title="Delete"
                                >
                                  <MdDelete />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}
            {/* Edit Asset Modal */}
            <Modal 
              show={showEditAssetModal} 
              onHide={() => setShowEditAssetModal(false)} 
              size="lg"
              dialogClassName="modal-90w"
              style={{ zIndex: 1050 }}
            >
              <Modal.Header closeButton>
                <Modal.Title>Edit Asset</Modal.Title>
              </Modal.Header>
              <Form onSubmit={handleEditAssetSubmit}>
                <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto', minHeight: '200px' }}>
                  {editAssetError && <Alert variant="danger">{editAssetError}</Alert>}
                  {editAssetSuccess && <Alert variant="success">{editAssetSuccess}</Alert>}
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Title</Form.Label>
                        <Form.Control
                          type="text"
                          name="title"
                          value={editAssetData.title}
                          onChange={handleEditAssetChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Category</Form.Label>
                        <Form.Select
                          name="category"
                          value={editAssetData.category}
                          onChange={handleEditAssetChange}
                          required
                        >
                          <option value="">Select Category</option>
                          <option value="Motion Graphics">Motion Graphics</option>
                          <option value="Web Design">Web Design</option>
                          <option value="Logo Design">Logo Design</option>
                          <option value="Print Design">Print Design</option>
                          <option value="Photography">Photography</option>
                          <option value="Illustration">Illustration</option>
                          <option value="UI/UX">UI/UX</option>
                          <option value="Branding">Branding</option>
                          <option value="Other">Other</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="description"
                      value={editAssetData.description}
                      onChange={handleEditAssetChange}
                      rows={3}
                      required
                    />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Keywords</Form.Label>
                        <Form.Control
                          type="text"
                          name="keywords"
                          value={editAssetData.keywords}
                          onChange={handleEditAssetChange}
                          placeholder="e.g., design, logo, modern"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>License</Form.Label>
                        <Form.Select
                          name="license"
                          value={editAssetData.license}
                          onChange={handleEditAssetChange}
                          required
                        >
                          <option value="Free">Free</option>
                          <option value="Premium">Premium</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Width (px)</Form.Label>
                        <Form.Control
                          type="number"
                          name="dimensionWidth"
                          value={editAssetData.dimension.width}
                          onChange={handleEditAssetChange}
                          min="1"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Height (px)</Form.Label>
                        <Form.Control
                          type="number"
                          name="dimensionHeight"
                          value={editAssetData.dimension.height}
                          onChange={handleEditAssetChange}
                          min="1"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Format</Form.Label>
                    <div className="d-flex gap-3 flex-wrap">
                      {['JPG', 'PNG', 'PSD', 'CDR', 'PDF'].map(formatOption => (
                        <Form.Check
                          key={formatOption}
                          type="checkbox"
                          id={`edit-format-${formatOption}`}
                          name="format"
                          value={formatOption}
                          label={formatOption}
                          checked={editAssetData.format.includes(formatOption)}
                          onChange={handleEditAssetChange}
                        />
                      ))}
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <Form.Check
                        type="checkbox"
                        id="edit-creditRequired"
                        name="creditRequired"
                        checked={editAssetData.creditRequired}
                        onChange={handleEditAssetChange}
                      />
                      <Form.Label className="ms-2 mb-0" htmlFor="edit-creditRequired">
                        Credit Required
                      </Form.Label>
                    </div>
                    {editAssetData.creditRequired && (
                      <Form.Control
                        type="text"
                        name="creditText"
                        value={editAssetData.creditText}
                        onChange={handleEditAssetChange}
                        placeholder="How should users credit you?"
                      />
                    )}
                  </Form.Group>

                  <hr />
                  <h6>Update Files (Optional)</h6>
                  <small className="text-muted">Leave empty to keep existing files</small>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>New Cover Page</Form.Label>
                        <Form.Control
                          type="file"
                          name="coverPage"
                          accept="image/*"
                          onChange={handleEditAssetChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>New Asset File</Form.Label>
                        <Form.Control
                          type="file"
                          name="assetFile"
                          onChange={handleEditAssetChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>New Showcase Images</Form.Label>
                    <Form.Control
                      type="file"
                      name="showcaseImages"
                      accept="image/*"
                      onChange={handleEditAssetChange}
                      multiple
                    />
                    <Form.Text className="text-muted">
                      Select new showcase images (max 10, will replace all existing ones)
                    </Form.Text>
                  </Form.Group>
                </Modal.Body>
                <Modal.Footer style={{ borderTop: '1px solid #dee2e6', padding: '1rem', backgroundColor: '#f8f9fa' }}>
                  <div className="d-flex justify-content-end gap-2 w-100">
                    <Button variant="secondary" onClick={() => setShowEditAssetModal(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      variant="primary" 
                      disabled={editAssetLoading}
                      className="px-4"
                      style={{ minWidth: '120px' }}
                    >
                      {editAssetLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                </Modal.Footer>
              </Form>
            </Modal>
            {/* Delete Asset Modal */}
            <Modal show={!!deleteAssetId} onHide={() => setDeleteAssetId(null)}>
              <Modal.Header closeButton>
                <Modal.Title>Delete Asset</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {deleteAssetError && <Alert variant="danger">{deleteAssetError}</Alert>}
                Are you sure you want to delete this asset?
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setDeleteAssetId(null)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDeleteAssetConfirm} disabled={deleteAssetLoading}>
                  {deleteAssetLoading ? 'Deleting...' : 'Delete'}
                </Button>
              </Modal.Footer>
            </Modal>
          </>
        )}
        {activeSection === 'upload-asset' && (
          <>
            <h2 className="mb-4">Upload Asset</h2>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Upload New Asset</h5>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleUploadSubmit}>
                  {uploadError && <Alert variant="danger">{uploadError}</Alert>}
                  {uploadSuccess && <Alert variant="success">Asset uploaded successfully!</Alert>}
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Title</Form.Label>
                        <Form.Control
                          type="text"
                          name="title"
                          value={uploadData.title}
                          onChange={handleUploadChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Category</Form.Label>
                        <Form.Select
                          name="category"
                          value={uploadData.category}
                          onChange={handleUploadChange}
                          required
                        >
                          <option value="Motion Graphics">Motion Graphics</option>
                          <option value="Web Design">Web Design</option>
                          <option value="Logo Design">Logo Design</option>
                          <option value="Print Design">Print Design</option>
                          <option value="Photography">Photography</option>
                          <option value="Illustration">Illustration</option>
                          <option value="UI/UX">UI/UX</option>
                          <option value="Branding">Branding</option>
                          <option value="Other">Other</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>License</Form.Label>
                        <Form.Select
                          name="license"
                          value={uploadData.license}
                          onChange={handleUploadChange}
                          required
                        >
                          <option value="Free">Free</option>
                          <option value="Premium">Premium</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>File Size</Form.Label>
                        <Form.Control
                          type="text"
                          value={uploadData.fileSize || 'No file selected'}
                          disabled
                          style={{ backgroundColor: '#f8f9fa' }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="description"
                      value={uploadData.description}
                      onChange={handleUploadChange}
                      rows={3}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Keywords</Form.Label>
                    <Form.Control
                      type="text"
                      name="keywords"
                      value={uploadData.keywords}
                      onChange={handleUploadChange}
                      placeholder="e.g., design, logo, modern"
                    />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Cover Page Image *</Form.Label>
                        <Form.Control
                          type="file"
                          name="coverPage"
                          accept="image/*"
                          onChange={handleUploadChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Asset File *</Form.Label>
                        <Form.Control
                          type="file"
                          name="assetFile"
                          onChange={handleUploadChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Showcase Images</Form.Label>
                    <Form.Control
                      type="file"
                      name="showcaseImages"
                      accept="image/*"
                      onChange={handleUploadChange}
                      multiple
                    />
                    <Form.Text className="text-muted">
                      Select showcase images (max 10, optional)
                    </Form.Text>
                    {uploadData.showcaseImages.length > 0 && (
                      <div className="mt-2">
                        <strong>Selected images:</strong>
                        <div className="d-flex flex-wrap gap-2 mt-2">
                          {uploadData.showcaseImages.map((file, index) => (
                            <div key={index} className="position-relative">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Showcase ${index + 1}`}
                                style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                              />
                              <button
                                type="button"
                                onClick={() => removeShowcaseImage(index)}
                                style={{
                                  position: 'absolute',
                                  top: -5,
                                  right: -5,
                                  background: 'red',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: 20,
                                  height: 20,
                                  fontSize: 12,
                                  cursor: 'pointer'
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Format</Form.Label>
                    <div className="d-flex gap-3 flex-wrap">
                      {['JPG', 'PNG', 'PSD', 'CDR', 'PDF'].map(formatOption => (
                        <Form.Check
                          key={formatOption}
                          type="checkbox"
                          id={`format-${formatOption}`}
                          name="format"
                          value={formatOption}
                          label={formatOption}
                          checked={uploadData.format.includes(formatOption)}
                          onChange={handleUploadChange}
                        />
                      ))}
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <Form.Check
                        type="checkbox"
                        id="creditRequired"
                        name="creditRequired"
                        checked={uploadData.creditRequired}
                        onChange={handleUploadChange}
                      />
                      <Form.Label className="ms-2 mb-0" htmlFor="creditRequired">
                        Credit Required
                      </Form.Label>
                    </div>
                    {uploadData.creditRequired && (
                      <Form.Control
                        type="text"
                        name="creditText"
                        value={uploadData.creditText}
                        onChange={handleUploadChange}
                        placeholder="How should users credit you?"
                      />
                    )}
                  </Form.Group>

                  <div className="d-flex justify-content-end">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={uploadLoading}
                      style={{ minWidth: '150px' }}
                    >
                      {uploadLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Uploading...
                        </>
                      ) : (
                        'Upload Asset'
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </>
        )}
        {activeSection === 'analytics' && (
          <>
            <h2 className="mb-4">Analytics & Insights</h2>
            {uploadsLoading ? (
              <div className="text-center my-5">
                <Spinner animation="border" />
              </div>
            ) : uploadsError ? (
              <Alert variant="danger">{uploadsError}</Alert>
            ) : (
              <>
                {/* Summary Cards */}
                <Row className="mb-4">
                  <Col lg={3} md={6} className="mb-3">
                    <Card className="text-center">
                      <Card.Body>
                        <h3 className="text-primary mb-2">
                          <i className="bi bi-cloud-arrow-up"></i>
                        </h3>
                        <h4>{uploads.length}</h4>
                        <p className="text-muted mb-0">Total Assets</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col lg={3} md={6} className="mb-3">
                    <Card className="text-center">
                      <Card.Body>
                        <h3 className="text-info mb-2">
                          <i className="bi bi-eye"></i>
                        </h3>
                        <h4>{uploads.reduce((total, asset) => total + (asset.viewCount || 0), 0)}</h4>
                        <p className="text-muted mb-0">Total Views</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col lg={3} md={6} className="mb-3">
                    <Card className="text-center">
                      <Card.Body>
                        <h3 className="text-success mb-2">
                          <i className="bi bi-download"></i>
                        </h3>
                        <h4>{uploads.reduce((total, asset) => total + (asset.downloadCount || 0), 0)}</h4>
                        <p className="text-muted mb-0">Total Downloads</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col lg={3} md={6} className="mb-3">
                    <Card className="text-center">
                      <Card.Body>
                        <h3 className="text-warning mb-2">
                          <i className="bi bi-graph-up"></i>
                        </h3>
                        <h4>
                          {uploads.length > 0 
                            ? Math.round((uploads.reduce((total, asset) => total + (asset.downloadCount || 0), 0) / uploads.reduce((total, asset) => total + (asset.viewCount || 0), 1)) * 100)
                            : 0
                          }%
                        </h4>
                        <p className="text-muted mb-0">Conversion Rate</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Top Performing Assets */}
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">
                      <i className="bi bi-trophy me-2"></i>
                      Top Performing Assets
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    {uploads.length === 0 ? (
                      <div className="text-center text-muted">No assets to analyze.</div>
                    ) : (
                      <div className="table-responsive">
                        <Table>
                          <thead>
                            <tr>
                              <th>Rank</th>
                              <th>Asset</th>
                              <th>Views</th>
                              <th>Downloads</th>
                              <th>Conversion Rate</th>
                              <th>Created</th>
                            </tr>
                          </thead>
                          <tbody>
                            {uploads
                              .sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0))
                              .slice(0, 10)
                              .map((asset, index) => (
                                <tr key={asset._id}>
                                  <td>
                                    <span className={`badge ${index < 3 ? 'bg-warning' : 'bg-secondary'}`}>
                                      #{index + 1}
                                    </span>
                                  </td>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      {asset.showcaseImages && asset.showcaseImages.length > 0 && (
                                        <img 
                                          src={`${getApiConfig().baseURL}/${asset.showcaseImages[0]}`} 
                                          alt={asset.title}
                                          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, marginRight: 12 }}
                                        />
                                      )}
                                      <div>
                                        <div className="fw-bold">{asset.title}</div>
                                        <small className="text-muted">{asset.license}</small>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <span className="badge bg-info">{asset.viewCount || 0}</span>
                                  </td>
                                  <td>
                                    <span className="badge bg-success">{asset.downloadCount || 0}</span>
                                  </td>
                                  <td>
                                    <span className="badge bg-warning">
                                      {asset.viewCount > 0 
                                        ? Math.round(((asset.downloadCount || 0) / asset.viewCount) * 100)
                                        : 0
                                      }%
                                    </span>
                                  </td>
                                  <td>
                                    <small>{new Date(asset.createdAt).toLocaleDateString()}</small>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </Card.Body>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">
                      <i className="bi bi-clock-history me-2"></i>
                      Recent Activity
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    {uploads.length === 0 ? (
                      <div className="text-center text-muted">No recent activity.</div>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        {uploads
                          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                          .slice(0, 5)
                          .map(asset => (
                            <div key={asset._id} className="d-flex align-items-center p-3 border rounded">
                              {asset.showcaseImages && asset.showcaseImages.length > 0 && (
                                <img 
                                  src={`${getApiConfig().baseURL}/${asset.showcaseImages[0]}`} 
                                  alt={asset.title}
                                  style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8, marginRight: 16 }}
                                />
                              )}
                              <div className="flex-grow-1">
                                <div className="fw-bold">{asset.title}</div>
                                <div className="text-muted small">
                                  Created {new Date(asset.createdAt).toLocaleDateString()} • 
                                  <i className="bi bi-eye ms-2 me-1"></i>
                                  {asset.viewCount || 0} views • 
                                  <i className="bi bi-download ms-2 me-1"></i>
                                  {asset.downloadCount || 0} downloads
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </>
            )}
          </>
        )}
        {activeSection === 'monetization' && (
          <>
            <h2 className="mb-4">Monetization</h2>
            {monetizationLoading ? (
              <div className="text-center my-5">
                <Spinner animation="border" />
              </div>
            ) : monetizationError ? (
              <Alert variant="danger">{monetizationError}</Alert>
            ) : (
              <>
                {/* Earnings Overview Cards */}
                <Row className="mb-4">
                  <Col lg={3} md={6} className="mb-3">
                    <Card className="text-center">
                      <Card.Body>
                        <h3 className="text-success mb-2">
                          <i className="bi bi-currency-dollar"></i>
                        </h3>
                        <h4>₹{monetizationData.totalEarnings.toFixed(2)}</h4>
                        <p className="text-muted mb-0">Total Earnings</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col lg={3} md={6} className="mb-3">
                    <Card className="text-center">
                      <Card.Body>
                        <h3 className="text-warning mb-2">
                          <i className="bi bi-clock"></i>
                        </h3>
                        <h4>₹{monetizationData.pendingEarnings.toFixed(2)}</h4>
                        <p className="text-muted mb-0">Pending Earnings</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col lg={3} md={6} className="mb-3">
                    <Card className="text-center">
                      <Card.Body>
                        <h3 className="text-primary mb-2">
                          <i className="bi bi-check-circle"></i>
                        </h3>
                        <h4>₹{monetizationData.paidEarnings.toFixed(2)}</h4>
                        <p className="text-muted mb-0">Paid Earnings</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col lg={3} md={6} className="mb-3">
                    <Card className="text-center">
                      <Card.Body>
                        <h3 className="text-info mb-2">
                          <i className="bi bi-download"></i>
                        </h3>
                        <h4>{uploads.filter(asset => asset.license === 'Premium').reduce((total, asset) => total + (asset.downloadCount || 0), 0)}</h4>
                        <p className="text-muted mb-0">Premium Downloads</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Top Earning Assets */}
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">
                      <i className="bi bi-trophy me-2"></i>
                      Top Earning Assets
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    {monetizationData.topEarningAssets.length === 0 ? (
                      <div className="text-center text-muted">No premium assets with earnings yet.</div>
                    ) : (
                      <div className="table-responsive">
                        <Table>
                          <thead>
                            <tr>
                              <th>Rank</th>
                              <th>Asset</th>
                              <th>License</th>
                              <th>Downloads</th>
                              <th>Total Earnings</th>
                              <th>Per Download</th>
                            </tr>
                          </thead>
                          <tbody>
                            {monetizationData.topEarningAssets.map((asset, index) => (
                              <tr key={asset.assetId}>
                                <td>
                                  <span className={`badge ${index < 3 ? 'bg-warning' : 'bg-secondary'}`}>
                                    #{index + 1}
                                  </span>
                                </td>
                                <td>
                                  <div className="fw-bold">{asset.title}</div>
                                </td>
                                <td>
                                  <span className={`badge ${asset.license === 'Premium' ? 'bg-warning text-dark' : 'bg-success'}`}>
                                    {asset.license}
                                  </span>
                                </td>
                                <td>
                                  <span className="badge bg-info">{asset.downloadCount}</span>
                                </td>
                                <td>
                                  <span className="text-success fw-bold">₹{asset.totalEarnings.toFixed(2)}</span>
                                </td>
                                <td>
                                  <span className="text-muted">₹0.90</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </Card.Body>
                </Card>

                {/* Assets Earnings Summary */}
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">
                      <i className="bi bi-bar-chart me-2"></i>
                      Assets Earnings Summary
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    {assetsSummaryLoading ? (
                      <div className="text-center">
                        <Spinner size="sm" />
                      </div>
                    ) : assetsSummary.length === 0 ? (
                      <div className="text-center text-muted">No assets with earnings data.</div>
                    ) : (
                      <div className="table-responsive">
                        <Table>
                          <thead>
                            <tr>
                              <th>Asset</th>
                              <th>License</th>
                              <th>Downloads</th>
                              <th>Total Earned</th>
                              <th>Pending</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {assetsSummary.map((asset) => (
                              <tr key={asset._id}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    {asset.coverPage && (
                                      <img 
                                        src={`${getApiConfig().baseURL}/${asset.coverPage}`} 
                                        alt={asset.title}
                                        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, marginRight: 12 }}
                                      />
                                    )}
                                    <div>
                                      <div className="fw-bold">{asset.title}</div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge ${asset.license === 'Premium' ? 'bg-warning text-dark' : 'bg-success'}`}>
                                    {asset.license}
                                  </span>
                                </td>
                                <td>
                                  <span className="badge bg-secondary">{asset.downloadCount || 0}</span>
                                </td>
                                <td>
                                  <span className="text-success fw-bold">₹{asset.totalEarned.toFixed(2)}</span>
                                </td>
                                <td>
                                  <span className="text-warning">₹{asset.pendingEarnings.toFixed(2)}</span>
                                </td>
                                <td>
                                  {asset.license === 'Premium' ? (
                                    <span className="badge bg-success">Monetized</span>
                                  ) : (
                                    <span className="badge bg-secondary">Free</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </Card.Body>
                </Card>

                {/* Recent Earnings */}
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">
                      <i className="bi bi-clock-history me-2"></i>
                      Recent Earnings
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    {earningsHistoryLoading ? (
                      <div className="text-center">
                        <Spinner size="sm" />
                      </div>
                    ) : earningsHistory.length === 0 ? (
                      <div className="text-center text-muted">No earnings recorded yet.</div>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        {earningsHistory.slice(0, 10).map(earning => (
                          <div key={earning._id} className="d-flex align-items-center p-3 border rounded">
                            <div className="flex-grow-1">
                              <div className="fw-bold">{earning.asset?.title || 'Unknown Asset'}</div>
                              <div className="text-muted small">
                                {new Date(earning.downloadDate).toLocaleDateString()} • 
                                <span className="text-success ms-2">₹{earning.amount.toFixed(2)}</span> • 
                                <span className={`badge ms-2 ${earning.status === 'pending' ? 'bg-warning' : earning.status === 'paid' ? 'bg-success' : 'bg-secondary'}`}>
                                  {earning.status}
                                </span>
                              </div>
                            </div>
                            <div className="text-end">
                              <div className="text-success fw-bold">₹{earning.amount.toFixed(2)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </>
            )}
          </>
        )}

            
        {activeSection === 'copyright' && (
          <>
            <h2 className="mb-4">Copyright Management</h2>
            {uploadsLoading ? (
              <div className="text-center my-5">
                <Spinner animation="border" />
              </div>
            ) : uploadsError ? (
              <Alert variant="danger">{uploadsError}</Alert>
            ) : (
              <>
                {/* Copyright Strikes */}
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">
                      <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                      Copyright Strikes
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    {uploads.filter(asset => asset.copyrightStrike?.isStruck).length === 0 ? (
                      <div className="text-center py-4">
                        <i className="bi bi-check-circle text-success fa-3x mb-3"></i>
                        <h5 className="text-success">No Copyright Strikes</h5>
                        <p className="text-muted">All your assets are in good standing.</p>
                      </div>
                    ) : (
                      <div>
                        {uploads.filter(asset => asset.copyrightStrike?.isStruck).map(asset => (
                          <div key={asset._id} className="border rounded p-3 mb-3">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <h6 className="text-danger mb-2">
                                  <i className="bi bi-exclamation-triangle me-2"></i>
                                  {asset.title}
                                </h6>
                                <div className="row">
                                  <div className="col-md-6">
                                    <strong>Strike Reason:</strong>
                                    <p className="text-danger mb-2">{asset.copyrightStrike.reason}</p>
                                  </div>
                                  <div className="col-md-6">
                                    <strong>Struck On:</strong>
                                    <p className="mb-2">{new Date(asset.copyrightStrike.struckAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                
                                {asset.copyrightStrike.appeal.isAppealed ? (
                                  <div className="mt-3">
                                    <div className="alert alert-info">
                                      <strong>Appeal Status:</strong> 
                                      <span className={`badge ms-2 ${
                                        asset.copyrightStrike.appeal.status === 'pending' ? 'bg-warning' :
                                        asset.copyrightStrike.appeal.status === 'approved' ? 'bg-success' :
                                        'bg-danger'
                                      }`}>
                                        {asset.copyrightStrike.appeal.status.charAt(0).toUpperCase() + asset.copyrightStrike.appeal.status.slice(1)}
                                      </span>
                                    </div>
                                    <div className="row">
                                      <div className="col-md-6">
                                        <strong>Your Appeal:</strong>
                                        <p className="mb-2">{asset.copyrightStrike.appeal.appealReason}</p>
                                      </div>
                                      {asset.copyrightStrike.appeal.status !== 'pending' && (
                                        <div className="col-md-6">
                                          <strong>Admin Response:</strong>
                                          <p className="mb-2">{asset.copyrightStrike.appeal.adminResponse}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-3">
                                    <button
                                      className="btn btn-primary btn-sm"
                                      onClick={() => handleAppealClick(asset)}
                                    >
                                      <i className="bi bi-reply me-1"></i>
                                      Appeal This Strike
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card.Body>
                </Card>

                {/* Copyright Guidelines */}
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">
                      <i className="bi bi-info-circle text-info me-2"></i>
                      Copyright Guidelines
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="row">
                      <div className="col-md-6">
                        <h6>What constitutes a copyright violation?</h6>
                        <ul className="list-unstyled">
                          <li><i className="bi bi-x-circle text-danger me-2"></i>Using copyrighted material without permission</li>
                          <li><i className="bi bi-x-circle text-danger me-2"></i>Uploading content you don't own</li>
                          <li><i className="bi bi-x-circle text-danger me-2"></i>Using trademarked logos or brands</li>
                          <li><i className="bi bi-x-circle text-danger me-2"></i>Copying other creators' work</li>
                        </ul>
                      </div>
                      <div className="col-md-6">
                        <h6>How to avoid copyright strikes:</h6>
                        <ul className="list-unstyled">
                          <li><i className="bi bi-check-circle text-success me-2"></i>Only upload original content</li>
                          <li><i className="bi bi-check-circle text-success me-2"></i>Use royalty-free resources</li>
                          <li><i className="bi bi-check-circle text-success me-2"></i>Get proper licenses for third-party content</li>
                          <li><i className="bi bi-check-circle text-success me-2"></i>Credit original creators when required</li>
                        </ul>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </>
            )}
          </>
        )}
        {activeSection === 'messages' && (
          <>
            <Card>
              <Card.Body>
                <Messages />
              </Card.Body>
            </Card>
          </>
        )}
        {activeSection === 'settings' && (
          <>
            <h2 className="mb-4">Studio Settings</h2>
          <div className="studio-settings">
            <div className="profile-header">
              <div className="cover-image-container">
                {user.coverImage ? <img src={`${getApiConfig().baseURL}/${user.coverImage}`} alt="Cover" className="cover-image" /> : <div className="cover-image-placeholder"></div>}
                {user.username && <span className="cover-username">@{user.username}</span>}
                <div className="cover-image-upload">
                  <input 
                    type="file" 
                    id="cover-upload" 
                    onChange={handleCoverImageChange}
                    style={{ display: 'none' }}
                    accept="image/*"
                  />
                  <div 
                    onClick={() => document.getElementById('cover-upload').click()}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '50%',
                      width: '50px',
                      height: '50px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: '0.3s',
                      transform: 'scale(1)',
                      background: 'transparent'
                    }}
                  >
                    <FaCamera size={20} color="#fff" />
                  </div>
                  {coverImageUploading && (
                    <div style={{ 
                      marginTop: '8px', 
                      textAlign: 'center',
                      animation: 'fadeIn 0.3s ease-in-out'
                    }}>
                      <div style={{
                        background: '#007bff',
                        color: 'white',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 8px rgba(0, 123, 255, 0.3)'
                      }}>
                        <div 
                          style={{
                            width: '12px',
                            height: '12px',
                            border: '2px solid transparent',
                            borderTop: '2px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}
                        />
                        Uploading...
                      </div>
                    </div>
                  )}
                  {coverUploadSuccess && (
                    <div style={{ 
                      marginTop: '8px', 
                      textAlign: 'center',
                      animation: 'fadeIn 0.3s ease-in-out'
                    }}>
                      <div style={{
                        background: '#28a745',
                        color: 'white',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)'
                      }}>
                        ✓ Cover uploaded successfully!
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {error && (
                <div style={{ 
                  marginTop: '10px',
                  padding: '8px 12px',
                  background: '#f8d7da',
                  color: '#721c24',
                  border: '1px solid #f5c6cb',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {error}
                </div>
              )}
              <div className="profile-info">
                <div className="profile-picture-container">
                  {user.profileImage ? <img src={`${getApiConfig().baseURL}/${user.profileImage}`} alt={user.displayName} className="profile-picture" /> : <div className="profile-picture-placeholder"></div>}
                </div>
                <div className="profile-details">
                  <h2 className="d-flex align-items-center">
                    {user.displayName || user.name}
                    <VerificationTick user={user} size={18} />
                  </h2>
                  <p>{followers.length} followers {assetCount} assets</p>
                  <div className="creator-bio" style={{ 
                    fontSize: '12px', 
                    color: 'rgb(102, 102, 102)', 
                    lineHeight: '1.4',
                    marginTop: '3px',
                    padding: '8px 0px',
                    width: '350px',
                    maxWidth: '100%'
                  }}>
                    {user.bio || 'No bio available. Click Edit Profile to add your bio.'}
                  </div>
                </div>
                <div className="profile-actions">
                  <Button variant="dark" className="edit-profile-btn" onClick={handleEdit}>Edit Profile</Button>
                </div>
              </div>
            </div>
            <div className="assets-grid">
              {uploads.slice(0, 4).map(asset => (
                <Card key={asset._id}>
                  <Card.Img variant="top" src={asset.showcaseImages && asset.showcaseImages.length > 0 ? `${getApiConfig().baseURL}/${asset.showcaseImages[0]}` : 'https://via.placeholder.com/300x150?text=No+Image'} style={{ height: '150px', objectFit: 'cover' }} />
                  <Card.Body>
                    <Card.Title>{asset.title}</Card.Title>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </div>
          </>
        )}
        {activeSection === 'notifications' && (
          <>
            <h2 className="mb-4">Notifications</h2>
            <Card>
              <Card.Body>
                <div className="text-center py-5">
                  <i className="bi bi-bell" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
                  <h5 className="mt-3 mb-2">No New Notifications</h5>
                  <p className="text-muted">You're all caught up! Check back later for updates.</p>
                </div>
              </Card.Body>
            </Card>
          </>
        )}
        {activeSection === 'support' && (
          <>
            <h2 className="mb-4">Support / Help Center</h2>
            <Row>
              <Col md={6} className="mb-4">
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">
                      <i className="bi bi-question-circle me-2"></i>
                      Frequently Asked Questions
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="accordion" id="faqAccordion">
                      <div className="accordion-item">
                        <h2 className="accordion-header">
                          <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
                            How do I upload an asset?
                          </button>
                        </h2>
                        <div id="faq1" className="accordion-collapse collapse">
                          <div className="accordion-body">
                            Click on "Upload Asset" in the sidebar, fill out the required information, and upload your files.
                          </div>
                        </div>
                      </div>
                      <div className="accordion-item">
                        <h2 className="accordion-header">
                          <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">
                            How do I earn money from my assets?
                          </button>
                        </h2>
                        <div id="faq2" className="accordion-collapse collapse">
                          <div className="accordion-body">
                            Set your assets to "Premium" license when uploading. You'll earn money each time someone downloads your premium assets.
                          </div>
                        </div>
                      </div>
                      <div className="accordion-item">
                        <h2 className="accordion-header">
                          <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">
                            What file formats are supported?
                          </button>
                        </h2>
                        <div id="faq3" className="accordion-collapse collapse">
                          <div className="accordion-body">
                            We support JPG, PNG, PSD, CDR, PDF and many other common design file formats.
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} className="mb-4">
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">
                      <i className="bi bi-envelope me-2"></i>
                      Contact Support
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <p>Need help? Our support team is here to assist you.</p>
                    <div className="d-grid gap-2">
                      <Button variant="primary">
                        <i className="bi bi-envelope me-2"></i>
                        Email Support
                      </Button>
                      <Button variant="outline-primary">
                        <i className="bi bi-chat-dots me-2"></i>
                        Live Chat
                      </Button>
                      <Button variant="outline-secondary">
                        <i className="bi bi-book me-2"></i>
                        Documentation
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </div>
      <style>{`
        .sidebar-link.active, .sidebar-link:focus, .sidebar-link:hover {
          background: #e9ecef;
          color: #0d6efd;
          transform: translateX(4px);
        }
        .sidebar-link {
          color: #222;
          transition: all 0.2s ease;
        }
        .sidebar-link:hover {
          background: #f8f9fa;
          color: #0d6efd;
        }
        /* Hide scrollbar for Chrome, Safari and Opera */
        .sidebar-scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .sidebar-scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>

      {/* All Modals should be here at the root level of the return */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Profile</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            {editError && <Alert variant="danger">{editError}</Alert>}
            {editSuccess && <Alert variant="success">{editSuccess}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={profile?.email || ''} disabled readOnly />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Display Name</Form.Label>
              <Form.Control type="text" name="displayName" value={editData.displayName} onChange={handleEditChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control type="text" name="username" value={editData.username} onChange={handleEditChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Control type="text" name="location" value={editData.location} onChange={handleEditChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control type="tel" name="phoneNumber" value={editData.phoneNumber} onChange={handleEditChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Bio</Form.Label>
              <Form.Control 
                as="textarea" 
                name="bio" 
                value={editData.bio} 
                onChange={handleEditChange} 
                rows={2}
                placeholder="Tell us about yourself..."
                maxLength={100}
              />
              <Form.Text className="text-muted">
                {editData.bio.length}/100 characters
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEdit(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={editLoading}>
              {editLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Appeal Modal */}
      <Modal show={showAppealModal} onHide={() => setShowAppealModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Submit Copyright Appeal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAssetForAppeal && (
            <div className="mb-3">
              <strong>Asset:</strong> {selectedAssetForAppeal.title}
              <br />
              <strong>Strike Reason:</strong> {selectedAssetForAppeal.copyrightStrike.reason}
            </div>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Appeal Reason *</Form.Label>
            <Form.Control
              as="textarea"
              rows="4"
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              placeholder="Please provide a detailed reason for your appeal..."
              required
            />
            <Form.Text className="text-muted">
              Explain why you believe this copyright strike should be removed.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAppealModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAppealSubmit}
            disabled={appealLoading || !appealReason.trim()}
          >
            {appealLoading ? 'Submitting...' : 'Submit Appeal'}
          </Button>
        </Modal.Footer>
      </Modal>

      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
          {success}
        </Alert>
      )}

    </div>
  );
  }

export default CreatorDashboard; 