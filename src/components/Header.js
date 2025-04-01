import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

function Header() {
  const { currentUser, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo-link">
          <img src={`${process.env.PUBLIC_URL}/onlycanslogo.png`} alt="OnlyCans" className="header-logo" />
        </Link>
        <div className="search-bar">
          <input type="text" placeholder="Search posts..." />
        </div>
        <div className="user-controls">
          {currentUser ? (
            <>
              <Link to={`/profile/${currentUser.displayName}`} className="username">
                {currentUser.displayName || 'Anonymous User'}
              </Link>
              <button onClick={logout} className="profile-btn">Logout</button>
            </>
          ) : (
            <Link to="/login" className="profile-btn">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header; 