// main.js - Main application logic and UI interactions
import { auth, onAuthStateChanged } from './firebase-config.js';
import { 
  generateWorkout, 
  formatWorkoutOutput, 
  saveWorkout, 
  loadSavedWorkouts, 
  getWorkout, 
  deleteWorkout, 
  getCurrentWorkout,
  setCurrentWorkout,
  testModels 
} from './workout.js';
import { logoutUser, sendVerificationEmail } from './auth.js';

// Global state
let currentUser = null;
let currentWorkout = '';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
  setupEventListeners();
});

// Initialize Firebase auth state listener
function initializeApp() {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    updateAuthUI(user);
    if (user && user.emailVerified) {
      loadUserWorkouts();
    }
  });
}

// Setup all event listeners
function setupEventListeners() {
  // Generate workout button
  const generateBtn = document.getElementById('generateBtn');
  if (generateBtn) {
    generateBtn.addEventListener('click', handleGenerateWorkout);
  }
  
  // Save workout button
  const saveBtn = document.getElementById('saveWorkoutBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', handleSaveWorkout);
  }
  
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Example chips
  const exampleChips = document.querySelectorAll('.example-chip');
  exampleChips.forEach(chip => {
    chip.addEventListener('click', () => useExample(chip));
  });
  
  // Resend verification email
  const resendBtn = document.getElementById('resendVerificationBtn');
  if (resendBtn) {
    resendBtn.addEventListener('click', handleResendVerification);
  }
}

// Update UI based on authentication state
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
      const userEmailDisplay = document.getElementById('userEmailDisplay');
      if (userEmailDisplay) userEmailDisplay.textContent = user.email;
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

// Handle workout generation
async function handleGenerateWorkout() {
  const promptTextarea = document.getElementById('prompt');
  const generateBtn = document.getElementById('generateBtn');
  const outputElement = document.getElementById('output');
  const saveWorkoutSection = document.getElementById('saveWorkoutSection');
  
  const prompt = promptTextarea.value.trim();
  
  if (!prompt) {
    showError('Please enter your workout requirements');
    return;
  }
  
  // Show loading state
  generateBtn.disabled = true;
  generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
  outputElement.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <div class="loading-text">Generating your personalized workout...</div>
      <div class="loading-subtext">Our AI is analyzing your requirements and creating the perfect plan for you.</div>
    </div>
  `;
  
  try {
    const workoutText = await generateWorkout(prompt);
    currentWorkout = workoutText;
    
    // Display the formatted workout
    outputElement.innerHTML = formatWorkoutOutput(workoutText);
    
    // Show save section if user is logged in and verified
    if (currentUser && currentUser.emailVerified && saveWorkoutSection) {
      saveWorkoutSection.classList.add('show');
    }
    
  } catch (error) {
    console.error('Error generating workout:', error);
    outputElement.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-circle"></i>
        <div class="error-content">
          <div class="error-title">Generation Failed</div>
          <div>Sorry, we couldn't generate your workout. Please try again or contact support if the problem persists.</div>
        </div>
      </div>
    `;
  } finally {
    // Reset button state
    generateBtn.disabled = false;
    generateBtn.innerHTML = '<i class="fas fa-bolt"></i> Generate Workout Plan';
  }
}

// Handle saving workout
async function handleSaveWorkout() {
  const workoutNameInput = document.getElementById('workoutName');
  const workoutName = workoutNameInput.value.trim();
  
  if (!workoutName) {
    showError('Please enter a workout name');
    return;
  }
  
  if (!currentWorkout) {
    showError('No workout to save');
    return;
  }
  
  try {
    await saveWorkout(workoutName, currentWorkout);
    showSuccess('Workout saved successfully!');
    workoutNameInput.value = '';
    loadUserWorkouts();
  } catch (error) {
    showError(error.message);
  }
}

// Handle logout
async function handleLogout() {
  try {
    await logoutUser();
    showSuccess('Logged out successfully');
  } catch (error) {
    showError('Failed to logout');
  }
}

// Handle resend verification email
async function handleResendVerification() {
  try {
    await sendVerificationEmail();
    showSuccess('Verification email sent!');
  } catch (error) {
    showError('Failed to send verification email');
  }
}

// Load and display user's saved workouts
async function loadUserWorkouts() {
  const savedWorkoutsList = document.getElementById('savedWorkoutsList');
  if (!savedWorkoutsList) return;
  
  try {
    const workouts = await loadSavedWorkouts();
    
    if (workouts.length === 0) {
      savedWorkoutsList.innerHTML = '<p class="no-workouts">No saved workouts yet. Generate and save your first workout!</p>';
      return;
    }
    
    savedWorkoutsList.innerHTML = '';
    
    workouts.forEach((workout) => {
      const workoutDate = workout.createdAt.toDate ? 
        workout.createdAt.toDate().toLocaleDateString() : 
        new Date(workout.createdAt).toLocaleDateString();
      
      const preview = workout.content.substring(0, 100) + '...';
      
      const workoutItem = document.createElement('div');
      workoutItem.className = 'workout-item';
      workoutItem.id = `workout-${workout.id}`;
      workoutItem.innerHTML = `
        <div class="workout-header">
          <div>
            <div class="workout-title">${escapeHtml(workout.name)}</div>
            <div class="workout-date">Saved on ${workoutDate}</div>
          </div>
          <div class="workout-actions">
            <button class="view-btn" onclick="viewWorkout('${workout.id}')">
              <i class="fas fa-eye"></i> View
            </button>
            <button class="delete-btn" onclick="confirmDeleteWorkout('${workout.id}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
        <div class="workout-preview">${escapeHtml(preview)}</div>
      `;
      
      savedWorkoutsList.appendChild(workoutItem);
    });
    
  } catch (error) {
    console.error('Error loading workouts:', error);
    savedWorkoutsList.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-circle"></i>
        <div class="error-content">
          <div class="error-title">Error</div>
          Failed to load saved workouts
        </div>
      </div>
    `;
  }
}

// View a saved workout
window.viewWorkout = async function(workoutId) {
  try {
    const workout = await getWorkout(workoutId);
    const outputElement = document.getElementById('output');
    const saveWorkoutSection = document.getElementById('saveWorkoutSection');
    
    setCurrentWorkout(workout.content);
    currentWorkout = workout.content;
    
    outputElement.innerHTML = formatWorkoutOutput(workout.content);
    
    if (saveWorkoutSection) {
      saveWorkoutSection.classList.add('show');
    }
    
    // Scroll to the workout
    outputElement.scrollIntoView({ behavior: 'smooth' });
    
  } catch (error) {
    showError('Failed to load workout');
  }
};

// Confirm and delete workout
window.confirmDeleteWorkout = function(workoutId) {
  if (confirm('Are you sure you want to delete this workout? This action cannot be undone.')) {
    deleteWorkoutItem(workoutId);
  }
};

// Delete workout
async function deleteWorkoutItem(workoutId) {
  try {
    await deleteWorkout(workoutId);
    
    // Remove from UI
    const workoutElement = document.getElementById(`workout-${workoutId}`);
    if (workoutElement) {
      workoutElement.remove();
    }
    
    // Check if list is empty
    const savedWorkoutsList = document.getElementById('savedWorkoutsList');
    if (savedWorkoutsList && savedWorkoutsList.children.length === 0) {
      savedWorkoutsList.innerHTML = '<p class="no-workouts">No saved workouts yet. Generate and save your first workout!</p>';
    }
    
    showSuccess('Workout deleted successfully');
    
  } catch (error) {
    showError('Failed to delete workout');
  }
}

// Use example prompt
window.useExample = function(element) {
  const promptTextarea = document.getElementById('prompt');
  if (promptTextarea) {
    promptTextarea.value = element.textContent;
    promptTextarea.focus();
  }
};

// Make generateWorkout globally accessible
window.generateWorkout = handleGenerateWorkout;

// Utility functions
function showError(message) {
  // Create or update error notification
  let errorNotification = document.querySelector('.error-notification');
  if (!errorNotification) {
    errorNotification = document.createElement('div');
    errorNotification.className = 'error-notification';
    document.body.appendChild(errorNotification);
  }
  
  errorNotification.innerHTML = `
    <i class="fas fa-exclamation-circle"></i>
    ${message}
  `;
  errorNotification.classList.add('show');
  
  setTimeout(() => {
    errorNotification.classList.remove('show');
  }, 5000);
}

function showSuccess(message) {
  // Create or update success notification
  let successNotification = document.querySelector('.success-notification');
  if (!successNotification) {
    successNotification = document.createElement('div');
    successNotification.className = 'success-notification';
    document.body.appendChild(successNotification);
  }
  
  successNotification.innerHTML = `
    <i class="fas fa-check-circle"></i>
    ${message}
  `;
  successNotification.classList.add('show');
  
  setTimeout(() => {
    successNotification.classList.remove('show');
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}