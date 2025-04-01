import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updatePassword, deleteUser } from 'firebase/auth';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import './ProfileSettings.css';

export default function ProfileSettings() {
  const { currentUser, updateUserProfile } = useAuth();
  const [username, setUsername] = useState(currentUser?.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const handleUsernameUpdate = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }

    // Don't update if username hasn't changed
    if (username === currentUser.displayName) {
      setError('Username is the same as current');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);

      console.log('Starting username update process...');
      console.log('Current user:', currentUser.uid);
      console.log('New username:', username);

      // Check if new username is already taken
      const usersRef = collection(db, 'users');
      const usernameQuery = query(usersRef, where('username', '==', username));
      const usernameSnapshot = await getDocs(usernameQuery);
      
      if (!usernameSnapshot.empty) {
        console.log('Username already taken');
        setError('Username is already taken');
        setLoading(false);
        return;
      }

      console.log('Updating user document...');
      // Update user profile in Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      try {
        await updateDoc(userRef, {
          username: username,
          displayName: username
        });
        console.log('User document updated successfully');
      } catch (userError) {
        console.error('Error updating user document:', userError);
        throw userError;
      }

      console.log('Updating posts...');
      // Update all posts with the new username
      const postsRef = collection(db, 'posts');
      const postsQuery = query(postsRef, where('authorId', '==', currentUser.uid));
      const postsSnapshot = await getDocs(postsQuery);
      console.log('Found posts to update:', postsSnapshot.size);

      if (postsSnapshot.empty) {
        console.log('No posts found to update');
      } else {
        // Update each post with the new username
        const updatePromises = postsSnapshot.docs.map(async postDoc => {
          console.log('Updating post:', postDoc.id);
          try {
            await updateDoc(doc(db, 'posts', postDoc.id), {
              authorName: username
            });
            console.log('Successfully updated post:', postDoc.id);
          } catch (postError) {
            console.error('Error updating post:', postDoc.id, postError);
            throw postError;
          }
        });

        // Wait for all post updates to complete
        try {
          await Promise.all(updatePromises);
          console.log('All posts updated successfully');
        } catch (updateError) {
          console.error('Error during post updates:', updateError);
          throw updateError;
        }
      }

      console.log('Updating Firebase Auth profile...');
      // Update Firebase Auth profile
      await updateUserProfile(currentUser, { displayName: username });
      console.log('Firebase Auth profile updated successfully');

      setSuccess('Username updated successfully!');
    } catch (error) {
      console.error('Detailed error:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      setError('Failed to update username: ' + error.message);
    }
    setLoading(false);
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);
      await updatePassword(currentUser, newPassword);
      setSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setError('Failed to update password: ' + error.message);
    }
    setLoading(false);
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword) {
      setError('Please enter your password to confirm account deletion');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);

      // First, reauthenticate the user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        deletePassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      console.log('Deleting user data...');
      
      // Delete user's posts
      const postsRef = collection(db, 'posts');
      const postsQuery = query(postsRef, where('authorId', '==', currentUser.uid));
      const postsSnapshot = await getDocs(postsQuery);
      
      const deletePromises = postsSnapshot.docs.map(async (postDoc) => {
        // Delete comments for each post
        const commentsRef = collection(db, 'posts', postDoc.id, 'comments');
        const commentsSnapshot = await getDocs(commentsRef);
        const commentDeletes = commentsSnapshot.docs.map(commentDoc => 
          deleteDoc(doc(db, 'posts', postDoc.id, 'comments', commentDoc.id))
        );
        await Promise.all(commentDeletes);
        
        // Delete the post
        return deleteDoc(doc(db, 'posts', postDoc.id));
      });
      
      await Promise.all(deletePromises);
      console.log('Posts and comments deleted');

      // Delete user document
      const userRef = doc(db, 'users', currentUser.uid);
      await deleteDoc(userRef);
      console.log('User document deleted');

      // Delete Firebase Auth account
      await deleteUser(currentUser);
      console.log('Firebase Auth account deleted');

      setSuccess('Account deleted successfully');
      // The user will be automatically signed out and redirected to login
    } catch (error) {
      console.error('Error deleting account:', error);
      setError('Failed to delete account: ' + error.message);
    }
    setLoading(false);
    setShowDeleteConfirm(false);
    setDeletePassword('');
  };

  return (
    <div className="profile-settings-dropdown">
      <button 
        className="settings-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        Profile Settings
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>
      
      {isOpen && (
        <div className="settings-content">
          <div className="settings-section">
            <h3>Update Username</h3>
            <form onSubmit={handleUsernameUpdate}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter new username"
                />
              </div>
              <button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Username'}
              </button>
            </form>
          </div>

          <div className="settings-section">
            <h3>Update Password</h3>
            <form onSubmit={handlePasswordUpdate}>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              <button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          <div className="settings-section delete-account-section">
            <h3>Delete Account</h3>
            {!showDeleteConfirm ? (
              <button 
                className="delete-account-button"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Account
              </button>
            ) : (
              <form onSubmit={handleDeleteAccount}>
                <div className="form-group">
                  <label htmlFor="deletePassword">
                    Enter your password to confirm account deletion
                  </label>
                  <input
                    type="password"
                    id="deletePassword"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </div>
                <div className="delete-account-actions">
                  <button 
                    type="button" 
                    className="cancel-delete"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword('');
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="confirm-delete"
                    disabled={loading}
                  >
                    {loading ? 'Deleting...' : 'Confirm Delete Account'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </div>
      )}
    </div>
  );
} 