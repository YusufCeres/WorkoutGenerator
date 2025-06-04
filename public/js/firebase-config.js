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
  apiKey: "AIzaSyBjonXbOCwbc3IF3ij-agGIr95HzFBFVt0",
  authDomain: "ai-workout-generator-40443.firebaseapp.com",
  projectId: "ai-workout-generator-40443",
  storageBucket: "ai-workout-generator-40443.firebasestorage.app",
  messagingSenderId: "546286551368",
  appId: "1:546286551368:web:b2e731d4e33736dbed337d",
  measurementId: "G-SDYM76DQZF"
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