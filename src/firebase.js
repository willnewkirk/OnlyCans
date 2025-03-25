import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Add debugging
console.log('Initializing Firebase...');

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
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

export { auth, db, analytics };
export default app; 