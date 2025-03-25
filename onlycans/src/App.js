import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import './App.css';
import './components/Auth/Auth.css';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function Header() {
  const { currentUser, logout } = useAuth();
  
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-section">
          <h1 className="logo">OnlyCans</h1>
        </div>
        <div className="search-bar">
          <input type="text" placeholder="Search OnlyCans" />
        </div>
        <div className="user-controls">
          {currentUser ? (
            <button className="profile-btn" onClick={logout}>Logout</button>
          ) : (
            <button className="profile-btn" onClick={() => window.location.href = '/login'}>Login</button>
          )}
        </div>
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
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={
            <PrivateRoute>
              <>
                <Header />
                <MainContent />
              </>
            </PrivateRoute>
          } />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
