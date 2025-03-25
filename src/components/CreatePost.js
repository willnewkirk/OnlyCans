import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './CreatePost.css';

export default function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      setError('You can only upload up to 5 images');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate images
      if (images.length > 5) {
        throw new Error('You can only upload up to 5 images');
      }

      // Create new post
      const newPost = {
        content,
        images,
        authorId: currentUser.uid,
        author: currentUser.displayName || 'Anonymous User'
      };

      // Call the parent's handler to create the post
      onPostCreated(newPost);
      
      // Navigate back to home
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="create-post-container">
      <div className="create-post-card">
        <h2>Create a Post</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your street art story..."
              rows={6}
              required
            />
          </div>
          <div className="form-group">
            <label>Images (up to 5)</label>
            <input
              type="file"
              onChange={handleImageChange}
              accept="image/*"
              multiple
              className="file-input"
            />
            <div className="image-preview">
              {images.map((image, index) => (
                <div key={index} className="image-preview-item">
                  <img src={image} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="remove-image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => navigate('/')} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 