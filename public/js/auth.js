// Authentication functions
import { 
  auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification, 
  onAuthStateChanged 
} from './firebase-config.js';

// Global variables
window.currentUser = null;

// Initialize auth state listener
export function initAuth() {
  onAuthStateChanged(auth, (user) => {
    window.currentUser = user;
    updateAuthUI(user);
    
    // If on main page and user is logged in, load saved workouts
    if (user && user.emailVerified && window.location.pathname.includes('index.html')) {
      import('./workout.js').then(module => {
        module.loadSavedWorkouts();
      });
    }
  });
}

// Update authentication UI
function updateAuthUI(user) {
  const authSection = document.getElementById('authSection');
  const userInfo = document.getElementById('userInfo');
  const verificationNotice = document.getElementById('verificationNotice');
  const savedWorkoutsSection = document.getElementById('savedWorkoutsSection');

  if (user) {
    // User is logged in
    if (authSection) authSection.classList.add('hidden');
    if (userInfo) {
      userInfo.classList.remove('hidden');
      const emailDisplay = document.getElementById('userEmailDisplay');
      if (emailDisplay) emailDisplay.textContent = user.email;
    }

    if (!user.emailVerified) {
      if (verificationNotice) verificationNotice.classList.remove('hidden');
      if (savedWorkoutsSection) savedWorkoutsSection.classList.add('hidden');
    } else {
      if (verificationNotice) verificationNotice.classList.add('hidden');
      if (savedWorkoutsSection) savedWorkoutsSection.classList.remove('hidden');
    }
  } else {
    // User is not logged in
    if (authSection) authSection.classList.remove('hidden');
    if (userInfo) userInfo.classList.add('hidden');
    if (verificationNotice) verificationNotice.classList.add('hidden');
    if (savedWorkoutsSection) savedWorkoutsSection.classList.add('hidden');
  }
}

// Login function (renamed to avoid conflict)
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    // Handle specific Firebase errors
    let friendlyMessage;
    
    switch (error.code) {
      case 'auth/user-not-found':
        friendlyMessage = 'No account found with this email.';
        break;
      case 'auth/wrong-password':
        friendlyMessage = 'Incorrect password. Please try again.';
        break;
      case 'auth/too-many-requests':
        friendlyMessage = 'Too many attempts. Please try again later.';
        break;
      case 'auth/invalid-email':
        friendlyMessage = 'Invalid email address.';
        break;
      default:
        friendlyMessage = 'Login failed. Please try again.';
    }
    
    return { success: false, error: friendlyMessage };
  }
}

// Register function (renamed to avoid conflict)
export async function registerUser(email, password, displayName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
    
    return { 
      success: true, 
      message: 'Registration successful! Please check your email and verify your account before logging in.',
      user: userCredential.user 
    };
  } catch (error) {
    let friendlyMessage;
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        friendlyMessage = 'An account with this email already exists.';
        break;
      case 'auth/weak-password':
        friendlyMessage = 'Password should be at least 6 characters long.';
        break;
      case 'auth/invalid-email':
        friendlyMessage = 'Invalid email address.';
        break;
      default:
        friendlyMessage = error.message;
    }
    
    return { success: false, error: friendlyMessage };
  }
}

// Logout function
export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Send email verification
export async function sendVerificationEmail() {
  if (!window.currentUser) {
    return { success: false, error: 'No user logged in' };
  }
  
  try {
    await sendEmailVerification(window.currentUser);
    return { success: true, message: 'Verification email sent! Please check your spam folder if you don\'t see it.' };
  } catch (error) {
    let friendlyMessage;
    
    switch (error.code) {
      case 'auth/too-many-requests':
        friendlyMessage = 'Please wait a few minutes before requesting another verification email.';
        break;
      case 'auth/user-token-expired':
        friendlyMessage = 'Session expired. Please log out and log back in.';
        break;
      default:
        friendlyMessage = error.message;
    }
    
    return { success: false, error: friendlyMessage };
  }
}

// Check if user is authenticated and verified
export function isUserVerified() {
  return window.currentUser && window.currentUser.emailVerified;
}

// Get current user
export function getCurrentUser() {
  return window.currentUser;
}

// Initialize auth when module loads
initAuth();