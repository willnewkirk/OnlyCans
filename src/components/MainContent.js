import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PostModal from './PostModal';
import './MainContent.css';

export default function MainContent({ 
  posts, 
  onVote, 
  onDelete, 
  onCreatePost, 
  onComment, 
  onDeleteComment,
  showAllPosts = false,
  totalPosts = 0,
  hasMore = false,
  isLoading = false,
  onLoadMore = () => {}
}) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedPost, setSelectedPost] = useState(null);
  const loadMoreRef = useRef(null);
  const POSTS_TO_SHOW = 5;

  useEffect(() => {
    if (!showAllPosts) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [showAllPosts, hasMore, isLoading, onLoadMore]);

  const formatTimestamp = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    // Convert to seconds
    const seconds = Math.floor(diff / 1000);
    
    // Convert to minutes
    const minutes = Math.floor(seconds / 60);
    
    // Convert to hours
    const hours = Math.floor(minutes / 60);
    
    // Convert to days
    const days = Math.floor(hours / 24);
    
    // Convert to months (approximate)
    const months = Math.floor(days / 30);
    
    if (months > 0) {
      return `${months}mo`;
    } else if (days > 0) {
      return `${days}d`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return 'just now';
    }
  };

  const truncateText = (text, maxLength = 4) => {
    if (!text) return '';
    // Only truncate if text is longer than maxLength
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  const handleCloseModal = () => {
    setSelectedPost(null);
  };

  const handleDeletePost = (postId) => {
    onDelete(postId);
    setSelectedPost(null);
  };

  const handleViewAllPosts = () => {
    navigate('/all-posts');
  };

  const getAuthorClassNames = (post) => {
    const classes = ['post-author'];
    if (post.authorRole === 'admin') {
      classes.push('admin');
    } else if (post.authorRole === 'mod') {
      classes.push('mod');
    }
    return classes.join(' ');
  };

  return (
    <div className="main-content">
      <div className="sidebar">
        <div className="community-info">
          <h2>Welcome to OnlyCans</h2>
          <p>Share a piece, drawing, etc.</p>
          <button 
            className="create-post-btn"
            onClick={onCreatePost}
          >
            Create Post
          </button>
        </div>
      </div>

      <div className="feed">
        {showAllPosts && (
          <div className="feed-header">
            <h2>All Posts</h2>
            <button 
              className="back-button"
              onClick={() => navigate('/')}
            >
              Back to Home
            </button>
          </div>
        )}
        
        {posts.length === 0 ? (
          <div className="empty-state">
            <p>No posts yet. Be the first to share!</p>
          </div>
        ) : (
          <>
            {posts.map(post => (
              <div 
                key={post.id} 
                className="post"
                onClick={() => setSelectedPost(post)}
              >
                <div className="post-header">
                  <div className="post-header-left">
                    <Link 
                      to={`/profile/${post.authorName}`} 
                      className={getAuthorClassNames(post)}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(`/profile/${post.authorName}`);
                      }}
                    >
                      {post.authorName}
                    </Link>
                    <span className="post-timestamp">
                      {formatTimestamp(post.timestamp)}
                    </span>
                  </div>
                  <div className="post-header-actions">
                    {post.authorId === currentUser?.uid && (
                      <button 
                        className="delete-post"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePost(post.id);
                        }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
                
                <h3 className="post-title">{post.title}</h3>
                <p className="post-content">{post.content}</p>
                
                {post.imageUrl && (
                  <div className="post-images">
                    <img 
                      src={post.imageUrl} 
                      alt="Post content" 
                      className="post-image"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                
                <div className="post-actions">
                  <div className="vote-buttons">
                    <button 
                      className={`vote-button ${post.userVotes?.[currentUser?.uid] === 'up' ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onVote(post.id, 'up');
                      }}
                    >
                      👍
                    </button>
                    <span>{post.votes || 0}</span>
                    <button 
                      className={`vote-button ${post.userVotes?.[currentUser?.uid] === 'down' ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onVote(post.id, 'down');
                      }}
                    >
                      👎
                    </button>
                  </div>
                  <span className="comment-count">
                    💬 {post.comments?.length || 0}
                  </span>
                </div>
              </div>
            ))}
            {!showAllPosts && totalPosts > POSTS_TO_SHOW && (
              <div className="view-all-posts-container">
                <button 
                  className="view-all-posts-btn"
                  onClick={handleViewAllPosts}
                >
                  View All Posts ({totalPosts})
                </button>
              </div>
            )}
            {showAllPosts && (
              <div ref={loadMoreRef} className="load-more">
                {isLoading && <div className="loading">Loading more posts...</div>}
                {!hasMore && posts.length > 0 && (
                  <div className="no-more-posts">No more posts to load</div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="right-sidebar">
        <div className="rules">
          <h3>Community Rules</h3>
          <ol>
            <li>
              <strong>Respect Others</strong>
              Be kind and respectful to all members of the community.
            </li>
            <li>
              <strong>Original Content</strong>
              Only post your own photos and content.
            </li>
            <li>
              <strong>No Spam</strong>
              Avoid posting promotional content or excessive self-promotion.
            </li>
            <li>
              <strong>Privacy</strong>
              Don't share personal information or private details.
            </li>
            <li>
              <strong>Quality Content</strong>
              Post clear, well-lit photos of cans.
            </li>
          </ol>
        </div>
      </div>

      {selectedPost && (
        <PostModal 
          post={selectedPost}
          onClose={handleCloseModal}
          onVote={onVote}
          onComment={onComment}
          onDeletePost={handleDeletePost}
          onDeleteComment={onDeleteComment}
        />
      )}
    </div>
  );
} 