import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PostModal from './PostModal';
import './MainContent.css';

export default function MainContent({ posts, onVote, onDelete, onCreatePost, onComment, onDeleteComment }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedPost, setSelectedPost] = useState(null);

  const truncateText = (text, maxLength = 4) => {
    if (text && text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
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

  return (
    <div className="main-content">
      <div className="sidebar">
        <div className="community-info">
          <h2>Welcome to OnlyCans</h2>
          <p>Share your favorite cans with the community!</p>
          <button 
            className="create-post-btn"
            onClick={onCreatePost}
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
                <span className="post-author">{post.authorName}</span>
                <div className="post-header-actions">
                  <span className="post-timestamp">
                    {new Date(post.timestamp).toLocaleDateString('en-US', {
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
              
              <h3 className="post-title">{truncateText(post.title)}</h3>
              <p className="post-content">{truncateText(post.content)}</p>
              
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
                      onVote(post.id, 'up');
                    }}
                  >
                    👍
                  </button>
                  <span>{post.votes || 0}</span>
                  <button 
                    className={`vote-button ${post.userVotes?.[currentUser?.uid] === 'down' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onVote(post.id, 'down');
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
          onComment={onComment}
          onDeletePost={handleDeletePost}
          onDeleteComment={onDeleteComment}
        />
      )}
    </div>
  );
} 