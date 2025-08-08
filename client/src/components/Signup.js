import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './Signup.css';
import logo from './image/Graphykon_logo.svg';
import userPlus from './image/userplus.svg';
const heroImageUrl = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1920&q=80';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    const result = await signup(name, email, password);
    
    if (result.success) {
      toast.success('Account created successfully!');
      navigate('/home');
    } else {
      toast.error(result.error || 'Signup failed');
    }
    
    setLoading(false);
  };

  return (
    <div className="signup-page">
      <div className="signup-hero" style={{ backgroundImage: `url(${heroImageUrl})` }}>
        <div className="signup-hero-overlay" />
        <div className="signup-hero-content">
          <h2>Join thousands of teams</h2>
          <p>
            Build faster, collaborate better, and grow your business with our platform
            trusted by companies worldwide.
          </p>
          <div className="trust-row">
            <img src={userPlus} alt="Users" className="trust-icon" />
            <span>Trusted by 10,000+ users</span>
          </div>
        </div>
      </div>

      <div className="signup-form-panel">
        <div className="brand">
          <img src={logo} alt="Graphykon" className="brand-logo" />
        </div>
        <div className="welcome">
          <p>Create an account to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-row">
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Create your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="terms">
          By continuing, you agree to Graphykon{' '}
          <button type="button" className="linklike">Terms of Use</button>
          {' '}and{' '}
          <button type="button" className="linklike">Privacy Policy</button>.
        </p>

        <p className="login-link">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup; 