import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './PostModal.css';

export default function PostModal({ post, onClose, onVote, onComment, onDeletePost, onDeleteComment }) {
  const { currentUser } = useAuth();
  const [commentText, setCommentText] = useState('');

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      id: Date.now(),
      text: commentText,
      author: currentUser.displayName || 'Anonymous User',
      authorId: currentUser.uid,
      timestamp: new Date().toISOString(),
    };

    onComment(post.id, newComment);
    setCommentText('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="modal-header">
          <div className="modal-header-left">
            <span className="modal-author">{post.author}</span>
            <span className="modal-timestamp">
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
                className="modal-delete-post"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePost(post.id);
                }}
              >
                🗑️
              </button>
            )}
          </div>
        </div>
        
        <div className="modal-post">
          <p className="post-content">{post.content}</p>
          
          {post.images && post.images.length > 0 && (
            <div className="modal-images">
              {post.images.map((image, index) => (
                <img 
                  key={index} 
                  src={image} 
                  alt={`Post image ${index + 1}`} 
                  className="modal-image"
                />
              ))}
            </div>
          )}

          <div className="post-actions">
            <div className="vote-buttons">
              <button
                onClick={() => onVote(post.id, 'upvotes')}
                className="vote-button"
              >
                👍 {post.upvotes || 0}
              </button>
              <button
                onClick={() => onVote(post.id, 'downvotes')}
                className="vote-button"
              >
                👎 {post.downvotes || 0}
              </button>
            </div>
          </div>

          <div className="comments-section">
            <h3>Comments</h3>
            <form onSubmit={handleCommentSubmit} className="comment-form">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="comment-input"
              />
              <button type="submit" className="comment-submit">Post</button>
            </form>
            
            <div className="comments-list">
              {(post.comments || []).map((comment) => (
                <div key={comment.id} className="comment">
                  <div className="comment-header">
                    <span className="comment-author">{comment.author}</span>
                    <div className="comment-actions">
                      <span className="comment-timestamp">
                        {new Date(comment.timestamp).toLocaleString()}
                      </span>
                      {(post.authorId === currentUser?.uid || comment.authorId === currentUser?.uid) && (
                        <button
                          onClick={() => onDeleteComment(post.id, comment.id)}
                          className="delete-comment"
                          title="Delete comment"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="comment-text">{comment.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 