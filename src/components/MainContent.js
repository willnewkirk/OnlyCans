import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PostModal from './PostModal';
import './MainContent.css';

export default function MainContent({ posts, onVote, onDelete }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedPost, setSelectedPost] = useState(null);

  const handleCommentSubmit = (postId, newComment) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...(post.comments || []), newComment]
        };
      }
      return post;
    });

    onVote(updatedPosts);
  };

  const handleDeleteComment = (postId, commentId) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: (post.comments || []).filter(comment => comment.id !== commentId)
        };
      }
      return post;
    });

    onVote(updatedPosts);
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  const handleCloseModal = () => {
    setSelectedPost(null);
  };

  const handleDeletePost = (postId) => {
    onDelete(postId);
    setSelectedPost(null);
  };

  const handleVote = (postId, voteType) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          [voteType]: (post[voteType] || 0) + 1
        };
      }
      return post;
    });
    onVote(updatedPosts);
  };

  return (
    <div className="main-content">
      <div className="sidebar">
        <div className="community-info">
          <h2>Welcome to OnlyCans</h2>
          <p>Share your favorite cans with the community!</p>
          <button 
            className="create-post-btn"
            onClick={() => navigate('/create-post')}
          >
            Create Post
          </button>
        </div>
      </div>

      <div className="feed">
        {posts.length === 0 ? (
          <div className="empty-state">
            <p>No posts yet. Be the first to share!</p>
          </div>
        ) : (
          posts.map(post => (
            <div 
              key={post.id} 
              className="post"
              onClick={() => handlePostClick(post)}
            >
              <div className="post-header">
                <span className="post-author">{post.author}</span>
                <div className="post-header-actions">
                  <span className="post-timestamp">
                    {new Date(Number(post.timestamp)).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {post.authorId === currentUser?.uid && (
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
              
              <p className="post-content">{post.content}</p>
              
              {post.images && post.images.length > 0 && (
                <div className="post-images">
                  {post.images.map((image, index) => (
                    <img 
                      key={index} 
                      src={image} 
                      alt={`Post image ${index + 1}`} 
                      className="post-image"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ))}
                </div>
              )}
              
              <div className="post-actions">
                <div className="vote-buttons">
                  <button 
                    className={`vote-button ${post.userVotes?.[currentUser?.uid] === 'up' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onVote(post.id, 'up');
                    }}
                  >
                    {post.userVotes?.[currentUser?.uid] === 'up' ? '👍' : '👍'}
                  </button>
                  <button 
                    className={`vote-button ${post.userVotes?.[currentUser?.uid] === 'down' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onVote(post.id, 'down');
                    }}
                  >
                    {post.userVotes?.[currentUser?.uid] === 'down' ? '👎' : '👎'}
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

      <div className="right-sidebar">
        <div className="rules">
          <h3>Community Rules</h3>
          <ol>
            <li>
              <strong>Respect Others</strong>
              Be kind and respectful to all members of the community.
            </li>
            <li>
              <strong>Original Content</strong>
              Only post your own photos and content.
            </li>
            <li>
              <strong>No Spam</strong>
              Avoid posting promotional content or excessive self-promotion.
            </li>
            <li>
              <strong>Privacy</strong>
              Don't share personal information or private details.
            </li>
            <li>
              <strong>Quality Content</strong>
              Post clear, well-lit photos of cans.
            </li>
          </ol>
        </div>
      </div>

      {selectedPost && (
        <PostModal 
          post={selectedPost}
          onClose={handleCloseModal}
          onVote={onVote}
          onComment={handleCommentSubmit}
          onDeletePost={handleDeletePost}
          onDeleteComment={handleDeleteComment}
        />
      )}
    </div>
  );
} 