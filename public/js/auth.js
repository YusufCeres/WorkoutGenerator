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
    
    // No UI updates here - main.js handles all UI logic
    // Just fire custom event for other modules if needed
    window.dispatchEvent(new CustomEvent('authStateChanged', { detail: user }));
  });
}

// Login function
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Check if email is verified
    if (!user.emailVerified) {
      // Sign out the user if email is not verified
      await signOut(auth);
      return { 
        success: false, 
        error: 'Please verify your email address before signing in. Check your inbox for the verification link.' 
      };
    }
    
    return { success: true, user: user };
  } catch (error) {
    // Handle specific Firebase errors
    let friendlyMessage;
    
    switch (error.code) {
      case 'auth/user-not-found':
        friendlyMessage = 'No account found with this email address.';
        break;
      case 'auth/wrong-password':
        friendlyMessage = 'Incorrect password. Please try again.';
        break;
      case 'auth/too-many-requests':
        friendlyMessage = 'Too many failed attempts. Please try again later.';
        break;
      case 'auth/invalid-email':
        friendlyMessage = 'Invalid email address format.';
        break;
      case 'auth/user-disabled':
        friendlyMessage = 'This account has been disabled.';
        break;
      case 'auth/invalid-credential':
        friendlyMessage = 'Invalid email or password. Please check your credentials.';
        break;
      default:
        friendlyMessage = 'Login failed. Please try again.';
    }
    
    return { success: false, error: friendlyMessage };
  }
}

// Register function
export async function registerUser(email, password, displayName = '') {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Send verification email immediately after registration
    await sendEmailVerification(userCredential.user);
    
    // Sign out the user after registration - they need to verify email first
    await signOut(auth);
    
    return { 
      success: true, 
      message: 'Registration successful! Please check your email and click the verification link before signing in.',
      user: userCredential.user 
    };
  } catch (error) {
    let friendlyMessage;
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        // For resend verification purposes, we'll treat this as a special case
        // Try to send verification email to existing user
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          if (!userCredential.user.emailVerified) {
            await sendEmailVerification(userCredential.user);
            await signOut(auth);
            return { 
              success: true, 
              message: 'Verification email sent! Please check your inbox.',
              isResend: true 
            };
          } else {
            await signOut(auth);
            friendlyMessage = 'This account is already verified. Please sign in instead.';
          }
        } catch (resendError) {
          friendlyMessage = 'An account with this email address already exists.';
        }
        break;
      case 'auth/weak-password':
        friendlyMessage = 'Password must be at least 6 characters long.';
        break;
      case 'auth/invalid-email':
        friendlyMessage = 'Invalid email address format.';
        break;
      case 'auth/operation-not-allowed':
        friendlyMessage = 'Email/password accounts are not enabled.';
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

// Send email verification (enhanced version for resend functionality)
export async function sendVerificationEmail(user = null) {
  const targetUser = user || window.currentUser;
  
  if (!targetUser) {
    return { success: false, error: 'No user provided for verification' };
  }
  
  try {
    await sendEmailVerification(targetUser);
    return { success: true, message: 'Verification email sent! Please check your inbox and spam folder.' };
  } catch (error) {
    let friendlyMessage;
    
    switch (error.code) {
      case 'auth/too-many-requests':
        friendlyMessage = 'Please wait a few minutes before requesting another verification email.';
        break;
      case 'auth/user-token-expired':
        friendlyMessage = 'Session expired. Please try registering again.';
        break;
      case 'auth/invalid-email':
        friendlyMessage = 'Invalid email address.';
        break;
      case 'auth/user-not-found':
        friendlyMessage = 'User not found. Please try registering again.';
        break;
      case 'auth/user-disabled':
        friendlyMessage = 'This account has been disabled.';
        break;
      case 'auth/invalid-user-token':
        friendlyMessage = 'Invalid user session. Please try registering again.';
        break;
      case 'auth/network-request-failed':
        friendlyMessage = 'Network error. Please check your connection and try again.';
        break;
      default:
        friendlyMessage = error.message || 'Failed to send verification email. Please try again.';
    }
    
    return { success: false, error: friendlyMessage };
  }
}

// Enhanced resend verification with exponential backoff handling
export async function resendVerificationEmail(email, password) {
  try {
    // First, try to sign in the user to get a fresh token
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Check if user is already verified
    if (user.emailVerified) {
      await signOut(auth);
      return { 
        success: false, 
        error: 'This email is already verified. You can sign in now.' 
      };
    }
    
    // Send verification email
    await sendEmailVerification(user);
    
    // Sign out immediately after sending
    await signOut(auth);
    
    return { 
      success: true, 
      message: 'Verification email sent! Please check your inbox and spam folder.' 
    };
    
  } catch (error) {
    console.error('Resend verification error:', error);
    
    let friendlyMessage;
    
    switch (error.code) {
      case 'auth/user-not-found':
        friendlyMessage = 'Account not found. Please check your email address.';
        break;
      case 'auth/wrong-password':
        friendlyMessage = 'Incorrect password. Please try again.';
        break;
      case 'auth/too-many-requests':
        friendlyMessage = 'Too many attempts. Please wait before trying again.';
        break;
      case 'auth/invalid-email':
        friendlyMessage = 'Invalid email address format.';
        break;
      case 'auth/user-disabled':
        friendlyMessage = 'This account has been disabled.';
        break;
      case 'auth/network-request-failed':
        friendlyMessage = 'Network error. Please check your connection.';
        break;
      default:
        friendlyMessage = 'Failed to resend verification email. Please try again.';
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

// Check authentication status (useful for route protection)
export function isAuthenticated() {
  return !!window.currentUser;
}

// Wait for auth state to be determined
export function waitForAuth() {
  return new Promise((resolve) => {
    if (window.currentUser !== null) {
      resolve(window.currentUser);
    } else {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    }
  });
}

// Initialize auth when module loads
initAuth();