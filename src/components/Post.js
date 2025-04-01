import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import './Post.css';

export default function Post({ post, onDelete }) {
  const { currentUser } = useAuth();
  const [votes, setVotes] = useState(post.votes || 0);
  const [userVoted, setUserVoted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(post.title);
  const [editedContent, setEditedContent] = useState(post.content);
  const [editedImageUrl, setEditedImageUrl] = useState(post.imageUrl);
  const [lastTap, setLastTap] = useState(0);
  const postRef = useRef(null);

  useEffect(() => {
    if (currentUser && post.userVotes) {
      setUserVoted(post.userVotes.includes(currentUser.uid));
    }
  }, [currentUser, post.userVotes]);

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  const handleDoubleTap = (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 500 && tapLength > 0) {
      handleVote();
    }
    setLastTap(currentTime);
  };

  const handleVote = async () => {
    if (!currentUser) return;

    const postRef = doc(db, 'posts', post.id);
    const newVoteStatus = !userVoted;

    try {
      await updateDoc(postRef, {
        votes: newVoteStatus ? votes + 1 : votes - 1,
        userVotes: newVoteStatus 
          ? arrayUnion(currentUser.uid)
          : arrayRemove(currentUser.uid)
      });

      setVotes(newVoteStatus ? votes + 1 : votes - 1);
      setUserVoted(newVoteStatus);
    } catch (error) {
      console.error('Error updating vote:', error);
    }
  };

  // ... rest of your existing code ...

  return (
    <div 
      className="post" 
      ref={postRef}
      onTouchStart={handleDoubleTap}
    >
      {/* ... rest of your existing JSX ... */}
    </div>
  );
} 