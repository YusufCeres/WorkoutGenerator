// Firebase configuration and initialization
import { getFunctions, connectFunctionsEmulator } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-functions.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification, 
  onAuthStateChanged,
  connectAuthEmulator 
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  getDoc,
  connectFirestoreEmulator 
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// Firebase configuration - Replace with your actual config
const firebaseConfig = {
   apiKey: functions.config().app.api_key,
  authDomain: functions.config().app.auth_domain,
  projectId: functions.config().app.project_id,
  storageBucket: functions.config().app.storage_bucket,
  messagingSenderId: functions.config().app.messaging_sender_id,
  appId: functions.config().app.app_id,
  measurementId: functions.config().app.measurement_id,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// Connect to emulators if running locally
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname === '0.0.0.0';

if (isLocalhost) {
  console.log('Connecting to Firebase emulators...');
  
  // Connect to Auth Emulator
  try {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    console.log('Connected to Auth emulator');
  } catch (error) {
    if (!error.message.includes('already been called')) {
      console.error('Failed to connect to Auth emulator:', error);
    }
  }
  
  // Connect to Firestore Emulator  
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('Connected to Firestore emulator');
  } catch (error) {
    if (!error.message.includes('already been called')) {
      console.error('Failed to connect to Firestore emulator:', error);
    }
  }
  
  // Connect to Functions Emulator
  try {
    connectFunctionsEmulator(functions, "localhost", 5001);
    console.log('Connected to Functions emulator');
  } catch (error) {
    if (!error.message.includes('already been called')) {
      console.error('Failed to connect to Functions emulator:', error);
    }
  }
} else {
  console.log('Running in production mode');
}

// Export Firebase services
export { 
  app,
  auth, 
  db,
  functions, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification, 
  onAuthStateChanged,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDoc
};