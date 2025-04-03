import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, orderBy, onSnapshot, serverTimestamp, arrayUnion, limit, startAfter, getDocs, getDoc } from 'firebase/firestore';
import { getUserRole } from '../utils/roles';
import Header from './Header';
import MainContent from './MainContent';
import CreatePost from './CreatePost';

export default function AppContent({ showAllPosts = false }) {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [totalPostCount, setTotalPostCount] = useState(0);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const POSTS_PER_PAGE = 10;
  const navigate = useNavigate();

  const loadMorePosts = useCallback(async () => {
    if (!hasMore || isLoading) return;
    
    setIsLoading(true);
    try {
      const postsRef = collection(db, 'posts');
      let postsQuery;
      
      if (lastVisible) {
        postsQuery = query(
          postsRef,
          orderBy('timestamp', 'desc'),
          startAfter(lastVisible),
          limit(POSTS_PER_PAGE)
        );
      } else {
        postsQuery = query(
          postsRef,
          orderBy('timestamp', 'desc'),
          limit(POSTS_PER_PAGE)
        );
      }

      const snapshot = await getDocs(postsQuery);
      
      if (snapshot.empty) {
        setHasMore(false);
        setIsLoading(false);
        return;
      }

      const newPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toMillis() || Date.now()
      }));

      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setPosts(prevPosts => [...prevPosts, ...newPosts]);
      setHasMore(snapshot.docs.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error loading more posts:', error);
      setError('Failed to load more posts: ' + error.message);
    }
    setIsLoading(false);
  }, [lastVisible, hasMore, isLoading]);

  const fetchTotalPostCount = async () => {
    try {
      const postsRef = collection(db, 'posts');
      const snapshot = await getDocs(query(postsRef));
      setTotalPostCount(snapshot.size);
    } catch (error) {
      console.error('Error fetching total post count:', error);
    }
  };

  useEffect(() => {
    setPosts([]);
    setLastVisible(null);
    setHasMore(true);
    loadMorePosts();
    
    fetchTotalPostCount();

    if (!showAllPosts) {
      const postsRef = collection(db, 'posts');
      const postsQuery = query(postsRef, orderBy('timestamp', 'desc'), limit(5));
      
      const unsubscribe = onSnapshot(postsQuery, 
        (snapshot) => {
          try {
            const loadedPosts = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toMillis() || Date.now()
            }));
            
            setPosts(loadedPosts);
          } catch (err) {
            console.error('Error processing posts:', err);
            setError('Failed to process posts');
          }
        },
        (error) => {
          console.error('Posts listener error:', error);
          setError('Failed to load posts: ' + error.message);
        }
      );

      return () => unsubscribe();
    }
  }, [showAllPosts]);

  const handleVote = async (postId, voteType) => {
    if (!currentUser) {
      setError('You must be logged in to vote');
      return;
    }

    try {
      const postRef = doc(db, 'posts', postId);
      const post = posts.find(p => p.id === postId);
      if (!post) {
        setError('Post not found');
        return;
      }

      const currentVote = post.userVotes?.[currentUser.uid];
      const currentVoteCount = post.votes || 0;

      let updates = {};
      if (currentVote === voteType) {
        // Remove vote if clicking the same button
        updates = {
          votes: currentVoteCount - 1,
          [`userVotes.${currentUser.uid}`]: null
        };
      } else if (!currentVote) {
        // New vote
        updates = {
          votes: voteType === 'up' ? currentVoteCount + 1 : currentVoteCount - 1,
          [`userVotes.${currentUser.uid}`]: voteType
        };
      } else {
        // Change vote
        if (currentVote === 'up' && voteType === 'down') {
          // If changing from upvote to downvote, subtract 2
          updates = {
            votes: currentVoteCount - 2,
            [`userVotes.${currentUser.uid}`]: voteType
          };
        } else if (currentVote === 'down' && voteType === 'up') {
          // If changing from downvote to upvote, add 2
          updates = {
            votes: currentVoteCount + 2,
            [`userVotes.${currentUser.uid}`]: voteType
          };
        }
      }

      await updateDoc(postRef, updates);

      // Update local state
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            votes: updates.votes,
            userVotes: {
              ...p.userVotes,
              [currentUser.uid]: updates[`userVotes.${currentUser.uid}`]
            }
          };
        }
        return p;
      }));
    } catch (error) {
      console.error('Error updating vote:', error);
      setError('Failed to update vote: ' + error.message);
    }
  };

  const handleDelete = async (postId) => {
    if (!currentUser) {
      setError('You must be logged in to delete posts');
      return;
    }

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) {
        setError('Post not found');
        return;
      }

      if (post.authorId !== currentUser.uid) {
        setError('You can only delete your own posts');
        return;
      }

      const postRef = doc(db, 'posts', postId);
      await deleteDoc(postRef);
      
      setPosts(posts.filter(p => p.id !== postId));
      
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }

      fetchTotalPostCount();
      setError(null);
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('Failed to delete post: ' + error.message);
    }
  };

  const handleComment = async (postId, comment) => {
    if (!currentUser) return;

    try {
      const postRef = doc(db, 'posts', postId);
      const newComment = {
        id: Date.now().toString(),
        content: comment.content,
        author: currentUser.displayName || 'Anonymous User',
        authorId: currentUser.uid,
        timestamp: Date.now()
      };

      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });

      setPosts(posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [...(p.comments || []), newComment]
          };
        }
        return p;
      }));
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!currentUser) return;

    try {
      const postRef = doc(db, 'posts', postId);
      const post = posts.find(p => p.id === postId);
      const updatedComments = post.comments.filter(c => c.id !== commentId);

      await updateDoc(postRef, {
        comments: updatedComments
      });

      setPosts(posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: updatedComments
          };
        }
        return p;
      }));
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Failed to delete comment');
    }
  };

  const handleCreatePost = async (newPost) => {
    try {
      setIsCreatePostOpen(false);
      
      if (!currentUser) {
        setError('You must be logged in to create a post');
        return;
      }

      // Get user's role from local management
      const userRole = getUserRole(currentUser.uid);

      const post = {
        title: newPost.title || '',
        content: newPost.content || '',
        imageUrl: newPost.imageUrl || '',
        timestamp: serverTimestamp(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous User',
        authorRole: userRole,
        votes: 0,
        userVotes: {},
        comments: []
      };
      
      if (!post.title.trim()) {
        throw new Error('Post title is required');
      }
      
      if (!post.content.trim() && !post.imageUrl) {
        throw new Error('Post must have either content or an image');
      }

      const postsRef = collection(db, 'posts');
      await addDoc(postsRef, post);
      setError(null);
      
      fetchTotalPostCount();
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to create post');
    }
  };

  const displayPosts = showAllPosts ? posts : posts.slice(0, 5);

  return (
    <div className="app-content">
      <Header />
      <MainContent
        posts={posts}
        onVote={handleVote}
        onDelete={handleDelete}
        onCreatePost={() => setIsCreatePostOpen(true)}
        onComment={handleComment}
        onDeleteComment={handleDeleteComment}
        showAllPosts={showAllPosts}
        totalPosts={totalPostCount}
        hasMore={hasMore}
        isLoading={isLoading}
        onLoadMore={loadMorePosts}
      />
      {isCreatePostOpen && (
        <CreatePost
          onClose={() => setIsCreatePostOpen(false)}
          onSubmit={handleCreatePost}
        />
      )}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
    </div>
  );
} 