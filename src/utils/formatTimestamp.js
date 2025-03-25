export const formatTimestamp = (timestamp) => {
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