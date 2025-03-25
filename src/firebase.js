import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyD_aiAK0VZ30r3GVNzIcPnqBSwbHjlVqn8",
  authDomain: "onlycans-d9287.firebaseapp.com",
  projectId: "onlycans-d9287",
  storageBucket: "onlycans-d9287.firebasestorage.app",
  messagingSenderId: "78236596885",
  appId: "1:78236596885:web:c71df96ecf5492ef0b399c",
  measurementId: "G-FM0WCKBC6R"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app; 