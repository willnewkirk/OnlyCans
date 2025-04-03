import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDM } from '../contexts/DMContext';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import Header from './Header';
import './NewDM.css';

function NewDM() {
  const { currentUser } = useAuth();
  const { startConversation } = useDM();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef);
        const querySnapshot = await getDocs(q);
        
        const usersData = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            uid: doc.id,
            displayName: doc.data().displayName || 'Anonymous User',
            ...doc.data()
          }))
          .filter(user => user.uid !== currentUser?.uid);
        
        setUsers(usersData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  const handleStartConversation = async () => {
    if (selectedUsers.length === 0) return;

    try {
      const userIds = selectedUsers.map(user => user.uid);
      const conversationId = await startConversation(
        userIds,
        selectedUsers.length > 1 ? groupName : null
      );
      
      if (conversationId) {
        navigate(`/dm/${currentUser.displayName}`);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const toggleUserSelection = (user) => {
    if (selectedUsers.some(u => u.uid === user.uid)) {
      setSelectedUsers(selectedUsers.filter(u => u.uid !== user.uid));
    } else if (selectedUsers.length < 10) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!user.displayName) return false;
    return user.displayName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="new-dm-page">
      <Header />
      <div className="new-dm-container">
        <h2>New Chat</h2>
        
        {selectedUsers.length > 1 && (
          <div className="group-name-input">
            <input
              type="text"
              placeholder="Group name (optional)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
        )}

        <div className="selected-users">
          {selectedUsers.map(user => (
            <div key={user.uid} className="selected-user">
              <span className="selected-user-name">{user.displayName}</span>
              {user.flair && (
                <span className="selected-user-flair">{user.flair}</span>
              )}
              <button onClick={() => toggleUserSelection(user)}>×</button>
            </div>
          ))}
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="users-list">
          {loading ? (
            <p>Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <p>No users found</p>
          ) : (
            filteredUsers.map(user => (
              <div
                key={user.uid}
                className={`user-item ${selectedUsers.some(u => u.uid === user.uid) ? 'selected' : ''}`}
                onClick={() => toggleUserSelection(user)}
              >
                <div className="user-info">
                  <span className="username">{user.displayName}</span>
                  {user.flair && (
                    <span className="user-flair">{user.flair}</span>
                  )}
                </div>
                {selectedUsers.some(u => u.uid === user.uid) ? (
                  <span className="checkmark">✓</span>
                ) : null}
              </div>
            ))
          )}
        </div>

        <button 
          className="start-chat-button"
          onClick={handleStartConversation}
          disabled={selectedUsers.length === 0}
        >
          Start Chat
        </button>
      </div>
    </div>
  );
}

export default NewDM; 