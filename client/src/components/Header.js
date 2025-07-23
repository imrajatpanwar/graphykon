import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../index.css';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="header" style={{
      background: '#fff',
      color: '#222',
      padding: '1rem 2rem',
      textAlign: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '2px solid #007bff',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div className="logo" style={{
        fontSize: '2rem',
        fontWeight: '700',
        textAlign: 'left',
        color: '#007bff'
      }}>Logo</div>
      
      <div className="header-buttons" style={{
        display: 'flex',
        gap: '1rem',
        alignItems: 'center'
      }}>
        {user ? (
          <>
            {user.creator ? (
              <Link to="/creator-dashboard" style={{
                textDecoration: 'none',
                padding: '0.5rem 1rem',
                backgroundColor: '#17a2b8',
                color: 'white',
                borderRadius: '4px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}>Creator Dashboard</Link>
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
            <button onClick={logout} style={{
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