import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './Signup.css';
import logo from './image/Graphykon_logo.svg';
import userPlus from './image/userplus.svg';

const heroImageUrl = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1920&q=80';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      toast.success('Welcome back!');
      navigate('/home');
    } else {
      toast.error(result.error || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <div className="signup-page">
      <div className="signup-hero" style={{ backgroundImage: `url(${heroImageUrl})` }}>
        <div className="signup-hero-overlay" />
        <div className="signup-hero-content">
          <h2>Welcome back</h2>
          <p>Sign in to continue to your dashboard and manage your creative assets.</p>
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
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
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

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="login-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;