import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import PostModal from './PostModal';
import Header from './Header';
import './MainContent.css';

export default function AllPosts() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          
          setPosts(loadedPosts);
          setLoading(false);
        } catch (err) {
          console.error('Error processing posts:', err);
          setError('Failed to process posts');
          setLoading(false);
        }
      },
      (error) => {
        console.error('Posts listener error:', error);
        setError('Failed to load posts: ' + error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const formatTimestamp = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    
    if (months > 0) {
      return `${months}mo`;
    } else if (days > 0) {
      return `${days}d`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return 'just now';
    }
  };

  const handleVote = async (postId, voteType) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      const postRef = doc(db, 'posts', postId);
      const post = posts.find(p => p.id === postId);
      const currentVote = post.userVotes?.[currentUser.uid];

      let updates = {};
      
      if (currentVote === voteType) {
        // Remove vote
        updates = {
          [`userVotes.${currentUser.uid}`]: null,
          votes: voteType === 'up' ? (post.votes || 0) - 1 : (post.votes || 0) + 1
        };
      } else {
        // Add new vote
        updates = {
          [`userVotes.${currentUser.uid}`]: voteType,
          votes: voteType === 'up' 
            ? (post.votes || 0) + 1 + (currentVote === 'down' ? 1 : 0)
            : (post.votes || 0) - 1 - (currentVote === 'up' ? 1 : 0)
        };
      }

      await updateDoc(postRef, updates);
    } catch (error) {
      console.error('Error voting:', error);
      setError('Failed to vote. Please try again.');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!currentUser) return;

    try {
      const postRef = doc(db, 'posts', postId);
      await deleteDoc(postRef);
      setSelectedPost(null);
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('Failed to delete post. Please try again.');
    }
  };

  const handleComment = async (postId, comment) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      const postRef = doc(db, 'posts', postId);
      const newComment = {
        id: Date.now().toString(),
        content: comment,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        timestamp: Date.now()
      };

      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment. Please try again.');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!currentUser) return;

    try {
      const postRef = doc(db, 'posts', postId);
      const post = posts.find(p => p.id === postId);
      const comment = post.comments.find(c => c.id === commentId);

      if (comment.authorId === currentUser.uid) {
        await updateDoc(postRef, {
          comments: arrayRemove(comment)
        });
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Failed to delete comment. Please try again.');
    }
  };

  return (
    <div className="all-posts-page">
      <Header />
      <div className="main-content">
        <div className="sidebar">
          <div className="community-info">
            <h2>Welcome to OnlyCans</h2>
            <p>Share a piece, drawing, etc.</p>
            <button 
              className="create-post-btn"
              onClick={() => navigate('/create-post')}
            >
              Create Post
            </button>
          </div>
        </div>

        <div className="feed">
          <div className="feed-header">
            <h2>All Posts</h2>
            <button 
              className="back-button"
              onClick={() => navigate('/')}
            >
              Back to Home
            </button>
          </div>
          
          {loading ? (
            <div className="loading">Loading posts...</div>
          ) : error ? (
            <div className="error">
              {error}
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          ) : posts.length === 0 ? (
            <div className="empty-state">
              <p>No posts yet. Be the first to share!</p>
            </div>
          ) : (
            posts.map(post => (
              <div 
                key={post.id} 
                className="post"
                onClick={() => setSelectedPost(post)}
              >
                <div className="post-header">
                  <div className="post-header-left">
                    <Link 
                      to={`/profile/${post.authorName}`} 
                      className="post-author"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(`/profile/${post.authorName}`);
                      }}
                    >
                      {post.authorName}
                    </Link>
                    <span className="post-timestamp">
                      {formatTimestamp(post.timestamp)}
                    </span>
                  </div>
                  <div className="post-header-actions">
                    {(post.authorId === currentUser?.uid || currentUser?.uid === 'GQfm1ZkXu1fnd3seg1N2UJll6Jf1') && (
                      <button 
                        className="delete-post"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePost(post.id);
                        }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
                
                <h3 className="post-title">{post.title}</h3>
                <p className="post-content">{post.content}</p>
                
                {post.imageUrl && (
                  <div className="post-images">
                    <img 
                      src={post.imageUrl} 
                      alt="Post content" 
                      className="post-image"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                
                <div className="post-actions">
                  <div className="vote-buttons">
                    <button 
                      className={`vote-button ${post.userVotes?.[currentUser?.uid] === 'up' ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(post.id, 'up');
                      }}
                    >
                      👍
                    </button>
                    <span>{post.votes || 0}</span>
                    <button 
                      className={`vote-button ${post.userVotes?.[currentUser?.uid] === 'down' ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(post.id, 'down');
                      }}
                    >
                      👎
                    </button>
                  </div>
                  <span className="comment-count">
                    💬 {post.comments?.length || 0}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedPost && (
        <PostModal 
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onVote={handleVote}
          onComment={handleComment}
          onDeletePost={handleDeletePost}
          onDeleteComment={handleDeleteComment}
        />
      )}
    </div>
  );
} 