import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { updateProfile } from 'firebase/auth';
import './Auth.css';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (!username) {
      return setError('Username is required');
    }

    if (username.length < 3) {
      return setError('Username must be at least 3 characters long');
    }

    if (username.length > 20) {
      return setError('Username must be less than 20 characters');
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return setError('Username can only contain letters, numbers, and underscores');
    }

    try {
      setError('');
      setLoading(true);
      
      // First create the user account
      const userCredential = await signup(email, password);
      const user = userCredential.user;
      
      // Then update the profile with the username
      await updateProfile(user, {
        displayName: username
      });

      // Force a reload to ensure the displayName is updated
      await user.reload();
      
      navigate('/');
    } catch (error) {
      console.error('Signup error:', error);
      setError('Failed to create an account: ' + error.message);
    }
    setLoading(false);
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Sign Up for OnlyCans</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username (3-20 characters)"
              required
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_]+"
            />
            <small className="input-help">Letters, numbers, and underscores only</small>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button disabled={loading} type="submit" className="auth-button">
            Sign Up
          </button>
        </form>
        <div className="auth-links">
          Already have an account? <Link to="/login">Log In</Link>
        </div>
      </div>
    </div>
  );
}

Signup.propTypes = {
  // Add any necessary prop types here
}; 