import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, getDocs, doc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import Header from './Header';
import PostModal from './PostModal';
import ProfileSettings from './ProfileSettings';
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
    console.log('Current username:', username); // Debug log
    const normalizedUsername = username?.toLowerCase();
    const ogUsers = ['amleth', 'pigment', 'bird', 'gabo', 'jimbobwe', 'kempf'];
    
    if (normalizedUsername === 'amleth' || normalizedUsername === 'pigment') {
      return (
        <div className="flair-container">
          <span className="flair admin">Admin</span>
          <span className="flair og">OG</span>
        </div>
      );
    } else if (ogUsers.includes(normalizedUsername)) {
      return (
        <div className="flair-container">
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
          <div className="profile-info">
            <h1 className="profile-username">
              {username}
            </h1>
            {renderFlairs(username)}
          </div>
        </div>
        <div className="profile-content">
          {loading ? (
            <div className="loading">Loading posts...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : userPosts.length === 0 ? (
            <div className="no-posts">No posts yet</div>
          ) : (
            <div className="posts-grid">
              {userPosts.map(post => (
                <div key={post.id} className="profile-post" onClick={() => setSelectedPost(post)}>
                  <div className="post-header">
                    <div className="post-header-left">
                      <span className="post-author">{post.authorName}</span>
                      <span className="post-timestamp">{formatTimestamp(post.timestamp)}</span>
                    </div>
                    {(post.authorId === currentUser?.uid || currentUser?.uid === 'amleth_user_id') && (
                      <button 
                        className="delete-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(post.id);
                        }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  <h3 className="post-title">{post.title}</h3>
                  <p className="post-content">{post.content}</p>
                  {post.imageUrl && (
                    <div className="post-image-container">
                      <img src={post.imageUrl} alt="Post" className="post-image" />
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
                      <span className="vote-count">{post.votes || 0}</span>
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
              ))}
            </div>
          )}
        </div>
        {currentUser?.displayName === username && (
          <ProfileSettings />
        )}
      </div>
      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onVote={handleVote}
          onDelete={handleDelete}
          onComment={handleComment}
          onDeleteComment={handleDeleteComment}
        />
      )}
    </div>
  );
}

export default Profile; 