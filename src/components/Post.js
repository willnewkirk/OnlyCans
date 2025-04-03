import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, getDoc, arrayUnion, arrayRemove, collection, addDoc, deleteDoc, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
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
  const [likes, setLikes] = useState([]);

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

  useEffect(() => {
    // Fetch likes
    const likesRef = collection(db, `posts/${post.id}/likes`);
    const unsubscribeLikes = onSnapshot(likesRef, (snapshot) => {
      const likesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLikes(likesData);
    });

    // Fetch comments
    const commentsRef = collection(db, `posts/${post.id}/comments`);
    const unsubscribeComments = onSnapshot(commentsRef, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(commentsData);
    });

    return () => {
      unsubscribeLikes();
      unsubscribeComments();
    };
  }, [post.id]);

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

  const handleLike = async () => {
    if (!currentUser) return;

    const likeRef = collection(db, `posts/${post.id}/likes`);
    const existingLike = likes.find(like => like.userId === currentUser.uid);

    if (existingLike) {
      await deleteDoc(doc(db, `posts/${post.id}/likes`, existingLike.id));
    } else {
      await addDoc(likeRef, {
        userId: currentUser.uid,
        timestamp: new Date()
      });
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!currentUser || !newComment.trim()) return;

    const commentsRef = collection(db, `posts/${post.id}/comments`);
    await addDoc(commentsRef, {
      text: newComment.trim(),
      userId: currentUser.uid,
      userDisplayName: currentUser.displayName,
      timestamp: new Date()
    });

    setNewComment('');
  };

  return (
    <div 
      className="post" 
      ref={postRef}
      onTouchStart={handleDoubleTap}
    >
      <div className="post-header">
        <Link to={`/profile/${post.username}`} className="post-username">
          {post.username}
        </Link>
        <span className="post-date">
          {new Date(post.timestamp?.toDate()).toLocaleDateString()}
        </span>
      </div>
      <div className="post-content">
        <p>{post.content}</p>
        {post.imageUrl && (
          <img src={post.imageUrl} alt="Post content" className="post-image" />
        )}
      </div>
      <div className="post-actions">
        <button 
          className={`like-button ${likes.some(like => like.userId === currentUser?.uid) ? 'liked' : ''}`}
          onClick={handleLike}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span>{likes.length}</span>
        </button>
        <button 
          className="comment-button"
          onClick={() => setShowComments(!showComments)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>{comments.length}</span>
        </button>
      </div>
      {showComments && (
        <div className="comments-section">
          <form onSubmit={handleComment} className="comment-form">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
            />
            <button type="submit">Post</button>
          </form>
          <div className="comments-list">
            {comments.map(comment => (
              <div key={comment.id} className="comment">
                <Link to={`/profile/${comment.userDisplayName}`} className="comment-username">
                  {comment.userDisplayName}
                </Link>
                <p>{comment.text}</p>
                <span className="comment-date">
                  {new Date(comment.timestamp?.toDate()).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 