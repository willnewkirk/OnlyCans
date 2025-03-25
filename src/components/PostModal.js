import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './PostModal.css';

export default function PostModal({ post, onClose, onVote, onComment, onDeletePost, onDeleteComment }) {
  const { currentUser } = useAuth();
  const [newComment, setNewComment] = useState('');

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    onComment(post.id, {
      content: newComment.trim()
    });
    setNewComment('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        
        <div className="modal-header">
          <div className="modal-header-left">
            <span className="modal-author">{post.authorName}</span>
            <span className="modal-timestamp">
              {new Date(post.timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        <h2 className="modal-title">{post.title}</h2>
        <p className="modal-text">{post.content}</p>
        
        {post.imageUrl && (
          <div className="modal-images">
            <img 
              src={post.imageUrl} 
              alt="Post content" 
              className="modal-image"
            />
          </div>
        )}
        
        <div className="modal-actions">
          <div className="modal-vote-buttons">
            <button 
              className={`modal-vote-button ${post.userVotes?.[currentUser?.uid] === 'up' ? 'active' : ''}`}
              onClick={() => onVote(post.id, 'up')}
            >
              👍
            </button>
            <span>{post.votes || 0}</span>
            <button 
              className={`modal-vote-button ${post.userVotes?.[currentUser?.uid] === 'down' ? 'active' : ''}`}
              onClick={() => onVote(post.id, 'down')}
            >
              👎
            </button>
          </div>
          <span className="modal-comment-count">
            💬 {post.comments?.length || 0}
          </span>
        </div>

        <div className="comments-section">
          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <input
              type="text"
              className="comment-input"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button type="submit" className="comment-submit">Post</button>
          </form>

          <div className="comments-list">
            {post.comments?.map(comment => (
              <div key={comment.id} className="comment">
                <div className="comment-header">
                  <span className="comment-author">{comment.author}</span>
                  <span className="comment-timestamp">
                    {new Date(comment.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="comment-text">{comment.content}</p>
                {comment.authorId === currentUser?.uid && (
                  <button 
                    className="delete-comment"
                    onClick={() => onDeleteComment(post.id, comment.id)}
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 