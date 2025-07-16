import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { FaBell } from 'react-icons/fa';
import GraphykonLogo from '../image/Graphykon_logo.svg';
import DefaultProfileImage from '../image/default-profile.svg';
import TrendingIcon from '../image/trending.svg';
import PhotographyIcon from '../image/photography.svg';
import GraphicDesignIcon from '../image/graphic_design.svg';
import UIUXIcon from '../image/UI_UX_Design.svg';
import IllustrationIcon from '../image/illustrake.svg';
import Art3DIcon from '../image/3D_Art.svg';
import ArrowRightIcon from '../image/arrow_right.svg';

function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [isCreator, setIsCreator] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [profileDropdownTimeout, setProfileDropdownTimeout] = useState(null);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'New Asset Uploaded',
      message: 'Your asset "Design Template" has been approved',
      time: '2 minutes ago',
      isRead: false,
      type: 'success'
    },
    {
      id: 2,
      title: 'Payment Received',
      message: 'You received $25.00 for your asset download',
      time: '1 hour ago',
      isRead: false,
      type: 'payment'
    },
    {
      id: 3,
      title: 'New Follower',
      message: 'John Doe started following you',
      time: '3 hours ago',
      isRead: true,
      type: 'follow'
    }
  ]);

  useEffect(() => {
    const fetchCreatorStatus = async () => {
      if (user) {
        try {
          const response = await axios.get('http://localhost:5000/api/creator/profile', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          setIsCreator(!!response.data.isCreator);
        } catch (err) {
          setIsCreator(false);
        }
      } else {
        setIsCreator(false);
      }
    };
    fetchCreatorStatus();
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleProfileImageError = (e) => {
    e.target.src = DefaultProfileImage;
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const handleNotificationClick = (notificationId) => {
    setNotifications(notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: true }
        : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => 
      ({ ...notification, isRead: true })
    ));
  };

  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleProfileMouseEnter = () => {
    if (profileDropdownTimeout) {
      clearTimeout(profileDropdownTimeout);
      setProfileDropdownTimeout(null);
    }
    setShowProfileDropdown(true);
  };

  const handleProfileMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowProfileDropdown(false);
    }, 200); // 200ms delay
    setProfileDropdownTimeout(timeout);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-dropdown')) {
        setShowNotifications(false);
      }
      if (showProfileDropdown && !event.target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false);
        if (profileDropdownTimeout) {
          clearTimeout(profileDropdownTimeout);
          setProfileDropdownTimeout(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showProfileDropdown, profileDropdownTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (profileDropdownTimeout) {
        clearTimeout(profileDropdownTimeout);
      }
    };
  }, [profileDropdownTimeout]);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white" style={{ borderBottom: '1px solid #e0e0e0', fontFamily: 'Poppins, sans-serif', position: 'sticky', top: 0, zIndex: 1050 }}>
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center ms-4" to="/">
          <img 
            src={GraphykonLogo} 
            alt="Graphykon" 
            style={{ height: '16px', width: 'auto' }}
          />
        </Link>

        {/* Main Navigation Menu */}
        <div className="d-none d-lg-flex align-items-center me-4 ms-3">
          <div className="dropdown me-4 explore-dropdown-custom" style={{ position: 'relative' }}>
            <button 
              className="btn btn-link text-decoration-none p-0 dropdown-toggle"
              type="button"
              id="exploreDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{
                color: 'rgb(51, 51, 51)',
                fontWeight: '500',
                fontSize: '14px',
                border: 'none',
                background: 'transparent'
              }}
            >
              Explore
            </button>
            <div className="explore-dropdown-menu" style={{
              display: 'none',
              position: 'absolute',
              left: 0,
              top: '100%',
              zIndex: 1000,
              minWidth: '420px',
              background: '#fff',
              borderRadius: '18px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
              padding: '28px 32px',
              marginTop: '12px',
              border: 'none',
              fontFamily: 'Poppins, sans-serif',
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px 36px', width: '100%' }}>
                <div style={{ flex: '1 1 180px', minWidth: '180px' }}>
                  <Link to="/trending" className="explore-menu-item" style={{
                    display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255, 0, 0, 0.04)', borderRadius: '12px', padding: '12px 18px', marginBottom: '10px', textDecoration: 'none', color: '#222', boxShadow: 'none', border: 'none', transition: 'background 0.2s',
                  }}>
                    <img src={TrendingIcon} alt="Trending" style={{ width: 36, height: 36 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '1.08rem', color: '#e53935' }}>Trending</div>
                      <div style={{ fontSize: '0.93rem', color: '#b71c1c', opacity: 0.7 }}>Beautiful crafted prints</div>
                    </div>
                    <img src={ArrowRightIcon} alt="Go" style={{ width: 18, height: 18, marginLeft: 8, color: '#e53935' }} />
                  </Link>
                  <Link to="/graphic-design" className="explore-menu-item" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '12px', padding: '12px 18px', marginBottom: '10px', textDecoration: 'none', color: '#222', transition: 'background 0.2s' }}>
                    <img src={GraphicDesignIcon} alt="Graphic Design" style={{ width: 36, height: 36 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '1.08rem', color: '#2563eb' }}>Graphic Design</div>
                      <div style={{ fontSize: '0.93rem', color: '#2563eb', opacity: 0.7 }}>Get creative inspiration</div>
                    </div>
                    <img src={ArrowRightIcon} alt="Go" style={{ width: 18, height: 18, marginLeft: 8, color: '#2563eb' }} />
                  </Link>
                  <Link to="/illustration" className="explore-menu-item" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '12px', padding: '12px 18px', marginBottom: '10px', textDecoration: 'none', color: '#222', transition: 'background 0.2s' }}>
                    <img src={IllustrationIcon} alt="Illustration" style={{ width: 36, height: 36 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '1.08rem', color: '#2563eb' }}>Illustration</div>
                      <div style={{ fontSize: '0.93rem', color: '#2563eb', opacity: 0.7 }}>Artistic visual expression</div>
                    </div>
                    <img src={ArrowRightIcon} alt="Go" style={{ width: 18, height: 18, marginLeft: 8, color: '#2563eb' }} />
                  </Link>
                </div>
                <div style={{ flex: '1 1 180px', minWidth: '180px' }}>
                  <Link to="/photography" className="explore-menu-item" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '12px', padding: '12px 18px', marginBottom: '10px', textDecoration: 'none', color: '#222', transition: 'background 0.2s' }}>
                    <img src={PhotographyIcon} alt="Photography" style={{ width: 36, height: 36 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '1.08rem', color: '#2563eb' }}>Photography</div>
                      <div style={{ fontSize: '0.93rem', color: '#2563eb', opacity: 0.7 }}>Impactful storytelling</div>
                    </div>
                    <img src={ArrowRightIcon} alt="Go" style={{ width: 18, height: 18, marginLeft: 8, color: '#2563eb' }} />
                  </Link>
                  <Link to="/ui-ux-design" className="explore-menu-item" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '12px', padding: '12px 18px', marginBottom: '10px', textDecoration: 'none', color: '#222', transition: 'background 0.2s' }}>
                    <img src={UIUXIcon} alt="UI/UX Design" style={{ width: 36, height: 36 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '1.08rem', color: '#2563eb' }}>UI/UX Design</div>
                      <div style={{ fontSize: '0.93rem', color: '#2563eb', opacity: 0.7 }}>Stunning web design</div>
                    </div>
                    <img src={ArrowRightIcon} alt="Go" style={{ width: 18, height: 18, marginLeft: 8, color: '#2563eb' }} />
                  </Link>
                  <Link to="/3d-art" className="explore-menu-item" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '12px', padding: '12px 18px', marginBottom: '10px', textDecoration: 'none', color: '#222', transition: 'background 0.2s' }}>
                    <img src={Art3DIcon} alt="3D Art" style={{ width: 36, height: 36 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '1.08rem', color: '#2563eb' }}>3D Art</div>
                      <div style={{ fontSize: '0.93rem', color: '#2563eb', opacity: 0.7 }}>Functional digital products</div>
                    </div>
                    <img src={ArrowRightIcon} alt="Go" style={{ width: 18, height: 18, marginLeft: 8, color: '#2563eb' }} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="dropdown me-4">
            <button 
              className="btn btn-link text-decoration-none p-0 dropdown-toggle"
              type="button"
              id="freelancersDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{
                color: 'rgb(51, 51, 51)',
                fontWeight: '500',
                fontSize: '14px',
                border: 'none',
                background: 'transparent'
              }}
            >
              Hire Freelancers
            </button>
            <ul className="dropdown-menu" aria-labelledby="freelancersDropdown">
              <li><Link className="dropdown-item" to="/find-freelancers">Find Freelancers</Link></li>
              <li><Link className="dropdown-item" to="/post-project">Post a Project</Link></li>
              <li><Link className="dropdown-item" to="/browse-skills">Browse by Skills</Link></li>
              <li><hr className="dropdown-divider" /></li>
              <li><Link className="dropdown-item" to="/top-freelancers">Top Freelancers</Link></li>
              <li><Link className="dropdown-item" to="/freelancer-services">Services</Link></li>
            </ul>
          </div>

          <Link 
            to="/features" 
            className="text-decoration-none me-4"
            style={{
              color: 'rgb(51, 51, 51)',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            Features
          </Link>
        </div>
        
        {/* Search Bar */}
        <form className="d-flex mx-auto me-4" onSubmit={handleSearch} style={{ maxWidth: '400px', width: '95%', marginLeft: '20px' }}>
          <div className="position-relative w-100">
            <i className="fas fa-search position-absolute" style={{ 
              left: '15px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'rgb(153, 153, 153)',
              fontSize: '13px'
            }}></i>
            <input
              className="form-control"
              type="search"
              placeholder="Search Assets and more..."
              aria-label="Search"
              value={searchQuery}
              onChange={handleSearchChange}
              style={{
                borderRadius: '25px',
                paddingLeft: '33px',
                paddingRight: '20px',
                height: '37px',
                border: '2px solid rgb(224, 224, 224)',
                backgroundColor: 'rgb(248, 249, 250)',
                fontSize: '13px',
                outline: 'none',
                boxShadow: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#007bff';
                e.target.style.backgroundColor = '#fff';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgb(224, 224, 224)';
                e.target.style.backgroundColor = 'rgb(248, 249, 250)';
              }}
            />
          </div>
        </form>

        {/* Navigation Links */}
        {user && (
          <div className="d-none d-lg-flex align-items-center me-3">
            {isCreator ? (
              <Link className="nav-link" to="/creator-dashboard" style={{ fontSize: '14px' }}>Dashboard</Link>
            ) : (
              <Link className="nav-link" to="/creator" style={{ fontSize: '14px' }}>Creator Profile</Link>
            )}
            {isAdmin() && (
              <Link className="nav-link text-warning ms-3" to="/admin-dashboard" style={{ fontSize: '14px' }}>
                <i className="fas fa-cog me-1"></i>Admin
              </Link>
            )}
          </div>
        )}

        {/* Premium Button - Hidden for Admin */}
        {!isAdmin() && (
          <Link
            to="/pricing"
            className="btn me-3 d-none d-lg-block text-decoration-none"
            style={{ 
              fontWeight: '600',
              borderRadius: '25px',
              padding: '0.4rem 0.4rem 0.4rem 0.9rem',
              fontSize: '0.9rem',
              background: 'linear-gradient(135deg, rgb(66, 133, 244) 0%, rgb(26, 35, 126) 100%)',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Upgrade to{' '}
            <span style={{
              backgroundColor: 'white',
              color: 'rgb(26, 35, 126)',
              padding: '2px 10px',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '0.85rem',
              marginLeft: '5px'
            }}>
              PRO
            </span>
          </Link>
        )}

        {/* Notification Icon */}
        {user && (
          <div className="d-none d-lg-flex align-items-center me-3 position-relative notification-dropdown">
            <button 
              className="btn p-0 border-0 bg-transparent position-relative"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.3s ease',
                cursor: 'pointer',
                backgroundColor: showNotifications ? '#f8f9fa' : 'transparent'
              }}
              onClick={toggleNotifications}
              onMouseEnter={(e) => {
                if (!showNotifications) {
                  e.target.style.backgroundColor = '#f8f9fa';
                }
              }}
              onMouseLeave={(e) => {
                if (!showNotifications) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              <FaBell 
                size={18} 
                style={{ 
                  color: showNotifications ? '#007bff' : '#666',
                  transition: 'color 0.3s ease'
                }}
              />
              {/* Notification Badge */}
              {unreadCount > 0 && (
                <span 
                  className="position-absolute badge rounded-pill bg-danger"
                  style={{
                    fontSize: '0.65rem',
                    minWidth: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    top: '-2px',
                    right: '-2px',
                    transform: 'none'
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div 
                className="position-absolute bg-white border rounded-3"
                style={{
                  top: '100%',
                  right: '0',
                  width: '350px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  marginTop: '8px'
                }}
              >
                {/* Dropdown Header */}
                <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                  <h6 className="mb-0 fw-bold">Notifications</h6>
                  {unreadCount > 0 && (
                    <button 
                      className="btn btn-sm btn-link text-decoration-none p-0"
                      onClick={markAllAsRead}
                      style={{ fontSize: '0.8rem' }}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {/* Notification List */}
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted">
                      <FaBell size={24} className="mb-2" style={{ opacity: 0.3 }} />
                      <p className="mb-0">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-bottom notification-item ${!notification.isRead ? 'bg-light' : ''}`}
                        style={{
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease'
                        }}
                        onClick={() => handleNotificationClick(notification.id)}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#f8f9fa';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = notification.isRead ? 'transparent' : '#f8f9fa';
                        }}
                      >
                        <div className="d-flex align-items-start">
                          <div className="me-3">
                            <div 
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: '32px',
                                height: '32px',
                                backgroundColor: 
                                  notification.type === 'success' ? '#28a745' :
                                  notification.type === 'payment' ? '#ffc107' :
                                  notification.type === 'follow' ? '#007bff' : '#6c757d',
                                color: 'white',
                                fontSize: '0.8rem'
                              }}
                            >
                              {notification.type === 'success' ? '✓' : 
                               notification.type === 'payment' ? '$' : 
                               notification.type === 'follow' ? '👤' : '!'}
                            </div>
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start">
                              <h6 className="mb-1 fw-bold" style={{ fontSize: '0.85rem' }}>
                                {notification.title}
                              </h6>
                              {!notification.isRead && (
                                <div 
                                  className="rounded-circle bg-primary"
                                  style={{ width: '8px', height: '8px', marginTop: '4px' }}
                                />
                              )}
                            </div>
                            <p className="mb-1 text-muted" style={{ fontSize: '0.8rem' }}>
                              {notification.message}
                            </p>
                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                              {notification.time}
                            </small>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Profile Image */}
        {user && (
          <div 
            className="d-none d-lg-flex align-items-center me-4 position-relative profile-dropdown"
            onMouseEnter={handleProfileMouseEnter}
            onMouseLeave={handleProfileMouseLeave}
          >
            <div className="position-relative">
              <img
                src={user.profileImage || DefaultProfileImage}
                alt={user.name || 'User'}
                onError={handleProfileImageError}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #e0e0e0',
                  cursor: 'pointer',
                  transition: 'border-color 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#007bff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#e0e0e0';
                }}
              />

              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <>
                  {/* Invisible bridge for smooth hover */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: '0',
                      width: '50px',
                      height: '4px',
                      zIndex: 999
                    }}
                    onMouseEnter={handleProfileMouseEnter}
                    onMouseLeave={handleProfileMouseLeave}
                  />
                  
                  <div 
                    className="position-absolute bg-white border rounded-4"
                    style={{
                      top: '100%',
                      right: '0',
                      width: '280px',
                      zIndex: 1000,
                      marginTop: '4px',
                      background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
                    }}
                    onMouseEnter={handleProfileMouseEnter}
                    onMouseLeave={handleProfileMouseLeave}
                  >
                  {/* Cover Page */}
                  <div 
                    className="position-relative"
                    style={{
                      height: '80px',
                      borderRadius: '1rem 1rem 0 0',
                      overflow: 'visible',
                      background: user.coverImage 
                        ? `url(${user.coverImage}) center/cover no-repeat`
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}
                  >
                    {!user.coverImage && (
                      <div 
                        className="position-absolute top-50 start-50 translate-middle text-white"
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          opacity: 0.9
                        }}
                      >
                        Cover Photo
                      </div>
                    )}
                    
                    {/* Overlapping Profile Image */}
                    <div 
                      className="position-absolute"
                      style={{
                        bottom: '-40px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 10
                      }}
                    >
                      <img
                        src={user.profileImage || DefaultProfileImage}
                        alt={user.name || 'User'}
                        onError={handleProfileImageError}
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '4px solid white'
                        }}
                      />
                    </div>
                  </div>

                  {/* Profile Card Content */}
                  <div className="px-4 pb-4 pt-5 text-center">

                    {/* User Name */}
                    <h6 
                      className="mb-1"
                      style={{ 
                        fontSize: '1.1rem', 
                        fontWeight: '700', 
                        color: '#333',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {user.displayName || user.name}
                    </h6>

                    {/* User Email */}
                    <p 
                      className="mb-2"
                      style={{ 
                        fontSize: '0.8rem', 
                        color: '#6c757d',
                        fontWeight: '400'
                      }}
                    >
                      {user.email}
                    </p>

                    {/* Upgrade to PRO Button - Hidden for Admin */}
                    {!isAdmin() && (
                      <Link
                        to="/pricing"
                        className="btn w-100 text-decoration-none"
                        style={{
                          background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                          color: 'white',
                          borderRadius: '20px',
                          padding: '8px 16px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          border: 'none',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.opacity = '0.9';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.opacity = '1';
                        }}
                      >
                        Upgrade to{' '}
                        <span 
                          style={{
                            backgroundColor: 'white',
                            color: '#007bff',
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontWeight: '700',
                            fontSize: '0.75rem'
                          }}
                        >
                          PRO
                        </span>
                      </Link>
                    )}

                    {/* Quick Actions */}
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid #e9ecef' }}>
                      <div className="d-flex justify-content-around">
                        <Link
                          to={isCreator ? "/creator-dashboard" : "/creator"}
                          className="text-decoration-none"
                          style={{
                            color: '#6c757d',
                            fontSize: '0.75rem',
                            textAlign: 'center',
                            transition: 'color 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.color = '#007bff';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.color = '#6c757d';
                          }}
                        >
                          <div>
                            <i className="fas fa-user mb-1" style={{ fontSize: '1rem' }}></i>
                            <div>Profile</div>
                          </div>
                        </Link>

                        <Link
                          to="/purchases"
                          className="text-decoration-none"
                          style={{
                            color: '#6c757d',
                            fontSize: '0.75rem',
                            textAlign: 'center',
                            transition: 'color 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.color = '#007bff';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.color = '#6c757d';
                          }}
                        >
                          <div>
                            <i className="fas fa-shopping-bag mb-1" style={{ fontSize: '1rem' }}></i>
                            <div>Purchases</div>
                          </div>
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="border-0 bg-transparent"
                          style={{
                            color: '#dc3545',
                            fontSize: '0.75rem',
                            textAlign: 'center',
                            transition: 'color 0.2s ease',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.color = '#c82333';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.color = '#dc3545';
                          }}
                        >
                          <div>
                            <i className="fas fa-sign-out-alt mb-1" style={{ fontSize: '1rem' }}></i>
                            <div>Logout</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                </>
              )}
            </div>
          </div>
        )}

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {user ? (
              <>
                {/* Mobile Notification */}
                <li className="nav-item d-lg-none">
                  <button 
                    className="nav-link d-flex align-items-center btn border-0 bg-transparent w-100 text-start"
                    style={{ padding: '0.5rem 1rem' }}
                    onClick={toggleNotifications}
                  >
                    <div className="position-relative" style={{ marginRight: '10px' }}>
                      <FaBell 
                        size={18} 
                        style={{ 
                          color: showNotifications ? '#007bff' : '#666'
                        }}
                      />
                      {unreadCount > 0 && (
                        <span 
                          className="position-absolute badge rounded-pill bg-danger"
                          style={{
                            fontSize: '0.65rem',
                            minWidth: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            top: '-8px',
                            right: '-8px',
                            transform: 'none'
                          }}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <span>Notifications {unreadCount > 0 && `(${unreadCount})`}</span>
                  </button>
                </li>

                {/* Mobile Notification Dropdown */}
                {showNotifications && (
                  <li className="nav-item d-lg-none">
                    <div className="notification-dropdown mx-3 mb-3">
                      <div 
                        className="bg-white border rounded-3"
                        style={{
                          maxHeight: '300px',
                          overflowY: 'auto'
                        }}
                      >
                        {/* Mobile Dropdown Header */}
                        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                          <h6 className="mb-0 fw-bold">Notifications</h6>
                          {unreadCount > 0 && (
                            <button 
                              className="btn btn-sm btn-link text-decoration-none p-0"
                              onClick={markAllAsRead}
                              style={{ fontSize: '0.8rem' }}
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>

                        {/* Mobile Notification List */}
                        <div className="notification-list">
                          {notifications.length === 0 ? (
                            <div className="p-4 text-center text-muted">
                              <FaBell size={24} className="mb-2" style={{ opacity: 0.3 }} />
                              <p className="mb-0">No notifications yet</p>
                            </div>
                          ) : (
                            notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={`p-3 border-bottom notification-item ${!notification.isRead ? 'bg-light' : ''}`}
                                style={{
                                  cursor: 'pointer',
                                  transition: 'background-color 0.2s ease'
                                }}
                                onClick={() => handleNotificationClick(notification.id)}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = '#f8f9fa';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = notification.isRead ? 'transparent' : '#f8f9fa';
                                }}
                              >
                                <div className="d-flex align-items-start">
                                  <div className="me-3">
                                    <div 
                                      className="rounded-circle d-flex align-items-center justify-content-center"
                                      style={{
                                        width: '28px',
                                        height: '28px',
                                        backgroundColor: 
                                          notification.type === 'success' ? '#28a745' :
                                          notification.type === 'payment' ? '#ffc107' :
                                          notification.type === 'follow' ? '#007bff' : '#6c757d',
                                        color: 'white',
                                        fontSize: '0.75rem'
                                      }}
                                    >
                                      {notification.type === 'success' ? '✓' : 
                                       notification.type === 'payment' ? '$' : 
                                       notification.type === 'follow' ? '👤' : '!'}
                                    </div>
                                  </div>
                                  <div className="flex-grow-1">
                                    <div className="d-flex justify-content-between align-items-start">
                                      <h6 className="mb-1 fw-bold" style={{ fontSize: '0.85rem' }}>
                                        {notification.title}
                                      </h6>
                                      {!notification.isRead && (
                                        <div 
                                          className="rounded-circle bg-primary"
                                          style={{ width: '8px', height: '8px', marginTop: '4px' }}
                                        />
                                      )}
                                    </div>
                                    <p className="mb-1 text-muted" style={{ fontSize: '0.8rem' }}>
                                      {notification.message}
                                    </p>
                                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                      {notification.time}
                                    </small>
                                  </div>
                                </div>
                              </div>
                            ))
                                                      )}
                          </div>
                        </div>
                      </div>
                    </li>
                  )}
                
                {/* Mobile Profile */}
                <li className="nav-item d-lg-none">
                  <Link 
                    to={isCreator ? "/creator-dashboard" : "/creator"} 
                    className="nav-link d-flex align-items-center justify-content-center"
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    <img
                      src={user.profileImage || DefaultProfileImage}
                      alt={user.name || 'User'}
                      onError={handleProfileImageError}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1px solid #e0e0e0'
                      }}
                    />
                  </Link>
                </li>
                {/* Mobile Premium Button - Hidden for Admin */}
                {!isAdmin() && (
                  <li className="nav-item d-lg-none">
                    <Link 
                      to="/pricing"
                      className="nav-link"
                      style={{ 
                        fontWeight: '600',
                        textDecoration: 'none',
                        padding: '0.4rem 0.4rem 0.4rem 0.9rem',
                        background: 'linear-gradient(135deg, rgb(66, 133, 244) 0%, rgb(26, 35, 126) 100%)',
                        color: 'white',
                        borderRadius: '25px',
                        margin: '0.5rem',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      Upgrade to{' '}
                      <span style={{
                        backgroundColor: 'white',
                        color: 'rgb(26, 35, 126)',
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        marginLeft: '5px'
                      }}>
                        PRO
                      </span>
                    </Link>
                  </li>
                )}
              </>
            ) : (
              <>
                {/* Mobile Premium Button for Non-logged in users - Hidden for Admin */}
                {!isAdmin() && (
                  <li className="nav-item d-lg-none">
                    <Link 
                      to="/pricing"
                      className="nav-link"
                      style={{ 
                        fontWeight: '600',
                        textDecoration: 'none',
                        padding: '0.4rem 0.4rem 0.4rem 0.9rem',
                        background: 'linear-gradient(135deg, rgb(66, 133, 244) 0%, rgb(26, 35, 126) 100%)',
                        color: 'white',
                        borderRadius: '25px',
                        margin: '0.5rem',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      Upgrade to{' '}
                      <span style={{
                        backgroundColor: 'white',
                        color: 'rgb(26, 35, 126)',
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        marginLeft: '5px'
                      }}>
                        PRO
                      </span>
                    </Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Login</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/signup">Sign Up</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 