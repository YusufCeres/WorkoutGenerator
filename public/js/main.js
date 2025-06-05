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
import { logoutUser } from './auth.js';

// Global state
let currentUser = null;
let currentWorkout = '';
let currentSection = 'generator';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
  setupEventListeners();
});

// Initialize Firebase auth state listener
function initializeApp() {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    handleAuthStateChange(user);
  });
}

// Handle authentication state changes
function handleAuthStateChange(user) {
  const loadingScreen = document.getElementById('loadingScreen');
  const accessDenied = document.getElementById('accessDenied');
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.querySelector('.main-content');
  
  // Hide loading screen
  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
  }
  
  if (user && user.emailVerified) {
    // User is authenticated and verified - show the app
    if (accessDenied) accessDenied.classList.add('hidden');
    if (sidebar) sidebar.classList.remove('hidden');
    if (mainContent) mainContent.classList.add('has-sidebar');
    
    // Update user info in sidebar
    const sidebarUserEmail = document.getElementById('sidebarUserEmail');
    if (sidebarUserEmail) {
      sidebarUserEmail.textContent = user.email;
    }
    
    // Show default section and load workouts
    showWorkoutGenerator();
    loadUserWorkouts();
    
  } else {
    // User is not authenticated or not verified - redirect to login
    window.location.href = 'auth/login.html';
  }
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
}

// Navigation functions
window.showWorkoutGenerator = function() {
  hideAllSections();
  const section = document.getElementById('workoutGeneratorSection');
  if (section) {
    section.classList.remove('hidden');
  }
  updateNavigation('generator');
  currentSection = 'generator';
};

window.showSavedWorkouts = function() {
  hideAllSections();
  const section = document.getElementById('savedWorkoutsSection');
  if (section) {
    section.classList.remove('hidden');
  }
  updateNavigation('saved');
  currentSection = 'saved';
  loadUserWorkouts();
};

function hideAllSections() {
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(section => {
    section.classList.add('hidden');
  });
}

function updateNavigation(activeSection) {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.classList.remove('active');
  });
  
  const activeItem = document.querySelector(`.nav-item[onclick*="${activeSection === 'generator' ? 'Generator' : 'SavedWorkouts'}"]`);
  if (activeItem) {
    activeItem.classList.add('active');
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
    
    // Show save section
    if (saveWorkoutSection) {
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
    
    // Refresh saved workouts if we're viewing that section
    if (currentSection === 'saved') {
      loadUserWorkouts();
    }
  } catch (error) {
    showError(error.message);
  }
}

// Handle logout
async function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    try {
      await logoutUser();
      showSuccess('Logged out successfully');
      // Redirect will happen automatically via auth state change
    } catch (error) {
      showError('Failed to logout');
    }
  }
}

// Load and display user's saved workouts
async function loadUserWorkouts() {
  const savedWorkoutsList = document.getElementById('savedWorkoutsList');
  if (!savedWorkoutsList) return;
  
  // Show loading state
  savedWorkoutsList.innerHTML = `
    <div class="loading-workouts">
      <div class="spinner"></div>
      <p>Loading your saved workouts...</p>
    </div>
  `;
  
  try {
    const workouts = await loadSavedWorkouts();
    
    if (workouts.length === 0) {
      savedWorkoutsList.innerHTML = `
        <div class="no-workouts">
          <i class="fas fa-dumbbell"></i>
          <h3>No saved workouts yet</h3>
          <p>Generate and save your first workout to see it here!</p>
          <button onclick="showWorkoutGenerator()" class="generate-workout-btn">
            <i class="fas fa-plus"></i> Generate Workout
          </button>
        </div>
      `;
      return;
    }
    
    savedWorkoutsList.innerHTML = '';
    
    workouts.forEach((workout) => {
      const workoutDate = workout.createdAt.toDate ? 
        workout.createdAt.toDate().toLocaleDateString() : 
        new Date(workout.createdAt).toLocaleDateString();
      
      const preview = workout.content.substring(0, 150) + '...';
      
      const workoutItem = document.createElement('div');
      workoutItem.className = 'workout-item';
      workoutItem.id = `workout-${workout.id}`;
      workoutItem.innerHTML = `
        <div class="workout-header">
          <div class="workout-info">
            <h3 class="workout-title">${escapeHtml(workout.name)}</h3>
            <div class="workout-date">
              <i class="fas fa-calendar-alt"></i>
              Saved on ${workoutDate}
            </div>
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
          <div class="error-title">Error Loading Workouts</div>
          <div>Failed to load your saved workouts. Please try refreshing the page.</div>
        </div>
      </div>
    `;
  }
}

// View a saved workout
window.viewWorkout = async function(workoutId) {
  try {
    const workout = await getWorkout(workoutId);
    
    // Switch to generator section
    showWorkoutGenerator();
    
    // Set the workout content
    setCurrentWorkout(workout.content);
    currentWorkout = workout.content;
    
    // Display the workout
    const outputElement = document.getElementById('output');
    const saveWorkoutSection = document.getElementById('saveWorkoutSection');
    
    outputElement.innerHTML = formatWorkoutOutput(workout.content);
    
    if (saveWorkoutSection) {
      saveWorkoutSection.classList.add('show');
    }
    
    // Scroll to the workout
    outputElement.scrollIntoView({ behavior: 'smooth' });
    
    showSuccess(`Loaded workout: ${workout.name}`);
    
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
    
    // Check if list is empty and reload
    const savedWorkoutsList = document.getElementById('savedWorkoutsList');
    if (savedWorkoutsList && savedWorkoutsList.children.length === 0) {
      loadUserWorkouts();
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