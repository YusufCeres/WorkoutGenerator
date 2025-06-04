// workout.js - Workout generation and management
import { auth, db, functions } from './firebase-config.js';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, getDoc } from './firebase-config.js';
import { httpsCallable } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-functions.js';

// Available AI models for testing
const AI_MODELS = [
  'meta-llama/Llama-2-7b-chat-hf',
  'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO',
  'mistralai/Mixtral-8x7B-Instruct-v0.1',
  'meta-llama/Llama-2-13b-chat-hf'
];

let currentModelIndex = 0;
let currentWorkout = '';

export async function generateWorkout(prompt) {
  try {
    const generateWorkoutFunction = httpsCallable(functions, 'generateWorkout');
    const result = await generateWorkoutFunction({ prompt });
    
    if (!result.data?.generated_text) {
      throw new Error('Empty response from server');
    }
    
    currentWorkout = result.data.generated_text;
    return currentWorkout;
  } catch (error) {
    console.error('Workout generation error:', error);
    
    // Provide a user-friendly message
    const friendlyMessage = error.code === 'unavailable' 
      ? 'Our workout service is currently unavailable. Please try again later.' 
      : 'Failed to generate workout. Please try again.';
    
    throw new Error(friendlyMessage);
  }
}

// Test different AI models
export function testModels() {
  const modelInfo = document.querySelector('.model-info');
  if (!modelInfo) {
    const info = document.createElement('div');
    info.className = 'model-info';
    info.innerHTML = `Currently using: ${AI_MODELS[currentModelIndex]}`;
    document.querySelector('.container').insertBefore(info, document.querySelector('.input-card'));
  } else {
    currentModelIndex = (currentModelIndex + 1) % AI_MODELS.length;
    modelInfo.innerHTML = `Currently using: ${AI_MODELS[currentModelIndex]}`;
  }
}

// Format workout output for display
export function formatWorkoutOutput(workoutText) {
  if (!workoutText) return '<div class="placeholder-text">Your generated workout plan will appear here</div>';
  
  // Split into sections and format
  const sections = workoutText.split('\n\n');
  let formattedOutput = '';
  
  sections.forEach(section => {
    if (section.trim()) {
      // Check if it's a header (starts with number or contains ":")
      if (/^\d+\./.test(section.trim()) || section.includes(':')) {
        formattedOutput += `<h3>${section.trim()}</h3>\n`;
      } else {
        formattedOutput += `<p>${section.trim()}</p>\n`;
      }
    }
  });
  
  return `<div class="success-output">${formattedOutput}</div>`;
}

// Save workout to Firestore
export async function saveWorkout(workoutName, workoutContent) {
  if (!auth.currentUser) {
    throw new Error('User not authenticated');
  }
  
  if (!auth.currentUser.emailVerified) {
    throw new Error('Please verify your email first');
  }
  
  if (!workoutName.trim()) {
    throw new Error('Please enter a workout name');
  }
  
  if (!workoutContent) {
    throw new Error('No workout to save');
  }
  
  try {
    const docRef = await addDoc(collection(db, 'workouts'), {
      userId: auth.currentUser.uid,
      name: workoutName.trim(),
      content: workoutContent,
      createdAt: new Date(),
      userEmail: auth.currentUser.email
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving workout:', error);
    throw new Error('Failed to save workout');
  }
}

// Load saved workouts for current user
export async function loadSavedWorkouts() {
  if (!auth.currentUser || !auth.currentUser.emailVerified) {
    return [];
  }
  
  try {
    const workoutsQuery = query(
      collection(db, 'workouts'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(workoutsQuery);
    const workouts = [];
    
    querySnapshot.forEach((doc) => {
      workouts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return workouts;
  } catch (error) {
    console.error('Error loading workouts:', error);
    throw new Error('Failed to load saved workouts');
  }
}

// Get a specific workout by ID
export async function getWorkout(workoutId) {
  try {
    const docRef = doc(db, 'workouts', workoutId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error('Workout not found');
    }
  } catch (error) {
    console.error('Error getting workout:', error);
    throw new Error('Failed to load workout');
  }
}

// Delete a workout
export async function deleteWorkout(workoutId) {
  if (!auth.currentUser) {
    throw new Error('User not authenticated');
  }
  
  try {
    await deleteDoc(doc(db, 'workouts', workoutId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting workout:', error);
    throw new Error('Failed to delete workout');
  }
}

// Export current workout for external use
export function getCurrentWorkout() {
  return currentWorkout;
}

// Set current workout (used when viewing saved workouts)
export function setCurrentWorkout(workout) {
  currentWorkout = workout;
}