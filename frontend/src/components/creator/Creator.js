import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Card, Alert, Container, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import debounce from 'lodash/debounce';

function Creator() {
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    location: '',
    phoneNumber: '',
    profileImage: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const { user } = useAuth();

  // Add styles for alerts
  const alertStyles = {
    marginBottom: '1rem',
    borderRadius: '8px',
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const successIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-check-circle-fill" viewBox="0 0 16 16">
      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
    </svg>
  );

  const errorIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-exclamation-circle-fill" viewBox="0 0 16 16">
      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
    </svg>
  );

  // Ref for debounced username check
  const checkUsernameAvailabilityRef = useRef();

  useEffect(() => {
    checkUsernameAvailabilityRef.current = debounce(async (username) => {
      if (!username || username.length < 3) {
        setError('');
        setSuccess('');
        return;
      }
      try {
        setCheckingUsername(true);
        const response = await axios.post(
          'http://localhost:5000/api/creator/check-username',
          { username },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        if (!response.data.available) {
          setError(`This username isn't available. Please try another`);
          setSuccess('');
        } else {
          setSuccess(`Username is available!`);
          setError('');
        }
      } catch (err) {
        setError('Error checking username availability');
        setSuccess('');
      } finally {
        setCheckingUsername(false);
      }
    }, 500);
    return () => {
      checkUsernameAvailabilityRef.current.cancel();
    };
  }, []);

  useEffect(() => {
    // Fetch existing profile data when component mounts
    const fetchProfile = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/creator/profile', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        const { displayName, username, location, phoneNumber, profileImage } = response.data;
        setFormData(prev => ({
          ...prev,
          displayName: displayName || '',
          username: username || '',
          location: location || '',
          phoneNumber: phoneNumber || ''
        }));
        if (profileImage) {
          setPreviewImage(`http://localhost:5000/${profileImage}`);
        }
      } catch (err) {
        setError('Failed to load profile data');
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, profileImage: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (name === 'username') {
      checkUsernameAvailabilityRef.current(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await axios.put(
        'http://localhost:5000/api/creator/profile',
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Update preview image if a new one was uploaded
      if (response.data.profileImage) {
        setPreviewImage(`http://localhost:5000/${response.data.profileImage}`);
      }

      setSuccess('Profile updated successfully! Your changes have been saved.');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Body>
              <h2 className="text-center mb-4">Creator Profile</h2>
              {error && !formData.username && (
                <Alert variant="danger" style={alertStyles}>
                  {errorIcon}
                  <span>{error}</span>
                </Alert>
              )}
              {success && !formData.username && (
                <Alert variant="success" style={alertStyles}>
                  {successIcon}
                  <span>{success}</span>
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                {/* Profile Image Section */}
                <div className="text-center mb-4">
                  <div className="position-relative d-inline-block">
                    <img
                      src={previewImage || 'https://via.placeholder.com/150'}
                      alt="Profile preview"
                      className="rounded-circle"
                      style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                    />
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="d-none"
                      id="profileImage"
                    />
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="position-absolute bottom-0 end-0"
                      onClick={() => document.getElementById('profileImage').click()}
                    >
                      Change Photo
                    </Button>
                  </div>
                </div>

                {/* Display Name */}
                <Form.Group className="mb-3">
                  <Form.Label>Display Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    required
                    placeholder="Enter your display name"
                  />
                </Form.Group>

                {/* Username */}
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder="Enter your username"
                  />
                  {checkingUsername && (
                    <Form.Text className="text-muted">
                      Checking username availability...
                    </Form.Text>
                  )}
                  {!checkingUsername && formData.username && (error && !success ? (
                    <div style={{ color: '#d9534f', marginTop: 4 }}>{error}</div>
                  ) : (success && !error ? (
                    <div style={{ color: '#198754', marginTop: 4 }}>{success}</div>
                  ) : null))}
                </Form.Group>

                {/* Location */}
                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Enter your location"
                  />
                </Form.Group>

                {/* Phone Number */}
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                  />
                </Form.Group>

                <Button
                  className="w-100"
                  type="submit"
                  disabled={loading || checkingUsername}
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Creator; 