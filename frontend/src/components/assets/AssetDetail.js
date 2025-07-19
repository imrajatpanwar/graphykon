import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Spinner, Alert, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { ReactComponent as DownloadIcon } from '../image/download_icon.svg';
import { ReactComponent as ShareIcon } from '../image/share.svg';
import { ReactComponent as ViewEyeIcon } from '../image/view_eye.svg';
import { ReactComponent as PremiumIcon } from '../image/premium_tag.svg';
import { FaEdit } from 'react-icons/fa';
import getApiConfig from '../../config/api';

function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user } = useAuth();
  const viewCountedRef = useRef(false);
  const currentAssetIdRef = useRef(null);

  useEffect(() => {
    let isCancelled = false;
    
    const fetchAsset = async () => {
      setLoading(true);
      
      // Check if this is a new asset or if we haven't counted the view yet
      const isNewAsset = currentAssetIdRef.current !== id;
      
      if (isNewAsset) {
        currentAssetIdRef.current = id;
        viewCountedRef.current = false;
      }
      
      try {
        const apiConfig = getApiConfig();
        
        // Increment view count only once per asset
        if (!viewCountedRef.current && !isCancelled) {
          viewCountedRef.current = true;
          await axios.post(`${apiConfig.baseURL}/api/assets/${id}/view`);
        }
        
        if (isCancelled) return;
        
        // Get asset details
        const response = await axios.get(`${apiConfig.baseURL}/api/assets/${id}`);
        if (!isCancelled) {
          setAsset(response.data);
          setCurrentImageIndex(0); // Reset to first image when asset changes
          
          // Fetch creator profile with follow info
          if (response.data.creator?._id) {
            fetchCreatorProfile(response.data.creator._id);
          }
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to load asset:', error);
          setError('Failed to load asset');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchAsset();
    
    return () => {
      isCancelled = true;
    };
  }, [id]);

  const fetchCreatorProfile = async (creatorId) => {
    try {
      const apiConfig = getApiConfig();
      const response = await axios.get(`${apiConfig.baseURL}/api/auth/user/${creatorId}`);
      setCreatorProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch creator profile:', error);
    }
  };

  const handleFollow = async (creatorId) => {
    if (!user) {
      alert('Please login to follow creators');
      return;
    }

    setFollowLoading(true);

    const originalProfile = creatorProfile;
    const currentUserId = user?._id || user?.id;
    const isFollowing = originalProfile?.followers?.some(f => String(f._id) === String(currentUserId));

    // Optimistic UI update
    setCreatorProfile(p => {
      if (!p) return null;
      const newFollowers = isFollowing
        ? p.followers.filter(f => String(f._id) !== String(currentUserId))
        : [...p.followers, { _id: currentUserId, username: user.username, displayName: user.displayName }];
      return { ...p, followers: newFollowers };
    });

    try {
      const apiConfig = getApiConfig();
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      await axios.post(`${apiConfig.baseURL}/api/auth/${endpoint}/${creatorId}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Re-fetch from server to ensure data is in sync
      fetchCreatorProfile(creatorId);
      console.log('Dispatching followersUpdated event from AssetDetail.js');
      window.dispatchEvent(new Event('followersUpdated'));
    } catch (error) {
      console.error('Failed to follow/unfollow, reverting.', error.response?.data?.message || error.message);
      // Revert on error
      setCreatorProfile(originalProfile);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!asset.assetFile) {
      alert('No asset file available for download');
      return;
    }

    setDownloadLoading(true);
    try {
      const apiConfig = getApiConfig();
      // Increment download count (with duplicate detection)
      const downloadResponse = await axios.post(`${apiConfig.baseURL}/api/assets/${asset._id}/download`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const { downloadCount, alreadyDownloaded, message, earningsRecorded } = downloadResponse.data;
      
      // Update the asset in the local state to reflect the current download count
      setAsset(prev => ({ ...prev, downloadCount: downloadCount }));
      
      // Show appropriate message to user
      if (alreadyDownloaded) {
        alert(message || 'You have already downloaded this asset');
        // Don't proceed with download if already downloaded
        return;
      } else {
        // Show success message for new downloads
        if (earningsRecorded) {
          console.log('Premium download recorded - earnings generated for creator');
        }
      }
      
      // Fetch the file as blob to force download without preview
      const response = await fetch(`${apiConfig.baseURL}/${asset.assetFile}`);
      const blob = await response.blob();
      
      // Create blob URL and download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = asset.title || 'asset';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      window.URL.revokeObjectURL(blobUrl);
      
      // Show success message
      if (message) {
        console.log(message);
      }
      
    } catch (error) {
      console.error('Failed to download:', error);
      
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        alert('Please log in to download assets');
        return;
      }
      
      // For other errors, show the error message or proceed with fallback download
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      }
      
      // Fallback to direct link method (for cases where counting fails but file is available)
      const apiConfig = getApiConfig();
      const link = document.createElement('a');
      link.href = `${apiConfig.baseURL}/${asset.assetFile}`;
      link.download = asset.title || 'asset';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: asset.title,
      text: asset.description,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
      // Final fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch (clipboardError) {
        console.error('Clipboard copy failed:', clipboardError);
      }
    }
  };

  const handleCreatorClick = (creatorUsername) => {
    if (creatorUsername) {
      navigate(`/${creatorUsername}`);
    }
  };

  if (loading) {
    return (
      <Container className="py-2">
        <div className="text-center my-4">
          <Spinner animation="border" />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-2">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!asset) {
    return (
      <Container className="py-2">
        <Alert variant="warning">Asset not found</Alert>
      </Container>
    );
  }

  return (
    <Container fluid style={{ fontFamily: 'Inter, sans-serif', padding: '25px 0px', maxWidth: '1400px', margin: '0px auto' }}>
      <Row className="g-5">
        {/* Left Column - Image */}
        <Col lg={7}>
          <div 
            className="position-relative"
            style={{ 
              width: '100%',
              height: '500px',
              backgroundColor: '#d3d3d3',
              borderRadius: '12px',
              border: 'none'
            }}
          >
            {asset.showcaseImages && asset.showcaseImages.length > 0 && (
              <img
                src={`${getApiConfig().baseURL}/${asset.showcaseImages[currentImageIndex]}`}
                alt={asset.title}
                style={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '12px'
                }}
              />
            )}
            
            {/* Premium Icon */}
            {asset.license === 'Premium' && (
              <div 
                style={{
                  position: 'absolute',
                  top: '0px',
                  right: '12px',
                  width: '70px',
                  height: '70px',
                  zIndex: 10,
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/pricing');
                }}
                title="Premium Asset - View Pricing"
              >
                <PremiumIcon style={{ width: '100%', height: '100%' }} />
              </div>
            )}
            
            {/* Navigation Arrows - Only show if multiple images */}
            {asset?.showcaseImages && asset.showcaseImages.length > 1 && (
              <>
                <button
                  onClick={() => {
                    setCurrentImageIndex(prev => 
                      prev === 0 ? asset.showcaseImages.length - 1 : prev - 1
                    );
                  }}
                  style={{
                    position: 'absolute',
                    left: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0, 0, 0, 0.7)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: 'white',
                    zIndex: 2,
                    transition: 'all 0.2s ease',
                    opacity: 0.8
                  }}
                  onMouseOver={(e) => {
                    e.target.style.opacity = '1';
                    e.target.style.background = 'rgba(0, 0, 0, 0.9)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.opacity = '0.8';
                    e.target.style.background = 'rgba(0, 0, 0, 0.7)';
                  }}
                >
                  ‹
                </button>
                
                <button
                  onClick={() => {
                    setCurrentImageIndex(prev => 
                      prev === asset.showcaseImages.length - 1 ? 0 : prev + 1
                    );
                  }}
                  style={{
                    position: 'absolute',
                    right: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0, 0, 0, 0.7)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: 'white',
                    zIndex: 2,
                    transition: 'all 0.2s ease',
                    opacity: 0.8
                  }}
                  onMouseOver={(e) => {
                    e.target.style.opacity = '1';
                    e.target.style.background = 'rgba(0, 0, 0, 0.9)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.opacity = '0.8';
                    e.target.style.background = 'rgba(0, 0, 0, 0.7)';
                  }}
                >
                  ›
                </button>
              </>
            )}
            
            {/* Image indicators/dots - Only show if multiple images */}
            {asset?.showcaseImages && asset.showcaseImages.length > 1 && (
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '8px',
                zIndex: 2
              }}>
                {asset.showcaseImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    style={{
                      width: currentImageIndex === index ? '24px' : '8px',
                      height: '8px',
                      borderRadius: '4px',
                      border: 'none',
                      background: currentImageIndex === index 
                        ? 'rgba(255, 255, 255, 0.9)' 
                        : 'rgba(255, 255, 255, 0.5)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </Col>

        {/* Right Column - Asset Info */}
        <Col lg={5}>
          <div style={{ position: 'relative' }}>
            {/* Three dots menu */}
            <div style={{ 
              position: 'absolute', 
              top: '0', 
              right: '0',
              fontSize: '24px',
              fontWeight: 'bold',
              cursor: 'pointer',
              padding: '8px'
            }}>
              ⋮
            </div>

            {/* Category */}
            <div style={{ 
              color: '#6b7280', 
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px'
            }}>
              {asset.category || 'Motion Graphics'}
            </div>

            {/* Title */}
            <h1 style={{ 
              fontSize: '36px', 
              fontWeight: '700', 
              lineHeight: '1.2',
              marginBottom: '16px',
              color: '#000',
              letterSpacing: '-0.02em'
            }}>
              {asset.title}
            </h1>

            {/* Description */}
            <p style={{ 
              fontSize: '14px', 
              lineHeight: '1.6',
              color: '#374151',
              marginBottom: '20px'
            }}>
              {asset.description}
            </p>

            {/* Keywords/Tags */}
            {asset.keywords && (
              <div style={{ marginBottom: '24px' }}>
                <div className="d-flex flex-wrap gap-2">
                  {asset.keywords.split(',').slice(0, 3).map((keyword, index) => (
                    <button
                      key={index}
                      style={{
                        padding: '6px 16px',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '20px',
                        fontSize: '12px',
                        color: '#374151',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#e5e7eb';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = '#f3f4f6';
                      }}
                    >
                      {keyword.trim()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Asset Details in Grid */}
            <div style={{ 
              marginBottom: '24px',
              fontSize: '14px',
              lineHeight: '1.8'
            }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr',
                gap: '8px 40px'
              }}>
                <div>
                  <span style={{ color: '#000', fontWeight: '600' }}>Format : </span>
                  <span style={{ color: '#6b7280' }}>
                    {asset.format && asset.format.length > 0 ? asset.format.join(', ') : 'JPG, PSD, PDF'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#000', fontWeight: '600' }}>Created : </span>
                  <span style={{ color: '#6b7280' }}>
                    {new Date(asset.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: '2-digit' 
                    })}
                  </span>
                </div>
                
                <div>
                  <span style={{ color: '#000', fontWeight: '600' }}>Dimension: </span>
                  <span style={{ color: '#6b7280' }}>
                    {asset.dimension?.width || 4000}px x {asset.dimension?.height || 4000}px
                  </span>
                </div>
                <div>
                  <span style={{ color: '#000', fontWeight: '600' }}>Credit : </span>
                  <span style={{ color: '#6b7280' }}>
                    {asset.creditRequired ? asset.creditText || 'Required' : 'Not-Required'}
                  </span>
                  {asset.creditRequired && (
                    <>
                      <br />
                      <button
                        type="button"
                        onClick={() => alert('Please credit this asset by mentioning the creator when using it.')}
                        style={{ 
                          color: '#3b82f6', 
                          textDecoration: 'underline',
                          fontSize: '14px',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer'
                        }}
                      >
                        How to Credit?
                      </button>
                    </>
                  )}
                </div>
                
                <div style={{ gridColumn: 'span 1' }}>
                  <span style={{ color: '#000', fontWeight: '600' }}>File Size : </span>
                  <span style={{ color: '#6b7280' }}>
                    {asset.fileSize || '30MB'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#000', fontWeight: '600' }}>License : </span>
                  <span style={{ 
                    color: asset.license === 'Premium' ? '#d97706' : '#059669',
                    fontWeight: '600'
                  }}>
                    {asset.license || 'Free'}
                  </span>
                </div>
              </div>
            </div>

                         {/* View and Download Stats */}
             <div style={{ 
               display: 'flex', 
               alignItems: 'center', 
               gap: '24px',
               marginBottom: '24px',
               fontSize: '14px',
               color: '#6b7280'
             }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <ViewEyeIcon width="16" height="16" />
                 <span>{(asset.viewCount || 7000).toLocaleString()} Views</span>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <span>⬇</span>
                 <span>{(asset.downloadCount || 250).toLocaleString()} Downloads</span>
               </div>
             </div>

            {/* Action Buttons */}
            <div className="d-flex gap-3 mb-4">
              {/* Edit Button - Only show to asset owner */}
              {user && (user._id === asset.creator?._id || user.id === asset.creator?._id) && (
                <Button 
                  variant="outline-primary" 
                  onClick={() => navigate('/creator-dashboard', { state: { activeSection: 'uploads', editAssetId: asset._id } })}
                  style={{ 
                    borderRadius: '8px',
                    padding: '12px 20px',
                    fontWeight: '600',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderColor: '#3b82f6',
                    color: '#3b82f6'
                  }}
                >
                  <FaEdit />
                  Edit Asset
                </Button>
              )}
              
              <Button 
                variant="dark" 
                onClick={handleDownload}
                disabled={downloadLoading || !asset.assetFile}
                style={{ 
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#000',
                  borderColor: '#000'
                }}
              >
                {downloadLoading ? (
                  <>
                    <Spinner size="sm" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <DownloadIcon width="16" height="16" />
                    Download
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline-secondary" 
                onClick={handleShare}
                style={{ 
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderColor: '#d1d5db',
                  color: '#374151',
                  backgroundColor: 'transparent'
                }}
              >
                <ShareIcon width="16" height="16" />
                Share
              </Button>
            </div>

            {/* Creator Profile */}
            <div style={{ 
              borderTop: '1px solid #e5e7eb',
              paddingTop: '24px'
            }}>
              <div className="d-flex align-items-center justify-content-between">
                <div 
                  className="d-flex align-items-center"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleCreatorClick(asset.creator?.username)}
                >
                  {asset.creator?.profileImage ? (
                    <img
                      src={`${getApiConfig().baseURL}/${asset.creator.profileImage}`}
                      alt={asset.creator.displayName || asset.creator.username}
                      style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '50%', 
                        objectFit: 'cover',
                        marginRight: '12px'
                      }}
                    />
                  ) : (
                    <div 
                      style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '50%', 
                        backgroundColor: '#e5e7eb',
                        marginRight: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <span style={{ color: '#9ca3af', fontSize: '18px' }}>👤</span>
                    </div>
                  )}
                  <div>
                    <div style={{ 
                      fontWeight: '600', 
                      fontSize: '16px', 
                      marginBottom: '2px',
                      color: '#000'
                    }}>
                      {asset.creator?.displayName || asset.creator?.username || 'Your Name'}
                    </div>
                    <div style={{ 
                      color: '#6b7280', 
                      fontSize: '14px'
                    }}>
                      {creatorProfile?.followers?.length || 1} followers
                    </div>
                  </div>
                </div>
                
                {user && (user._id || user.id) !== asset.creator?._id && (
                  <Button
                    variant="dark"
                    size="sm"
                    onClick={() => handleFollow(asset.creator._id)}
                    disabled={followLoading}
                    style={{ 
                      borderRadius: '8px',
                      fontWeight: '600',
                      padding: '8px 16px',
                      fontSize: '14px',
                      backgroundColor: '#000',
                      borderColor: '#000'
                    }}
                  >
                    {followLoading ? (
                      <Spinner size="sm" />
                    ) : (
                      creatorProfile?.followers?.some(follower => String(follower._id) === String(user._id || user.id)) ? "Following" : "Follow"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default AssetDetail; 