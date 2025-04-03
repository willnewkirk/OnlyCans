import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDM } from '../contexts/DMContext';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import './DMPage.css';
import { collection, query, orderBy, onSnapshot, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import heic2any from 'heic2any';

function DMPage() {
  const { username } = useParams();
  const { currentUser } = useAuth();
  const { conversations, loading, startConversation, sendMessage, currentConversation, setCurrentConversation, renameGroupChat, deleteGroupChat } = useDM();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastTapRef = useRef(0);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (currentConversation) {
      // Fetch messages for selected conversation
      const q = query(
        collection(db, `dms/${currentConversation.id}/messages`),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(messagesData);
      });

      // Fetch participant details
      const fetchParticipants = async () => {
        const participantDetails = await Promise.all(
          currentConversation.participants.map(async (participantId) => {
            const userRef = doc(db, 'users', participantId);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
              return { id: participantId, ...userDoc.data() };
            }
            return null;
          })
        );
        setParticipants(participantDetails.filter(p => p !== null));
      };

      fetchParticipants();

      return () => unsubscribe();
    }
  }, [currentConversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentConversation) return;

    await sendMessage(currentConversation.id, newMessage.trim());
    setNewMessage('');
  };

  const handleRename = async () => {
    try {
      await renameGroupChat(currentConversation.id, newGroupName);
      setIsRenaming(false);
      setNewGroupName('');
    } catch (error) {
      console.error('Error renaming group chat:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGroupChat(currentConversation.id);
      setCurrentConversation(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting group chat:', error);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    try {
      setIsUploading(true);
      let imageFile = file;

      // Convert HEIC to JPEG if needed
      if (file.type === 'image/heic' || file.type === 'image/heif') {
        const blob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.8
        });
        imageFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
      }

      // Upload to Firebase Storage
      const storageRef = ref(storage, `dm-images/${currentConversation.id}/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Send message with image
      await sendMessage(currentConversation.id, '', downloadURL);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
      if (validTypes.includes(file.type)) {
        handleImageUpload(file);
      } else {
        alert('Please select a valid image file (JPG, PNG, or HEIC)');
      }
    }
  };

  const handleDoubleTap = (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapRef.current;
    if (tapLength < 500 && tapLength > 0) {
      setIsFullscreen(!isFullscreen);
    }
    lastTapRef.current = currentTime;
  };

  return (
    <div className="dm-page">
      <Header />
      <div className={`dm-container ${isFullscreen ? 'fullscreen' : ''}`}>
        <div className={`dm-sidebar ${isFullscreen ? 'hidden' : ''}`}>
          <h2>Direct Messages</h2>
          <Link to="/dm/new" className="new-dm-button">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            <span>New Message</span>
          </Link>
          <div className="conversations-list">
            {loading ? (
              <p>Loading conversations...</p>
            ) : conversations.length === 0 ? (
              <p>No conversations yet</p>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`conversation-item ${currentConversation?.id === conv.id ? 'active' : ''}`}
                  onClick={() => setCurrentConversation(conv)}
                >
                  {conv.isGroup ? (
                    <div className="group-chat-info">
                      <span className="group-name">{conv.groupName}</span>
                      <span className="participant-count">{conv.participants.length} members</span>
                    </div>
                  ) : (
                    <span className="participant-name">
                      {conv.participants.find(p => p !== currentUser?.uid)?.displayName || 'Unknown User'}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div 
          className="dm-chat"
          ref={chatContainerRef}
          onTouchStart={handleDoubleTap}
        >
          {currentConversation ? (
            <>
              <div className="chat-header">
                {currentConversation.isGroup ? (
                  <div className="group-chat-header">
                    {isRenaming ? (
                      <div className="rename-input">
                        <input
                          type="text"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          placeholder="Enter new group name"
                        />
                        <button className="action-button save-button" onClick={handleRename}>Save</button>
                        <button className="action-button cancel-button" onClick={() => setIsRenaming(false)}>Cancel</button>
                      </div>
                    ) : (
                      <>
                        <h3>{currentConversation.groupName}</h3>
                        <div className="group-chat-actions">
                          <button 
                            className="action-button rename-button"
                            onClick={() => {
                              setIsRenaming(true);
                              setNewGroupName(currentConversation.groupName);
                            }}
                          >
                            Rename
                          </button>
                          <button 
                            className="action-button delete-button"
                            onClick={() => setShowDeleteConfirm(true)}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <h3>
                    {participants.find(p => p.uid !== currentUser?.uid)?.displayName || 'Unknown User'}
                  </h3>
                )}
              </div>

              {currentConversation.isGroup && (
                <div className="group-members">
                  <h4>Group Members</h4>
                  <div className="members-list">
                    {participants.map(participant => (
                      <div key={participant.uid} className="member-item">
                        <span className="member-name">{participant.displayName}</span>
                        {participant.flair && (
                          <span className="member-flair">{participant.flair}</span>
                        )}
                        {participant.uid === currentUser?.uid && (
                          <span className="member-you">(You)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="messages-container">
                {messages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`message ${message.senderId === currentUser?.uid ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">
                      {message.imageUrl && (
                        <div className="message-image-container">
                          <img 
                            src={message.imageUrl} 
                            alt="Shared" 
                            className="message-image"
                            onClick={() => window.open(message.imageUrl, '_blank')}
                          />
                        </div>
                      )}
                      {message.text && <p className="message-text">{message.text}</p>}
                      <span className="timestamp">
                        {new Date(message.timestamp?.toDate()).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="message-input-container">
                <button 
                  className="image-upload-button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : '📷'}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/jpeg,image/png,image/heic,image/heif"
                  style={{ display: 'none' }}
                />
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="message-input"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button 
                  onClick={handleSendMessage}
                  className="send-button"
                  disabled={!newMessage.trim()}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="no-conversation">
              <p>Select a conversation or start a new one</p>
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="delete-confirm-modal">
          <div className="delete-confirm-content">
            <h3>Delete Group Chat</h3>
            <p>Are you sure you want to delete this group chat? This action cannot be undone.</p>
            <div className="delete-confirm-buttons">
              <button onClick={handleDelete}>Delete</button>
              <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DMPage; 