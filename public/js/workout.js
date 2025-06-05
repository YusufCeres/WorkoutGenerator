// workout.js - Workout generation and management
import { auth, db, functions } from './firebase-config.js';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, getDoc } from './firebase-config.js';

// Available AI models for testing
const AI_MODELS = [
  'meta-llama/Llama-2-7b-chat-hf',
  'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO',
  'mistralai/Mixtral-8x7B-Instruct-v0.1',
  'meta-llama/Llama-2-13b-chat-hf'
];

let currentModelIndex = 0;
let currentWorkout = '';

// Primary method: Using HTTP Function (Better CORS handling)
export async function generateWorkout(prompt) {
  try {
    console.log('Starting workout generation with HTTP method...');
    console.log('Auth state:', auth.currentUser ? 'authenticated' : 'not authenticated');
    console.log('Prompt:', prompt);

    // Get auth token if user is authenticated
    let authToken = null;
    if (auth.currentUser) {
      authToken = await auth.currentUser.getIdToken();
      console.log('Auth token obtained');
    }

    const response = await fetch('https://us-central1-ai-workout-generator-40443.cloudfunctions.net/generateWorkoutHTTP', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        authToken: authToken
      })
    });

    console.log('HTTP Response status:', response.status);
    console.log('HTTP Response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('HTTP Error response:', errorData);
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('HTTP Response data:', result);
    
    if (!result.generated_text) {
      throw new Error('Invalid response from server - no generated text');
    }
    
    currentWorkout = result.generated_text;
    console.log('Workout generated successfully via HTTP');
    return currentWorkout;
    
  } catch (error) {
    console.error('HTTP workout generation error:', error);
    
    // Handle specific error types
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    
    if (error.message.includes('CORS')) {
      throw new Error('Connection blocked. Please try refreshing the page.');
    }
    
    if (error.message.includes('401')) {
      throw new Error('Authentication failed. Please log in again.');
    }
    
    if (error.message.includes('500')) {
      throw new Error('Server error. Please try again in a moment.');
    }
    
    // Try fallback method as last resort
    console.log('Trying local fallback...');
    return generateLocalFallback(prompt);
  }
}

// Fallback method: Generate basic workout locally
function generateLocalFallback(prompt) {
  console.log('Using local fallback workout generation');
  
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('beginner') || lowerPrompt.includes('start') || lowerPrompt.includes('new')) {
    return `🏋️ BEGINNER WORKOUT PLAN

**WARM-UP (5 minutes)**
- Arm circles: 30 seconds each direction
- Leg swings: 30 seconds each leg
- Light jogging in place: 2 minutes
- Gentle stretching: 2 minutes

**MAIN WORKOUT (20 minutes)**
1. **Bodyweight Squats**
   - 2 sets of 8-12 reps
   - Rest: 60 seconds between sets
   - Focus on proper form

2. **Modified Push-ups** (knees or wall)
   - 2 sets of 5-10 reps
   - Rest: 60 seconds between sets

3. **Plank Hold**
   - 2 sets of 15-30 seconds
   - Rest: 45 seconds between sets

4. **Walking Lunges**
   - 2 sets of 6-8 per leg
   - Rest: 60 seconds between sets

**COOL-DOWN (5 minutes)**
- Full body stretching
- Deep breathing exercises

**Tips:** Start slow, focus on form over speed, increase reps gradually as you get stronger.`;
  }

  if (lowerPrompt.includes('cardio') || lowerPrompt.includes('weight loss') || lowerPrompt.includes('fat burn')) {
    return `🔥 CARDIO & WEIGHT LOSS WORKOUT

**WARM-UP (5 minutes)**
- March in place: 2 minutes
- Arm swings: 1 minute
- Dynamic stretching: 2 minutes

**HIIT CIRCUIT (20 minutes)**
*Perform each exercise for 30 seconds, rest 15 seconds*

**Round 1 (repeat 2x):**
1. Jumping jacks
2. High knees
3. Burpees (modified if needed)
4. Mountain climbers
*Rest 1 minute between rounds*

**Round 2 (repeat 2x):**
1. Jump squats
2. Push-ups
3. Plank jacks
4. Running in place
*Rest 1 minute between rounds*

**COOL-DOWN (5 minutes)**
- Walking pace recovery
- Full body stretching

**Fat Burn Tips:** Stay hydrated, maintain intensity during work periods, focus on consistency over perfection.`;
  }

  if (lowerPrompt.includes('strength') || lowerPrompt.includes('muscle') || lowerPrompt.includes('build') || lowerPrompt.includes('tone')) {
    return `💪 STRENGTH TRAINING WORKOUT

**WARM-UP (5 minutes)**
- Light cardio: 3 minutes
- Dynamic stretching: 2 minutes

**UPPER BODY (12 minutes)**
1. **Push-ups**
   - 3 sets of 8-15 reps
   - Rest: 90 seconds

2. **Pike Push-ups** (shoulder focus)
   - 3 sets of 5-10 reps
   - Rest: 90 seconds

3. **Tricep Dips** (using chair)
   - 3 sets of 8-12 reps
   - Rest: 90 seconds

**LOWER BODY (12 minutes)**
1. **Squats**
   - 3 sets of 12-20 reps
   - Rest: 90 seconds

2. **Single-leg Glute Bridges**
   - 3 sets of 8-12 per leg
   - Rest: 90 seconds

3. **Calf Raises**
   - 3 sets of 15-25 reps
   - Rest: 60 seconds

**CORE (6 minutes)**
- Plank: 3 sets of 30-60 seconds
- Side planks: 2 sets of 20-30 seconds each side

**COOL-DOWN (5 minutes)**
- Stretching all major muscle groups

**Progression:** Add reps or increase hold times weekly.`;
  }

  if (lowerPrompt.includes('home') || lowerPrompt.includes('no gym') || lowerPrompt.includes('bodyweight')) {
    return `🏠 HOME BODYWEIGHT WORKOUT

**EQUIPMENT NEEDED:** None (optional: water bottles for light weights)

**WARM-UP (5 minutes)**
- Arm circles and leg swings
- Light movement to increase heart rate

**FULL BODY CIRCUIT (25 minutes)**
*Complete 3 rounds of the following circuit:*

1. **Squats** - 45 seconds
2. **Push-ups** - 45 seconds  
3. **Lunges** (alternating) - 45 seconds
4. **Plank** - 30 seconds
5. **Jumping jacks** - 45 seconds
6. **Glute bridges** - 45 seconds
7. **Mountain climbers** - 30 seconds

*Rest 90 seconds between rounds*

**BONUS FINISHER (3 minutes)**
- Burpees: 30 seconds work, 30 seconds rest (repeat 3x)

**COOL-DOWN (5 minutes)**
- Complete stretching routine

**Home Workout Tips:** Use household items for added resistance, maintain good form, adjust intensity to your fitness level.`;
  }

  // Default comprehensive plan
  return `🎯 BALANCED FITNESS WORKOUT

**WARM-UP (5 minutes)**
- Light movement and dynamic stretching

**MAIN WORKOUT (25 minutes)**

**Strength Circuit (15 minutes):**
- Squats: 3 sets of 12-15
- Push-ups: 3 sets of 8-12
- Lunges: 3 sets of 10 per leg
- Plank: 3 sets of 30-45 seconds

**Cardio Burst (10 minutes):**
- High knees: 30 seconds
- Rest: 30 seconds
- Jumping jacks: 30 seconds
- Rest: 30 seconds
*Repeat 5 rounds*

**COOL-DOWN (5 minutes)**
- Static stretching
- Deep breathing

**Weekly Schedule:**
- Day 1: This workout
- Day 2: Walking or light activity
- Day 3: This workout
- Day 4: Rest or yoga
- Day 5: This workout
- Day 6-7: Active recovery

**Progress Tips:** Increase reps, sets, or intensity weekly. Listen to your body and rest when needed.`;
}

// Legacy callable function method (keeping as backup)
export async function generateWorkoutCallable(prompt) {
  try {
    console.log('Trying callable function method...');
    
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    const { httpsCallable } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-functions.js');
    const generateWorkoutFunction = httpsCallable(functions, 'generateWorkout');
    
    const result = await Promise.race([
      generateWorkoutFunction({ prompt }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      )
    ]);
    
    if (!result.data?.generated_text) {
      throw new Error('Invalid response from callable function');
    }
    
    currentWorkout = result.data.generated_text;
    return currentWorkout;
    
  } catch (error) {
    console.error('Callable function error:', error);
    throw error;
  }
}

// Test different AI models
export function testModels() {
  const modelInfo = document.querySelector('.model-info');
  if (!modelInfo) {
    const info = document.createElement('div');
    info.className = 'model-info';
    info.innerHTML = `Currently using: HTTP Method (${AI_MODELS[currentModelIndex]})`;
    document.querySelector('.container').insertBefore(info, document.querySelector('.input-card'));
  } else {
    currentModelIndex = (currentModelIndex + 1) % AI_MODELS.length;
    modelInfo.innerHTML = `Currently using: HTTP Method (${AI_MODELS[currentModelIndex]})`;
  }
}

// Format workout output for display
export function formatWorkoutOutput(workoutText) {
  if (!workoutText) return '<div class="placeholder-text">Your generated workout plan will appear here</div>';
  
  // Convert markdown-like formatting to HTML
  let formattedOutput = workoutText
    // Convert **bold** to <strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Convert headers
    .replace(/^#{1,3}\s*(.*$)/gm, '<h3>$1</h3>')
    // Convert bullet points
    .replace(/^[-*]\s*(.*$)/gm, '<li>$1</li>')
    // Convert numbered lists
    .replace(/^\d+\.\s*(.*$)/gm, '<li>$1</li>')
    // Convert line breaks to paragraphs
    .split('\n\n')
    .map(section => {
      if (section.trim()) {
        if (section.includes('<h3>') || section.includes('<li>')) {
          return section;
        }
        return `<p>${section.trim()}</p>`;
      }
      return '';
    })
    .join('\n');

  // Wrap consecutive <li> elements in <ul>
  formattedOutput = formattedOutput.replace(/(<li>.*?<\/li>\s*)+/gs, '<ul>$&</ul>');
  
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