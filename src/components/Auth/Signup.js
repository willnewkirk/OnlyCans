import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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

    if (username.length < 3) {
      return setError('Username must be at least 3 characters long');
    }

    try {
      setError('');
      setLoading(true);
      const userCredential = await signup(email, password);
      const user = userCredential.user;
      
      // Update the user's profile with the username
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
        <h2>Sign Up</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button disabled={loading} type="submit">
            Sign Up
          </button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center', color: '#d7dadc' }}>
          Already have an account? <Link to="/login" style={{ color: '#b388ff', textDecoration: 'none' }}>Log In</Link>
        </p>
      </div>
    </div>
  );
} 