import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import GraphykonLogo from '../image/Graphykon_logo.svg';
import './Signup.css';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, error, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      // Error is handled by the auth context
    }
  };

  const handleGoogleSignIn = () => {
    // TODO: Implement Google sign-in
    console.log('Google sign-in clicked');
  };

  return (
    <div className="signup-container">
      {/* Left Section - Image */}
      <div className="signup-left-section">
        <div className="left-content">
          <img 
            src="https://images.unsplash.com/photo-1558655146-d09347e92766?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
            alt="Creative workspace with design tools" 
            className="left-image"
          />
        </div>
      </div>

      {/* Right Section - Signup Form */}
      <div className="signup-right">
        <div className="logo-section">
          <img src={GraphykonLogo} alt="Graphykon" className="graphykon-logo" />
        </div>
        
        <h1 className="signup-heading">Keep your creative assets organized.</h1>
        <p className="signup-subheading">Sign up to start your 30 days free trial.</p>
        
        {error && <div style={{ color: '#dc3545', marginBottom: '20px', fontSize: '14px' }}>{error}</div>}
        
        <button className="google-signin-btn" onClick={handleGoogleSignIn}>
          <div className="google-icon">G</div>
          Sign in with Google
        </button>
        
        <div className="divider">
          <span>or</span>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name*</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Email*</label>
            <input
              type="email"
              className="form-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password*</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            className="create-account-btn"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="login-link">
          Already have an account? <a href="/login">Login Here</a>
        </div>
      </div>
    </div>
  );
}

export default Signup; 