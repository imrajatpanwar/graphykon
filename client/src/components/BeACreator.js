import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import './BeACreator.css';

const BeACreator = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    creatorName: '',
    username: '',
    phone: '',
    location: '',
    bio: ''
  });
  
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, message: '' });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Username availability check with debouncing
  useEffect(() => {
    const checkUsername = async () => {
      if (formData.username.length < 3) {
        setUsernameStatus({ checking: false, available: null, message: 'Username must be at least 3 characters' });
        return;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        setUsernameStatus({ checking: false, available: false, message: 'Username can only contain letters, numbers, and underscores' });
        return;
      }

      setUsernameStatus({ checking: true, available: null, message: 'Checking availability...' });

      try {
        const response = await api.get(`/auth/check-username?username=${formData.username}`);
        setUsernameStatus({
          checking: false,
          available: response.data.available,
          message: response.data.available ? 'Username is available!' : 'Username is already taken'
        });
      } catch (error) {
        setUsernameStatus({
          checking: false,
          available: false,
          message: 'Error checking username availability'
        });
      }
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.username]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.creatorName.trim()) {
      newErrors.creatorName = 'Creator name is required';
    }
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!usernameStatus.available) {
      newErrors.username = 'Username is not available';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (!formData.bio.trim()) {
      newErrors.bio = 'Bio is required';
    }
    
    if (!termsAccepted) {
      newErrors.terms = 'You must accept the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Convert image to base64 if present
      let imageData = null;
      if (profileImage) {
        imageData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(profileImage);
        });
      }
      
      const response = await api.post('/creator/be-a-creator', {
        ...formData,
        profileImage: imageData
      });
      
      // Update user data in context
      updateUser(response.data.user);
      
      // Redirect to creator dashboard
      navigate('/creator-dashboard');
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to register as creator';
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.creatorName.trim() &&
      formData.username.trim() &&
      formData.phone.trim() &&
      formData.location.trim() &&
      formData.bio.trim() &&
      usernameStatus.available &&
      termsAccepted &&
      !isSubmitting
    );
  };

  return (
    <div className="be-creator-container">
      <div className="be-creator-card">
        <h1>Become a Creator</h1>
        <p>Fill out the form below to start your creator journey!</p>
        
        <form onSubmit={handleSubmit} className="creator-form">
          <div className="form-group">
            <label htmlFor="creatorName">Creator Name *</label>
            <input
              type="text"
              id="creatorName"
              name="creatorName"
              value={formData.creatorName}
              onChange={handleInputChange}
              placeholder="Enter your creator name"
              className={errors.creatorName ? 'error' : ''}
            />
            {errors.creatorName && <span className="error-message">{errors.creatorName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter your username"
              className={errors.username ? 'error' : ''}
            />
            {usernameStatus.checking && <span className="status-message checking">Checking availability...</span>}
            {!usernameStatus.checking && usernameStatus.available && <span className="status-message available">✓ Username is available!</span>}
            {!usernameStatus.checking && usernameStatus.available === false && <span className="status-message unavailable">✗ Username is already taken</span>}
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Login Email</label>
            <input
              type="email"
              id="email"
              value={user.email}
              disabled
              className="disabled"
            />
            <small>This is your login email and cannot be changed</small>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
              className={errors.phone ? 'error' : ''}
            />
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="location">Location *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Enter your location"
              className={errors.location ? 'error' : ''}
            />
            {errors.location && <span className="error-message">{errors.location}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="profileImage">Profile Image</label>
            <input
              type="file"
              id="profileImage"
              accept="image/*"
              onChange={handleImageChange}
              className="file-input"
            />
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Profile preview" />
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio *</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself..."
              rows="4"
              className={errors.bio ? 'error' : ''}
            />
            {errors.bio && <span className="error-message">{errors.bio}</span>}
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              <span className="checkmark"></span>
              I agree to the Terms and Conditions *
            </label>
            {errors.terms && <span className="error-message">{errors.terms}</span>}
          </div>

          {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}

          <button
            type="submit"
            disabled={!isFormValid()}
            className="submit-button"
          >
            {isSubmitting ? 'Submitting...' : 'Become a Creator'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BeACreator; 