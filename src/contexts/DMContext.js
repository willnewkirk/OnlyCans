import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, addDoc, onSnapshot, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const DMContext = createContext();

export function useDM() {
  return useContext(DMContext);
}

export function DMProvider({ children }) {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'dms'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conversationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setConversations(conversationsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const startConversation = async (participantIds, groupName = null) => {
    try {
      if (!currentUser) return;

      const allParticipants = [currentUser.uid, ...participantIds];
      const isGroup = participantIds.length > 1;

      // Check if conversation already exists
      const existingConv = conversations.find(conv => {
        if (conv.participants.length !== allParticipants.length) return false;
        return allParticipants.every(id => conv.participants.includes(id));
      });

      if (existingConv) {
        setCurrentConversation(existingConv);
        return existingConv;
      }

      const conversationData = {
        participants: allParticipants,
        createdAt: new Date(),
        isGroup,
        groupName: isGroup ? groupName : null
      };

      const docRef = await addDoc(collection(db, 'dms'), conversationData);
      const newConversation = { id: docRef.id, ...conversationData };
      setConversations(prev => [...prev, newConversation]);
      setCurrentConversation(newConversation);
      return newConversation;
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw error;
    }
  };

  const sendMessage = async (conversationId, text, imageUrl = null) => {
    try {
      if (!currentUser) return;

      const messageData = {
        text: text || '',
        senderId: currentUser.uid,
        timestamp: new Date(),
        imageUrl: imageUrl || null
      };

      await addDoc(collection(db, `dms/${conversationId}/messages`), messageData);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const renameGroupChat = async (conversationId, newName) => {
    try {
      const conversationRef = doc(db, 'dms', conversationId);
      await updateDoc(conversationRef, {
        groupName: newName
      });
      
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === conversationId 
            ? { ...conv, groupName: newName }
            : conv
        )
      );
    } catch (error) {
      console.error('Error renaming group chat:', error);
      throw error;
    }
  };

  const deleteGroupChat = async (conversationId) => {
    try {
      const conversationRef = doc(db, 'dms', conversationId);
      await deleteDoc(conversationRef);
      
      setConversations(prevConversations => 
        prevConversations.filter(conv => conv.id !== conversationId)
      );
    } catch (error) {
      console.error('Error deleting group chat:', error);
      throw error;
    }
  };

  const value = {
    conversations,
    currentConversation,
    setCurrentConversation,
    loading,
    startConversation,
    sendMessage,
    renameGroupChat,
    deleteGroupChat
  };

  return (
    <DMContext.Provider value={value}>
      {children}
    </DMContext.Provider>
  );
} 