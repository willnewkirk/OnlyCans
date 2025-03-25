import React from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import './App.css';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

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
    <header>
      <div className="header-left">
        <Link to="/" className="logo">OnlyCans</Link>
      </div>
      <div className="header-right">
        {currentUser ? (
          <>
            <span className="username">{currentUser.displayName || 'Anonymous User'}</span>
            <button className="profile-btn" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <div className="auth-buttons">
            <Link to="/login">
              <button className="profile-btn">Login</button>
            </Link>
            <Link to="/signup">
              <button className="profile-btn">Sign Up</button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

function MainContent() {
  return (
    <div className="main-content">
      <div className="sidebar">
        <div className="community-info">
          <h2>Welcome to OnlyCans</h2>
          <p>Share your street art and graffiti!</p>
          <button className="create-post-btn">Create Post</button>
        </div>
      </div>
      
      <div className="feed">
        <div className="post">
          <div className="post-votes">
            <button>↑</button>
            <span>0</span>
            <button>↓</button>
          </div>
          <div className="post-content">
            <h3>Welcome to OnlyCans!</h3>
            <p>Share your best street art and connect with other artists.</p>
          </div>
        </div>
      </div>
      
      <div className="right-sidebar">
        <div className="rules">
          <h3>Community Rules</h3>
          <ol>
            <li>Respect other artists</li>
            <li>Only post original content</li>
            <li>No inappropriate content</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Header />
        <div className="app-container">
          <Routes>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <MainContent />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App; 