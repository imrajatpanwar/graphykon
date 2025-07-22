import React from 'react';
import '../index.css';
import './Header.css';

const Header = () => {
  return (
    <header className="header" style={{
      background: '#fff',
      color: '#222',
      padding: '1rem 2rem',
      textAlign: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
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
    </header>
  );
};

export default Header; 