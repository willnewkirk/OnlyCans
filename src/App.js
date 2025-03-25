import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import CreatePost from './components/CreatePost';
import MainContent from './components/MainContent';
import './App.css';

// Add debugging
console.log('App component starting...');

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
  console.log('ProtectedMainContent rendering, currentUser:', currentUser);
  if (!currentUser) {
    console.log('No current user, redirecting to login');
    return <Navigate to="/login" />;
  }
  return <MainContent posts={posts} onVote={onVote} onDelete={onDelete} />;
}

function AppContent() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  // Add debugging
  console.log('AppContent rendering, currentUser:', currentUser);

  useEffect(() => {
    console.log('Loading posts from localStorage...');
    const savedPosts = JSON.parse(localStorage.getItem('posts') || '[]');
    console.log('Loaded posts:', savedPosts);
    setPosts(savedPosts);
  }, []);

  const handleCreatePost = (newPost) => {
    console.log('Creating new post:', newPost);
    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    localStorage.setItem('posts', JSON.stringify(updatedPosts));
    setIsCreatePostOpen(false);
  };

  const handleVote = (postId, voteType) => {
    console.log('Handling vote:', { postId, voteType });
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const currentVote = post.userVotes?.[currentUser?.uid];
        let newVoteCount = post.votes || 0;

        if (currentVote === voteType) {
          // Remove vote
          newVoteCount -= voteType === 'up' ? 1 : -1;
          delete post.userVotes[currentUser.uid];
        } else if (currentVote) {
          // Change vote
          newVoteCount -= currentVote === 'up' ? 1 : -1;
          newVoteCount += voteType === 'up' ? 1 : -1;
          post.userVotes[currentUser.uid] = voteType;
        } else {
          // First vote
          newVoteCount += voteType === 'up' ? 1 : -1;
          post.userVotes = { ...post.userVotes, [currentUser.uid]: voteType };
        }

        return { ...post, votes: newVoteCount };
      }
      return post;
    });

    setPosts(updatedPosts);
    localStorage.setItem('posts', JSON.stringify(updatedPosts));
  };

  const handleDelete = (postId) => {
    console.log('Deleting post:', postId);
    const updatedPosts = posts.filter(post => post.id !== postId);
    setPosts(updatedPosts);
    localStorage.setItem('posts', JSON.stringify(updatedPosts));
    if (selectedPost?.id === postId) {
      setSelectedPost(null);
    }
  };

  const handleComment = (postId, comment) => {
    console.log('Adding comment:', { postId, comment });
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...(post.comments || []), { ...comment, id: Date.now().toString() }]
        };
      }
      return post;
    });

    setPosts(updatedPosts);
    localStorage.setItem('posts', JSON.stringify(updatedPosts));
  };

  const handleDeleteComment = (postId, commentId) => {
    console.log('Deleting comment:', { postId, commentId });
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.filter(comment => comment.id !== commentId)
        };
      }
      return post;
    });

    setPosts(updatedPosts);
    localStorage.setItem('posts', JSON.stringify(updatedPosts));
  };

  const ProtectedMainContent = () => {
    console.log('ProtectedMainContent rendering, currentUser:', currentUser);
    if (!currentUser) {
      console.log('No current user, redirecting to login');
      return <Navigate to="/login" />;
    }
    return (
      <MainContent
        posts={posts}
        onVote={handleVote}
        onComment={handleComment}
        onDeleteComment={handleDeleteComment}
        onDelete={handleDelete}
        onCreatePost={() => setIsCreatePostOpen(true)}
        selectedPost={selectedPost}
        setSelectedPost={setSelectedPost}
      />
    );
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
          <Route path="/" element={<ProtectedMainContent />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      {isCreatePostOpen && (
        <CreatePost
          onClose={() => setIsCreatePostOpen(false)}
          onSubmit={handleCreatePost}
        />
      )}
    </div>
  );
}

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Wait for a small delay to ensure Firebase is ready
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsInitialized(true);
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err.message);
      }
    };

    initializeApp();
  }, []);

  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#2d2d2d',
        color: '#e0e0e0',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2>Loading OnlyCans...</h2>
        {error && (
          <div style={{
            marginTop: '20px',
            color: '#ff6b6b',
            maxWidth: '600px'
          }}>
            <p>Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#4a90e2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

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