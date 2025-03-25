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
  return useContext(AuthContext);
}

// eslint-disable-next-line react/prop-types
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add debugging
  console.log('AuthProvider initializing...');

  async function signup(email, password) {
    console.log('Attempting signup...');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  function login(email, password) {
    console.log('Attempting login...');
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    console.log('Attempting logout...');
    return signOut(auth);
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

  useEffect(() => {
    console.log('Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, async user => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      if (user) {
        // Get fresh user data to ensure we have the latest displayName
        await user.reload();
        const freshUser = auth.currentUser;
        setCurrentUser({
          ...freshUser,
          displayName: freshUser.displayName || '',
          email: freshUser.email,
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 