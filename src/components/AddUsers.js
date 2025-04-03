import React from 'react';
import { addUsers } from '../utils/addUsers';

const AddUsers = () => {
  const handleAddUsers = async () => {
    await addUsers();
  };

  return (
    <button 
      onClick={handleAddUsers}
      style={{
        padding: '10px 20px',
        backgroundColor: '#6b46c1',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        margin: '20px'
      }}
    >
      Add Test Users
    </button>
  );
};

export default AddUsers; 