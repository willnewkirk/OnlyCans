import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import CreatePost from './components/CreatePost';
import MainContent from './components/MainContent';
import './App.css';

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

function ProtectedMainContent({ posts, onVote, onDelete }) {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  return <MainContent posts={posts} onVote={onVote} onDelete={onDelete} />;
}

function AppContent() {
  const [posts, setPosts] = useState(() => {
    // Initialize posts from localStorage if available
    const savedPosts = localStorage.getItem('posts');
    return savedPosts ? JSON.parse(savedPosts) : [];
  });
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleCreatePost = (newPost) => {
    const post = {
      ...newPost,
      id: Date.now().toString(),
      timestamp: Date.now(),
      votes: 0,
      comments: []
    };
    setPosts(prevPosts => {
      const updatedPosts = [post, ...prevPosts];
      localStorage.setItem('posts', JSON.stringify(updatedPosts));
      return updatedPosts;
    });
  };

  const handleDelete = (postId) => {
    setPosts(prevPosts => {
      const updatedPosts = prevPosts.filter(post => post.id !== postId);
      localStorage.setItem('posts', JSON.stringify(updatedPosts));
      return updatedPosts;
    });
  };

  const handleVote = (postId, voteType) => {
    setPosts(prevPosts => {
      const updatedPosts = prevPosts.map(post => {
        if (post.id === postId) {
          // Get the current user's vote
          const userVote = post.userVotes?.[currentUser?.uid];
          
          // If user is removing their vote
          if (userVote === voteType) {
            return {
              ...post,
              votes: post.votes - (voteType === 'up' ? 1 : -1),
              userVotes: {
                ...post.userVotes,
                [currentUser.uid]: null
              }
            };
          }
          
          // If user is changing their vote
          if (userVote) {
            return {
              ...post,
              votes: post.votes + (voteType === 'up' ? 2 : -2),
              userVotes: {
                ...post.userVotes,
                [currentUser.uid]: voteType
              }
            };
          }
          
          // If user is voting for the first time
          return {
            ...post,
            votes: post.votes + (voteType === 'up' ? 1 : -1),
            userVotes: {
              ...post.userVotes,
              [currentUser.uid]: voteType
            }
          };
        }
        return post;
      });
      
      // Save to localStorage
      localStorage.setItem('posts', JSON.stringify(updatedPosts));
      return updatedPosts;
    });
  };

  return (
    <div className="App">
      <Header />
      <div className="app-container">
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create-post" element={
            <ProtectedRoute>
              <CreatePost onPostCreated={(post) => {
                handleCreatePost(post);
                navigate('/');
              }} />
            </ProtectedRoute>
          } />
          <Route path="/" element={<ProtectedMainContent posts={posts} onVote={handleVote} onDelete={handleDelete} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  return children;
}

export default App; 