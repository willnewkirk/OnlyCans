// Map of user IDs to their roles
export const userRoles = {
  // Add your user ID here with the desired role
  [localStorage.getItem('userId')]: 'admin'  // This will automatically use the current user's ID
};

// Function to get a user's role
export const getUserRole = (userId) => {
  return userRoles[userId] || null;
};

// Function to check if a user is an admin
export const isAdmin = (userId) => {
  return userRoles[userId] === 'admin';
};

// Function to check if a user is a moderator
export const isModerator = (userId) => {
  return userRoles[userId] === 'mod';
}; 