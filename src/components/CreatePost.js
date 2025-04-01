import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import heic2any from 'heic2any';
import './CreatePost.css';

export default function CreatePost({ onClose, onSubmit }) {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      let processedFile = file;
      
      // Check if the file is a HEIC image
      if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
        // Convert HEIC to JPEG using heic2any
        const blob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.9
        });
        
        // Create a new File object from the blob
        processedFile = new File([blob], file.name.replace('.heic', '.jpg'), {
          type: 'image/jpeg'
        });
      }

      setImageFile(processedFile);
      setImageUrl(URL.createObjectURL(processedFile));
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);

      let finalImageUrl = '';
      
      // If there's an image file, upload it first
      if (imageFile) {
        const storageRef = ref(storage, `posts/${currentUser.uid}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      } else if (imageUrl.trim()) {
        // If there's an image URL, use it directly
        finalImageUrl = imageUrl.trim();
      }

      // Create the post
      const newPost = {
        title,
        content,
        imageUrl: finalImageUrl,
        authorId: currentUser.uid,
        authorName: currentUser.displayName,
        createdAt: new Date(),
        votes: 0,
        userVotes: [],
        comments: 0,
        userId: currentUser.uid,
        username: currentUser.displayName,
        userPhotoURL: currentUser.photoURL,
        caption: content.trim(),
        timestamp: serverTimestamp(),
        likes: 0,
        comments: []
      };

      // If onSubmit prop is provided, use it
      if (onSubmit) {
        await onSubmit(newPost);
      } else {
        // Otherwise, create the post directly
        await addDoc(collection(db, 'posts'), newPost);
      }

      // Clear form and close modal
      setTitle('');
      setContent('');
      setImageUrl('');
      setImageFile(null);
      setSuccess('Post created successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Failed to create post: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="create-post">
      <div className="create-post-content">
        <h2>Create New Post</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title"
              maxLength={300}
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">Content</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share a piece, drawing, etc."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">Image (Optional)</label>
            <div className="image-upload-container">
              <input
                type="file"
                id="image"
                accept="image/*,.heic"
                onChange={handleImageChange}
                className="file-input"
                disabled={loading}
              />
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Or enter image URL"
                className="url-input"
              />
            </div>
            {imageUrl && (
              <div className="image-preview">
                <img src={imageUrl} alt="Preview" />
              </div>
            )}
          </div>

          <div className="button-group">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !title.trim() || !content.trim() || !imageUrl.trim()}>
              {loading ? 'Creating...' : 'Create Post'}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </form>
      </div>
    </div>
  );
} 