import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import '../index.css';
import './Header.css';
import GraphykonLogo from './image/Graphykon_logo.svg';

const Header = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  return (
    <header className="header">
      <div className="logo">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <img 
            src={GraphykonLogo} 
            alt="Graphykon" 
            style={{
              height: '18px',
              width: 'auto'
            }}
          />
        </Link>
      </div>
      
      <div className="header-buttons">
        {user ? (
          <>
            {user.creator ? (
              <Link to="/studio" style={{
                textDecoration: 'none',
                padding: '0.5rem 1rem',
                backgroundColor: '#17a2b8',
                color: 'white',
                borderRadius: '4px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}>Studio</Link>
            ) : (
              <Link to="/be-a-creator" style={{
                textDecoration: 'none',
                padding: '0.5rem 1rem',
                backgroundColor: '#28a745',
                color: 'white',
                borderRadius: '4px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}>Be a Creator</Link>
            )}
            <button onClick={handleLogout} style={{
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={{
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              borderRadius: '4px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}>Login</Link>
            <Link to="/signup" style={{
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              color: '#007bff',
              border: '2px solid #007bff',
              borderRadius: '4px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}>Sign Up</Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header; 