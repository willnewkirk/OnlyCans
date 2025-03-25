import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { db } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, onSnapshot, serverTimestamp, increment, arrayUnion } from 'firebase/firestore';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import CreatePost from './components/CreatePost';
import MainContent from './components/MainContent';
import Profile from './components/Profile';
import Header from './components/Header';
import './App.css';

// Add debugging
console.log('App component starting...');

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
}

function AppContent() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load posts from localStorage first for immediate display
    const savedPosts = localStorage.getItem('posts');
    if (savedPosts) {
      try {
        const parsedPosts = JSON.parse(savedPosts);
        setPosts(parsedPosts);
      } catch (err) {
        console.error('Error loading posts from localStorage:', err);
      }
    }

    // Set up Firestore listener
    const postsRef = collection(db, 'posts');
    const postsQuery = query(postsRef, orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(postsQuery, 
      (snapshot) => {
        try {
          const loadedPosts = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              timestamp: data.timestamp?.toMillis() || Date.now()
            };
          });
          
          // Only update if we have posts
          if (loadedPosts.length > 0) {
            console.log('Successfully loaded posts:', loadedPosts.length);
            setPosts(loadedPosts);
            localStorage.setItem('posts', JSON.stringify(loadedPosts));
          }
        } catch (err) {
          console.error('Error processing posts:', err);
          setError('Failed to process posts');
        }
      },
      (error) => {
        console.error('Posts listener error:', error);
        setError('Failed to load posts: ' + error.message);
      }
    );

    // Cleanup function
    return () => {
      console.log('Cleaning up posts listener');
      unsubscribe();
    };
  }, []); // Empty dependency array means this effect runs once on mount

  // Add a separate effect to handle localStorage updates
  useEffect(() => {
    if (posts.length > 0) {
      localStorage.setItem('posts', JSON.stringify(posts));
    }
  }, [posts]);

  const handleCreatePost = async (newPost) => {
    try {
      // Close the modal immediately
      setIsCreatePostOpen(false);
      
      if (!currentUser) {
        setError('You must be logged in to create a post');
        return;
      }

      const post = {
        title: newPost.title || '',
        content: newPost.content || '',
        imageUrl: newPost.imageUrl || '',
        timestamp: serverTimestamp(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous User',
        votes: 0,
        userVotes: {},
        comments: []
      };
      
      if (!post.title.trim()) {
        throw new Error('Post title is required');
      }
      
      if (!post.content.trim() && !post.imageUrl) {
        throw new Error('Post must have either content or an image');
      }

      console.log('Creating post:', post);
      const postsRef = collection(db, 'posts');
      const docRef = await addDoc(postsRef, post);
      console.log('Post created with ID:', docRef.id);

      // Clear any existing errors
      setError(null);
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to create post');
    }
  };

  const handleVote = async (postId, voteType) => {
    if (!currentUser) {
      setError('You must be logged in to vote');
      return;
    }

    try {
      const postRef = doc(db, 'posts', postId);
      const post = posts.find(p => p.id === postId);
      if (!post) {
        setError('Post not found');
        return;
      }

      const currentVote = post.userVotes?.[currentUser.uid];
      const currentVoteCount = post.votes || 0;

      let updates = {};
      if (currentVote === voteType) {
        // Remove vote if clicking the same button
        updates = {
          votes: currentVoteCount - 1,
          [`userVotes.${currentUser.uid}`]: null
        };
      } else if (!currentVote) {
        // New vote
        updates = {
          votes: currentVoteCount + 1,
          [`userVotes.${currentUser.uid}`]: voteType
        };
      } else {
        // Change vote
        updates = {
          votes: currentVoteCount + 2, // Remove old vote (-1) and add new vote (+1)
          [`userVotes.${currentUser.uid}`]: voteType
        };
      }

      await updateDoc(postRef, updates);

      // Update local state
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            votes: updates.votes,
            userVotes: {
              ...p.userVotes,
              [currentUser.uid]: updates[`userVotes.${currentUser.uid}`]
            }
          };
        }
        return p;
      }));
    } catch (error) {
      console.error('Error updating vote:', error);
      setError('Failed to update vote: ' + error.message);
    }
  };

  const handleDelete = async (postId) => {
    if (!currentUser) {
      setError('You must be logged in to delete posts');
      return;
    }

    try {
      // Get the post to check ownership
      const post = posts.find(p => p.id === postId);
      if (!post) {
        setError('Post not found');
        return;
      }

      // Log the user IDs for debugging
      console.log('Current user ID:', currentUser.uid);
      console.log('Post author ID:', post.authorId);

      // Check if current user is the author
      if (post.authorId !== currentUser.uid) {
        setError('You can only delete your own posts');
        return;
      }

      const postRef = doc(db, 'posts', postId);
      
      // Log the post reference for debugging
      console.log('Attempting to delete post:', postId);
      
      await deleteDoc(postRef);
      
      // Update local state
      const updatedPosts = posts.filter(p => p.id !== postId);
      setPosts(updatedPosts);
      
      // Close modal if post was being viewed
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }

      // Clear any existing errors
      setError(null);
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('Failed to delete post: ' + error.message);
    }
  };

  const handleComment = async (postId, comment) => {
    if (!currentUser) return;

    try {
      const postRef = doc(db, 'posts', postId);
      const newComment = {
        id: Date.now().toString(),
        content: comment.content,
        author: currentUser.displayName || 'Anonymous User',
        authorId: currentUser.uid,
        timestamp: Date.now()
      };

      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });

      // Update local state
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [...(p.comments || []), newComment]
          };
        }
        return p;
      }));
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!currentUser) return;

    try {
      const postRef = doc(db, 'posts', postId);
      const post = posts.find(p => p.id === postId);
      const updatedComments = post.comments.filter(c => c.id !== commentId);

      await updateDoc(postRef, {
        comments: updatedComments
      });

      // Update local state
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: updatedComments
          };
        }
        return p;
      }));
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Failed to delete comment');
    }
  };

  if (error) {
    return (
      <div className="error-container">
        <h1>Error</h1>
        <p>{error}</p>
        <button onClick={() => setError(null)}>Dismiss</button>
      </div>
    );
  }

  return (
    <>
      <Header />
      <MainContent
        currentUser={currentUser}
        posts={posts}
        onVote={handleVote}
        onDelete={handleDelete}
        onCreatePost={() => setIsCreatePostOpen(true)}
        onComment={handleComment}
        onDeleteComment={handleDeleteComment}
        selectedPost={selectedPost}
        onSelectPost={setSelectedPost}
      />
      {isCreatePostOpen && (
        <CreatePost
          onClose={() => setIsCreatePostOpen(false)}
          onSubmit={handleCreatePost}
        />
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile/:username" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute>
              <AppContent />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App; 