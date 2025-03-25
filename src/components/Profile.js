import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import Header from './Header';
import PostModal from './PostModal';
import './Profile.css';

function Profile() {
  const { username } = useParams();
  const { currentUser } = useAuth();
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const postsRef = collection(db, 'posts');
        const postsQuery = query(
          postsRef,
          where('authorName', '==', username),
          orderBy('timestamp', 'desc')
        );

        const snapshot = await getDocs(postsQuery);
        const posts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toMillis() || Date.now()
        }));

        setUserPosts(posts);
        setLoading(false);

        const unsubscribe = onSnapshot(
          postsQuery,
          (snapshot) => {
            const updatedPosts = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toMillis() || Date.now()
            }));
            setUserPosts(updatedPosts);
            setLoading(false);
          },
          (error) => {
            console.error('Error in posts listener:', error);
            setError(`Failed to load posts: ${error.message}`);
            setLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching posts:', error);
        setError(`Failed to load posts: ${error.message}`);
        setLoading(false);
      }
    };

    if (username) {
      fetchPosts();
    } else {
      setLoading(false);
      setError('Invalid username');
    }
  }, [username]);

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
    if (!currentUser) return;

    try {
      const postRef = doc(db, 'posts', postId);
      const post = userPosts.find(p => p.id === postId);
      const currentVote = post.userVotes?.[currentUser.uid];

      let updates = {};
      if (currentVote === voteType) {
        // Remove vote if clicking the same button
        updates = {
          votes: (post.votes || 0) - 1,
          [`userVotes.${currentUser.uid}`]: null
        };
      } else if (!currentVote) {
        // New vote
        updates = {
          votes: (post.votes || 0) + 1,
          [`userVotes.${currentUser.uid}`]: voteType
        };
      } else {
        // Change vote
        updates = {
          votes: (post.votes || 0) + 2,
          [`userVotes.${currentUser.uid}`]: voteType
        };
      }

      await updateDoc(postRef, updates);

      // Update local state
      setUserPosts(userPosts.map(p => {
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
    }
  };

  const handleDelete = async (postId) => {
    if (!currentUser) return;

    try {
      const post = userPosts.find(p => p.id === postId);
      if (post.authorId !== currentUser.uid) {
        setError('You can only delete your own posts');
        return;
      }

      const postRef = doc(db, 'posts', postId);
      await deleteDoc(postRef);
      
      // Update local state
      setUserPosts(userPosts.filter(p => p.id !== postId));
      
      // Close modal if post was being viewed
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }
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
      setUserPosts(userPosts.map(p => {
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
      const post = userPosts.find(p => p.id === postId);
      const updatedComments = post.comments.filter(c => c.id !== commentId);

      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        comments: updatedComments
      });

      // Update local state
      setUserPosts(userPosts.map(p => {
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

  const renderFlairs = (username) => {
    if (username === 'amleth') {
      return (
        <div className="flair-container">
          <span className="flair admin">Admin</span>
          <span className="flair og">OG</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="profile-page">
      <Header />
      <div className="profile-container">
        <div className="profile-header">
          <h1>{username || 'Profile'}</h1>
          {renderFlairs(username)}
        </div>
        <div className="profile-content">
          {loading ? (
            <div className="loading">Loading posts...</div>
          ) : error ? (
            <div className="error">
              {error}
              <button 
                onClick={() => window.location.reload()} 
                className="retry-button"
              >
                Retry
              </button>
            </div>
          ) : userPosts.length === 0 ? (
            <div className="no-posts">No posts yet</div>
          ) : (
            <div className="user-posts">
              {userPosts.map(post => (
                <div 
                  key={post.id} 
                  className="profile-post"
                  onClick={() => setSelectedPost(post)}
                >
                  <div className="profile-post-header">
                    <span className="profile-post-title">{post.title}</span>
                    <span className="profile-post-time">{formatTimestamp(post.timestamp)}</span>
                  </div>
                  <div className="profile-post-content">
                    {post.content}
                  </div>
                  {post.imageUrl && (
                    <div className="profile-post-image">
                      <img src={post.imageUrl} alt={post.title} />
                    </div>
                  )}
                  <div className="profile-post-stats">
                    <span>👍 {post.votes || 0}</span>
                    <span>💬 {post.comments?.length || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onVote={handleVote}
          onComment={handleComment}
          onDeletePost={handleDelete}
          onDeleteComment={handleDeleteComment}
        />
      )}
    </div>
  );
}

export default Profile; 