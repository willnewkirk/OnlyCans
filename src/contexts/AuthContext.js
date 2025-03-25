import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// eslint-disable-next-line react/prop-types
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add debugging
  console.log('AuthProvider initializing...');

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log('Auth state changed:', user ? 'User logged in' : 'No user');
        setCurrentUser(user);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Auth state change error:', err);
      setError(err);
      setLoading(false);
    }
  }, []);

  async function signup(email, password) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result;
    } catch (err) {
      console.error('Signup error:', err);
      throw err;
    }
  }

  async function login(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  }

  async function logout() {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
      throw err;
    }
  }

  // Update user profile function
  async function updateUserProfile(user, data) {
    try {
      await updateProfile(user, data);
      await user.reload();
      setCurrentUser({
        ...user,
        ...data
      });
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  const value = {
    currentUser,
    signup,
    login,
    logout,
    updateUserProfile,
    error
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#2d2d2d',
        color: '#fff'
      }}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#2d2d2d',
        color: '#fff'
      }}>
        <h1>Error</h1>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()} style={{
          padding: '10px 20px',
          backgroundColor: '#b388ff',
          border: 'none',
          borderRadius: '4px',
          color: '#fff',
          cursor: 'pointer',
          marginTop: '20px'
        }}>
          Retry
        </button>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 