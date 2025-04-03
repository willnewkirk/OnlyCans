import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDM } from '../contexts/DMContext';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import './DMPage.css';
import { collection, query, orderBy, onSnapshot, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

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
  const navigate = useNavigate();

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

  return (
    <div className="dm-page">
      <Header />
      <div className="dm-container">
        <div className="dm-sidebar">
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
        
        <div className="dm-chat">
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
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`message ${message.senderId === currentUser.uid ? 'sent' : 'received'}`}
                  >
                    <p>{message.text}</p>
                    <span className="timestamp">
                      {new Date(message.timestamp?.toDate()).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendMessage} className="message-input">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                />
                <button type="submit">Send</button>
              </form>
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