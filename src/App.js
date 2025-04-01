import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppContent from './components/AppContent';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Profile from './components/Profile';
import AllPosts from './components/AllPosts';
import SprayPaintEffect from './components/SprayPaintEffect';
import './styles/MainContent.css';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <SprayPaintEffect />
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/all-posts" element={<AllPosts />} />
      </Routes>
    </AuthProvider>
  );
}

export default App; 