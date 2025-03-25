import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Add debugging
console.log('Initializing Firebase...');

const firebaseConfig = {
  apiKey: "AIzaSyD_aiAK0VZ30r3GVNzIcPnqBSwbHjlVqn8",
  authDomain: "onlycans-d9287.firebaseapp.com",
  projectId: "onlycans-d9287",
  storageBucket: "onlycans-d9287.firebasestorage.app",
  messagingSenderId: "78236596885",
  appId: "1:78236596885:web:c71df96ecf5492ef0b399c"
};

// Log config (without sensitive values)
console.log('Firebase config:', {
  ...firebaseConfig,
  apiKey: '***',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId
});

let app;
let auth;
let db;
let storage;
let analytics = null;

try {
  // Initialize Firebase app
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');

  // Initialize Auth
  auth = getAuth(app);
  console.log('Firebase Auth initialized');

  // Initialize Firestore
  db = getFirestore(app);
  console.log('Firestore initialized');

  // Initialize Storage
  storage = getStorage(app);
  console.log('Firebase Storage initialized');

  // Initialize Analytics only if supported
  isSupported().then(yes => {
    if (yes) {
      analytics = getAnalytics(app);
      console.log('Analytics initialized');
    } else {
      console.log('Analytics not supported in this environment');
    }
  }).catch(err => {
    console.warn('Analytics initialization failed:', err);
  });

} catch (error) {
  console.error('Firebase initialization error:', error);
  throw new Error('Failed to initialize Firebase: ' + error.message);
}

export { auth, db, storage, analytics };
export default app; 