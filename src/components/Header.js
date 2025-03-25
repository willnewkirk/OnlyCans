import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

function Header() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-section">
          <Link to="/" className="logo-link">
            <h1 className="logo">OnlyCans</h1>
          </Link>
        </div>
        <div className="search-bar">
          <input type="text" placeholder="Search OnlyCans" />
        </div>
        <div className="user-controls">
          {currentUser ? (
            <>
              <Link to={`/profile/${currentUser.displayName || 'Anonymous User'}`} className="username">
                {currentUser.displayName || 'Anonymous User'}
              </Link>
              <button className="profile-btn" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <button className="profile-btn" onClick={() => window.location.href = '/login'}>Login</button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header; 