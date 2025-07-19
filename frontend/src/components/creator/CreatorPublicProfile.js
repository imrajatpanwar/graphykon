import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner, Button } from 'react-bootstrap';
import { FaImage } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import getApiConfig from '../../config/api';
import { ReactComponent as ArrowRightIcon } from '../image/arrow_right.svg';
import VerificationTick from '../common/VerificationTick';
import { ReactComponent as PremiumIcon } from '../image/premium_tag.svg';
import './CreatorPublicProfile.css';

function CreatorPublicProfile() {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFullBio, setShowFullBio] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    reviewText: '',
    isSubmitting: false
  });
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const navRef = useRef(null);
  const tabRefs = useRef({});

  // Calculate review statistics
  const getReviewStats = () => {
    if (reviews.length === 0) {
      return { totalReviews: 0, averageRating: 0 };
    }
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = (totalRating / reviews.length).toFixed(1);
    
    return {
      totalReviews: reviews.length,
      averageRating: parseFloat(averageRating)
    };
  };

  const { totalReviews, averageRating } = getReviewStats();

  useEffect(() => {
    const fetchCreatorProfile = async () => {
      try {
        setLoading(true);
        const apiConfig = getApiConfig();
        const response = await axios.get(`${apiConfig.baseURL}/api/creator/public/${username}`);
        setProfileData(response.data);
        
        // Check if current user is following this creator
        if (user && response.data.creator.followers) {
          const userId = user._id || user.id;
          setIsFollowing(response.data.creator.followers.includes(userId));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Creator not found');
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        const apiConfig = getApiConfig();
        const response = await axios.get(`${apiConfig.baseURL}/api/reviews/${username}`);
        setReviews(response.data.reviews || []);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
        // Don't show error for reviews, just keep empty array
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    if (username) {
      fetchCreatorProfile();
      fetchReviews();
    }
  }, [username, user]);

  // Update underline position when active tab changes
  useEffect(() => {
    const updateUnderlinePosition = () => {
      const activeTabElement = tabRefs.current[activeTab];
      const navContainer = navRef.current;
      
      if (activeTabElement && navContainer) {
        const navRect = navContainer.getBoundingClientRect();
        const tabRect = activeTabElement.getBoundingClientRect();
        
        // Calculate relative position within the nav container
        const relativeLeft = tabRect.left - navRect.left;
        
        setUnderlineStyle({
          left: relativeLeft + 16, // Add 16px gap from left
          width: tabRect.width - 32 // Reduce width to maintain symmetry (16px on each side)
        });
      }
    };

    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(updateUnderlinePosition, 10);
    
    // Add resize listener to update position on window resize
    const handleResize = () => updateUnderlinePosition();
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTab, profileData]); // Include profileData to trigger update after loading

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const handleFollow = async () => {
    if (!user) {
      setError('Please log in to follow creators');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (user.username === username) {
      return; // Can't follow yourself
    }

    setFollowLoading(true);
    try {
      const apiConfig = getApiConfig();
      const token = localStorage.getItem('token');
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      
      await axios.post(
        `${apiConfig.baseURL}/api/creator/${endpoint}/${username}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setIsFollowing(!isFollowing);
      
      // Update the follower count in the profile data
      const userId = user._id || user.id;
      setProfileData(prev => ({
        ...prev,
        creator: {
          ...prev.creator,
          followers: isFollowing 
            ? prev.creator.followers.filter(id => id !== userId)
            : [...(prev.creator.followers || []), userId]
        }
      }));

    } catch (err) {
      console.error('Follow operation failed:', err);
      setError(err.response?.data?.message || 'Failed to update follow status');
      setTimeout(() => setError(''), 3000);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!user) {
      setError('Please log in to send messages');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (user.username === username) {
      // This shouldn't happen since button is disabled, but handle gracefully
      navigate('/messages');
      return;
    }

    try {
      // Start a conversation with the creator
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please log in again to send messages');
        setTimeout(() => setError(''), 3000);
        return;
      }

      const apiConfig = getApiConfig();
      const response = await axios.post(
        `${apiConfig.baseURL}/api/messages/conversations/start`,
        { receiverId: creator._id },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        // Navigate to messages page
        navigate('/messages');
      }
    } catch (err) {
      console.error('Failed to start conversation:', err);
      
      if (err.response?.status === 401) {
        setError('Please log in again to send messages');
      } else {
        setError(err.response?.data?.message || 'Failed to start conversation');
      }
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleLeaveReview = () => {
    if (!user) {
      setError('Please log in to leave a review');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (user.username === username) {
      setError('You cannot review your own profile');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setShowReviewModal(true);
  };

  const handleReviewChange = (field, value) => {
    if (field === 'reviewText' && value.length > 500) {
      return; // Don't update if exceeding character limit
    }
    
    setReviewForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (!reviewForm.reviewText.trim()) {
      console.log('Review text is required');
      return;
    }

    setReviewForm(prev => ({ ...prev, isSubmitting: true }));

    try {
      const token = localStorage.getItem('token');
      
      console.log('Submitting review with data:', {
        creatorUsername: username,
        rating: reviewForm.rating,
        reviewText: reviewForm.reviewText
      });
      console.log('Auth token:', token ? 'Token exists' : 'No token found');
      
      // Submit review to backend
      const apiConfig = getApiConfig();
      const response = await axios.post(
        `${apiConfig.baseURL}/api/reviews`,
        {
          creatorUsername: username,
          rating: reviewForm.rating,
          reviewText: reviewForm.reviewText
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('Review submission successful:', response.data);
      
      // Add the new review to the reviews state (response should include the full review object)
      if (response.data.review) {
        setReviews(prev => [response.data.review, ...prev]);
      }
      
      // Close modal and reset form
      setShowReviewModal(false);
      setReviewForm({
        rating: 5,
        reviewText: '',
        isSubmitting: false
      });
      
    } catch (err) {
      console.error('Review submission failed - Full error:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || 'Failed to submit review. Please try again.';
      console.error('Review submission error:', errorMessage);
    } finally {
      setReviewForm(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setReviewForm({
      rating: 5,
      reviewText: '',
      isSubmitting: false
    });
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading creator profile...</p>
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger text-center">
          <h4>Creator Not Found</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const { creator, assets } = profileData;

  return (
    <div className="creator-profile-container">
      {/* Temporary Error Message */}
      {error && profileData && (
        <div className="alert alert-warning alert-dismissible fade show mx-3 mt-3" role="alert">
          {error}
        </div>
      )}
      
      {/* Creator Header Section */}
      <div className="position-relative">
        {/* Cover Image - Full Width */}
        <div 
          className={`position-relative creator-cover-section ${!creator.coverImage ? 'creator-cover-fallback' : ''}`}
          style={creator.coverImage ? {
            backgroundImage: `url(${getApiConfig().baseURL}/${creator.coverImage})`
          } : {}}
        >
          {/* Username in bottom right */}
          <div className="position-absolute bottom-0 end-0 p-3">
            <span className="text-white creator-username-badge px-2 py-1 rounded-pill">
              @{creator.username}
            </span>
          </div>
          
          {/* Profile Picture positioned at bottom left */}
          <div className="position-absolute creator-profile-picture">
            <img
              src={creator.profileImage ? `${getApiConfig().baseURL}/${creator.profileImage}` : 'https://via.placeholder.com/120'}
              alt={creator.displayName}
              className="rounded-circle border border-white border-4 creator-profile-picture"
            />
          </div>
        </div>
        
        {/* Profile Content */}
        <div className="creator-profile-content">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div className="creator-profile-info">
              <h2 className="mb-2 fw-bold creator-display-name d-flex align-items-center">
                {creator.displayName}
                <VerificationTick user={creator} size={20} />
              </h2>
              <div className="text-muted mb-2">
                <span style={{ fontWeight: '600', color: '#000' }}>@{creator.username}</span>{' '}
                • {formatNumber(creator.followers?.length || 0)} Followers{' '}
                • {assets.length} Assets
              </div>
              {creator.bio && (
                <div className="mb-0">
                  <span style={{ color: '#666' }}>
                    {showFullBio || creator.bio.length <= 100 ? (
                      creator.bio
                    ) : (
                      <>
                        {creator.bio.substring(0, 100)}
                        <span>
                          ...{' '}
                          <button 
                            className="btn btn-link p-0 text-decoration-none creator-bio-button"
                            onClick={() => setShowFullBio(true)}
                          >
                            More
                          </button>
                        </span>
                      </>
                    )}
                    {showFullBio && creator.bio.length > 100 && (
                      <span>
                        <button 
                          className="btn btn-link p-0 text-decoration-none ms-1 creator-bio-button"
                          onClick={() => setShowFullBio(false)}
                        >
                          Less
                        </button>
                      </span>
                    )}
                  </span>
                </div>
              )}

            </div>
            
            {/* Action Buttons */}
            {user && (
              <div className="d-flex gap-2">
                {/* Chat Button - Show for all logged-in users */}
                <Button 
                  variant={user.username === username ? "outline-secondary" : "outline-primary"}
                  className="rounded-pill px-4 py-2 creator-chat-btn"
                  onClick={handleStartChat}
                  disabled={user.username === username}
                >
                  <i className="fas fa-comments me-2"></i>
                  {user.username === username ? 'Your Profile' : 'Chat'}
                </Button>
                
                {/* Follow Button - Only show for other users */}
                {user.username !== username && (
                  <Button 
                    variant={isFollowing ? "outline-dark" : "dark"}
                    className="rounded-pill px-4 py-2 creator-follow-btn"
                    onClick={handleFollow}
                    disabled={followLoading}
                  >
                    {followLoading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        {isFollowing ? 'Unfollowing...' : 'Following...'}
                      </>
                    ) : (
                      isFollowing ? 'Following' : 'Follow'
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Divider */}
        <hr className="m-0 creator-divider" />
      </div>

      {/* Tab Navigation */}
      <div className="container-fluid px-4 py-3 position-relative">
        <nav ref={navRef} className="nav nav-tabs border-0 justify-content-start position-relative creator-nav-container" style={{ paddingLeft: '180px' }}>
          {['Home', 'Assets', 'Case Study', 'Client Reviews', 'About Creator'].map((tab) => (
            <button
              key={tab}
              ref={(el) => tabRefs.current[tab] = el}
              className={`nav-link border-0 px-4 py-2 me-3 ${
                activeTab === tab 
                  ? 'active text-dark fw-semibold' 
                  : 'text-muted'
              }`}
              style={{
                backgroundColor: 'transparent',
                borderRadius: '0',
                border: 'none',
                transition: 'color 0.3s ease'
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
          
          {/* Animated Underline */}
          <div
            style={{
              position: 'absolute',
              bottom: '2px',
              left: underlineStyle.left,
              width: underlineStyle.width,
              height: '2px',
              backgroundColor: '#000',
              transition: 'left 0.3s ease, width 0.3s ease',
              zIndex: 10
            }}
          />
          
          {/* Horizontal Line Below Underline */}
          <div
            style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              right: '0',
              height: '2px',
              backgroundColor: '#e0e0e0',
              zIndex: 5
            }}
          />
        </nav>
      </div>

      {/* Tab Content */}
      <div className="creator-assets-section">
        {activeTab === 'Home' && (
          <div className="container px-4">
            <div className="row">
              <div className="col-lg-8">
                <h4 className="mb-4">Welcome to {creator.displayName}'s Profile</h4>
                <div className="mb-4">
                  <h6 className="text-muted mb-3">About</h6>
                  <p>{creator.bio || 'No bio available yet.'}</p>
                </div>
                <div className="mb-4">
                  <h6 className="text-muted mb-3">Recent Work</h6>
                  <div className="row">
                    {assets.slice(0, 6).map((asset) => (
                      <div key={asset._id} className="col-md-4 mb-3">
                        <div className="position-relative rounded overflow-hidden creator-asset-card" style={{ height: '150px' }}>
                          {asset.showcaseImages && asset.showcaseImages.length > 0 ? (
                            <img
                              src={`${getApiConfig().baseURL}/${asset.showcaseImages[0]}`}
                              alt={asset.title}
                              className="w-100 h-100"
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="d-flex align-items-center justify-content-center h-100 bg-light">
                              <FaImage className="text-muted" />
                            </div>
                          )}
                          {/* Premium Icon */}
                          {asset.license === 'Premium' && (
                            <div 
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                width: '18px',
                                height: '18px',
                                zIndex: 10
                              }}
                            >
                              <PremiumIcon style={{ width: '100%', height: '100%' }} />
                            </div>
                          )}
                        </div>
                        <p className="small mt-2 mb-0">{asset.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="col-lg-4">
                <div className="bg-light rounded p-4">
                  <h6 className="mb-3">Stats</h6>
                  <div className="mb-2">
                    <strong>{formatNumber(creator.followers?.length || 0)}</strong> Followers
                  </div>
                  <div className="mb-2">
                    <strong>{assets.length}</strong> Assets
                  </div>
                  <div className="mb-2">
                    <strong>{creator.location || 'Location not specified'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Assets' && (
          <>
            {assets.length === 0 ? (
              <div className="text-center creator-no-assets">
                <h5>No Assets Yet</h5>
                <p className="text-muted">This creator hasn't uploaded any assets yet.</p>
              </div>
            ) : (
              <div className="row creator-asset-grid">
                {assets.map((asset) => (
                  <div key={asset._id} className="col-6 col-md-4 col-lg-3">
                    <div className="position-relative rounded overflow-hidden creator-asset-card">
                      {asset.showcaseImages && asset.showcaseImages.length > 0 ? (
                        <img
                          src={`${getApiConfig().baseURL}/${asset.showcaseImages[0]}`}
                          alt={asset.title}
                          className="w-100 h-100"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="d-flex align-items-center justify-content-center h-100">
                          <FaImage className="text-muted creator-asset-placeholder" />
                        </div>
                      )}
                      
                      {/* Premium Icon */}
                      {asset.license === 'Premium' && (
                        <div 
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '20px',
                            height: '20px',
                            zIndex: 10
                          }}
                        >
                          <PremiumIcon style={{ width: '100%', height: '100%' }} />
                        </div>
                      )}
                      
                      {/* License Badge */}
                      <div className="position-absolute creator-license-badge">
                        <span 
                          className={`badge ${asset.license === 'Free' ? 'bg-success' : 'bg-warning text-dark'} rounded-pill creator-license-badge`}
                        >
                          {asset.license}
                        </span>
                      </div>
                      
                      {/* Hover overlay with title */}
                      <div className="position-absolute bottom-0 start-0 end-0 p-2 creator-asset-overlay">
                        <div className="fw-semibold creator-asset-title">
                          {asset.title}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'Case Study' && (
          <div className="container px-4">
            <div className="text-center py-5">
              <h5>Case Studies</h5>
              <p className="text-muted">No case studies available yet.</p>
              <small className="text-muted">This section will showcase detailed project breakdowns and design processes.</small>
            </div>
          </div>
        )}

        {activeTab === 'Client Reviews' && (
          <div className="container px-4">
            {/* Reviews Header */}
            <div className="reviews-header-simple d-flex justify-content-between align-items-start mb-4">
              <div className="reviews-stats-left">
                <div className="total-reviews">
                  <p className="reviews-label mb-1">Total Reviews</p>
                  <h2 className="reviews-count mb-1">{totalReviews}</h2>
                  <small className="growth-text text-muted">Growth in reviews</small>
                </div>
              </div>
              
              <div className="reviews-divider"></div>
              
              <div className="average-rating-right">
                <p className="rating-label mb-1">Average Rating</p>
                <div className="d-flex align-items-center mb-1">
                  <h2 className="rating-score mb-0 me-2">{averageRating || '0.0'}</h2>
                  <div className="stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={`star ${star <= averageRating ? 'filled' : ''}`}>★</span>
                    ))}
                  </div>
                </div>
                <small className="average-text text-muted">Average rating</small>
              </div>

              <div className="leave-review-section">
                <button className="leave-review-container d-flex align-items-center" onClick={handleLeaveReview}>
                  <div className="arrow-icon me-3">
                    <div className="arrow-circle">
                      <ArrowRightIcon />
                    </div>
                  </div>
                  <div>
                    <p className="review-prompt mb-0">Your thoughts matter</p>
                    <span className="leave-review-btn">Leave a Review</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Reviews Grid */}
            <div className="reviews-grid">
              {reviewsLoading ? (
                <div className="reviews-loading text-center py-5">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading reviews...</span>
                  </Spinner>
                  <p className="mt-3 text-muted">Loading reviews...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="no-reviews text-center py-5">
                  <h5>No reviews yet</h5>
                  <p className="text-muted">Be the first to leave a review for this creator!</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review._id || review.id} className="review-card">
                    <div className="review-stars mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={`star ${star <= review.rating ? 'filled' : ''}`}>★</span>
                      ))}
                    </div>
                    <p className="review-text">
                      {review.reviewText}
                    </p>
                    <div className="reviewer-info d-flex align-items-center">
                      <img 
                        src={review.reviewer?.profileImage ? `${getApiConfig().baseURL}/${review.reviewer.profileImage}` : 'https://via.placeholder.com/40'} 
                        alt={review.reviewer?.displayName || review.reviewer?.username} 
                        className="reviewer-avatar me-2" 
                      />
                      <div>
                        <span className="reviewer-name">{review.reviewer?.displayName || review.reviewer?.username}</span>
                        <small className="review-time text-muted d-block">@{review.reviewer?.username}</small>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'About Creator' && (
          <div className="container px-4">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <h4 className="mb-4">About {creator.displayName}</h4>
                <div className="mb-4">
                  <h6 className="text-muted mb-3">Bio</h6>
                  <p>{creator.bio || 'No detailed bio available yet.'}</p>
                </div>
                <div className="mb-4">
                  <h6 className="text-muted mb-3">Contact Information</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <p><strong>Username:</strong> @{creator.username}</p>
                    </div>
                    <div className="col-md-6">
                      <p><strong>Location:</strong> {creator.location || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <h6 className="text-muted mb-3">Statistics</h6>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="text-center p-3 bg-light rounded">
                        <h5 className="mb-1">{formatNumber(creator.followers?.length || 0)}</h5>
                        <small className="text-muted">Followers</small>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-center p-3 bg-light rounded">
                        <h5 className="mb-1">{assets.length}</h5>
                        <small className="text-muted">Assets</small>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-center p-3 bg-light rounded">
                        <h5 className="mb-1">{creator.isCreator ? 'Active' : 'Inactive'}</h5>
                        <small className="text-muted">Status</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="review-modal-overlay" onClick={closeReviewModal}>
          <div className="review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="review-modal-header">
              <h5 className="mb-0">Leave a Review for {creator.displayName}</h5>
              <button className="close-btn" onClick={closeReviewModal}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleReviewSubmit} className="review-form">
              <div className="rating-section mb-3">
                <label className="form-label">Rating</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${star <= reviewForm.rating ? 'active' : ''}`}
                      onClick={() => handleReviewChange('rating', star)}
                    >
                      ★
                    </button>
                  ))}
                  <span className="rating-text ms-2">({reviewForm.rating}/5)</span>
                </div>
              </div>

              <div className="review-text-section mb-4">
                <label htmlFor="reviewText" className="form-label">Your Review</label>
                <textarea
                  id="reviewText"
                  className="form-control"
                  rows="4"
                  placeholder="Share your experience working with this creator..."
                  value={reviewForm.reviewText}
                  onChange={(e) => handleReviewChange('reviewText', e.target.value)}
                  required
                />
                <small className="text-muted">
                  {reviewForm.reviewText.length}/500 characters
                </small>
              </div>

              <div className="modal-actions d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closeReviewModal}
                  disabled={reviewForm.isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-dark"
                  disabled={reviewForm.isSubmitting}
                >
                  {reviewForm.isSubmitting ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreatorPublicProfile; 