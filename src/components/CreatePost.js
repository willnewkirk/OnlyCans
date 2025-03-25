import React, { useState } from 'react';
import './CreatePost.css';

function CreatePost({ onSubmit, onClose }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Validate inputs
      if (!title.trim()) {
        setError('Title is required');
        return;
      }

      if (!content.trim() && !imageUrl.trim()) {
        setError('Please add either text content or an image URL');
        return;
      }

      // Create post object
      const post = {
        title: title.trim(),
        content: content.trim(),
        imageUrl: imageUrl.trim()
      };

      await onSubmit(post);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create post');
    }
  };

  return (
    <div className="create-post-modal">
      <div className="create-post-content">
        <h2>Create New Post</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title"
            />
          </div>
          <div className="form-group">
            <label htmlFor="content">Content</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows="4"
            />
          </div>
          <div className="form-group">
            <label htmlFor="imageUrl">Image URL (optional)</label>
            <input
              type="text"
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Enter image URL"
            />
          </div>
          <div className="button-group">
            <button type="submit" className="submit-btn">Create Post</button>
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePost; 