import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const usersToAdd = [
  {
    uid: 'GQfm1ZkXu1fnd3seg1N2UJll6Jf1',
    displayName: 'Amleth',
    email: 'amleth@example.com',
    createdAt: new Date(),
    photoURL: null
  },
  {
    uid: 'boF0HdPgEjRv1p9WUAH6qkpzYiA2',
    displayName: 'Pigment',
    email: 'pigment@example.com',
    createdAt: new Date(),
    photoURL: null
  },
  {
    uid: 'UdaNSaa42SMOi6h7hfTm2HybwF02',
    displayName: 'Bird',
    email: 'bird@example.com',
    createdAt: new Date(),
    photoURL: null
  }
];

export const addUsers = async () => {
  try {
    for (const user of usersToAdd) {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, user);
      console.log(`Added user: ${user.displayName}`);
    }
    console.log('All users added successfully');
  } catch (error) {
    console.error('Error adding users:', error);
  }
}; 