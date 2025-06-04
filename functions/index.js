const functions = require('firebase-functions');
const axios = require('axios');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

exports.generateWorkout = functions.https.onCall(async (data, context) => {
  // Add CORS headers for development
  const cors = require('cors')({
    origin: true,
    credentials: true
  });

  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to generate workouts'
    );
  }

  const prompt = data.prompt;
  
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new functions.https.HttpsError(
      'invalid-argument', 
      'Valid prompt is required'
    );
  }

  try {
    console.log('Generating workout for user:', context.auth.uid);
    console.log('Prompt:', prompt);

    // Get API key from Firebase config
    const apiKey = functions.config().together?.api_key;
    
    if (!apiKey) {
      console.log('API key not found, using fallback workout');
      const fallbackResponse = generateFallbackWorkout(prompt);
      return { 
        generated_text: fallbackResponse,
        note: 'API key not configured - using fallback workout',
        model_used: "fallback"
      };
    }
    
    // Call Together AI API directly
    const response = await axios.post(
      'https://api.together.xyz/v1/chat/completions',
      {
        model: "meta-llama/Llama-3-70b-chat-hf",
        messages: [
          { 
            role: "system", 
            content: "You are an expert fitness trainer and nutritionist. Create detailed, personalized workout plans with specific exercises, sets, reps, rest periods, and helpful tips. Format your response clearly with proper structure including warm-up, main workout, and cool-down sections. Always consider safety and proper form." 
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 0.9,
        stop: null
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    let generatedText = response.data.choices?.[0]?.message?.content;

    // Validate the response
    if (!generatedText || generatedText.trim().length < 50) {
      console.log('AI response too short or empty, using fallback');
      generatedText = generateFallbackWorkout(prompt);
    }

    // Check for repetitive or low-quality responses
    if (generatedText.includes(prompt) || isLowQualityResponse(generatedText)) {
      console.log('Low quality response detected, using fallback');
      generatedText = generateFallbackWorkout(prompt);
    }

    console.log('Workout generated successfully');
    return { 
      generated_text: generatedText,
      model_used: "meta-llama/Llama-3-70b-chat-hf"
    };
    
  } catch (error) {
    console.error('Workout generation error:', error);
    
    // Provide fallback workout
    const fallbackResponse = generateFallbackWorkout(prompt);
    return { 
      generated_text: fallbackResponse,
      note: 'AI service temporarily unavailable - using fallback workout',
      model_used: "fallback"
    };
  }
});

// Alternative HTTP function with explicit CORS handling
exports.generateWorkoutHTTP = functions.https.onRequest(async (req, res) => {
  // Handle CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { prompt, authToken } = req.body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      res.status(400).json({ error: 'Valid prompt is required' });
      return;
    }

    // Verify auth token if provided
    if (authToken) {
      try {
        await admin.auth().verifyIdToken(authToken);
      } catch (error) {
        res.status(401).json({ error: 'Invalid auth token' });
        return;
      }
    }

    const fallbackResponse = generateFallbackWorkout(prompt);
    res.json({ 
      generated_text: fallbackResponse,
      model_used: "fallback"
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to detect low-quality responses
function isLowQualityResponse(text) {
  const lowQualityIndicators = [
    'I cannot',
    'I\'m unable',
    'I don\'t have',
    'Sorry, I can\'t',
    'As an AI',
    'I apologize'
  ];
  
  return lowQualityIndicators.some(indicator => 
    text.toLowerCase().includes(indicator.toLowerCase())
  );
}

// Enhanced fallback workout generator
function generateFallbackWorkout(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  // Beginner workouts
  if (lowerPrompt.includes('beginner') || lowerPrompt.includes('start') || lowerPrompt.includes('new')) {
    return `🏋️ BEGINNER WORKOUT PLAN

**WEEK 1-2: FOUNDATION BUILDING**

**Day 1 - Upper Body Strength**
• Push-ups (knee variation if needed): 2 sets of 5-10 reps
• Wall push-ups: 2 sets of 10-15 reps
• Arm circles: 2 sets of 10 each direction
• Shoulder blade squeezes: 2 sets of 10-15 reps
• Plank hold: 2 sets of 15-30 seconds
• Rest: 60-90 seconds between sets

**Day 2 - Lower Body Foundation**
• Bodyweight squats: 2 sets of 8-12 reps
• Wall sits: 2 sets of 15-30 seconds
• Standing calf raises: 2 sets of 15-20 reps
• Glute bridges: 2 sets of 10-15 reps
• Marching in place: 2 sets of 30 seconds
• Rest: 60-90 seconds between sets

**Day 3 - Active Recovery**
• 10-15 minute gentle walk
• Basic stretching routine
• Deep breathing exercises

**PROGRESSION TIPS:**
- Focus on proper form over speed
- Increase reps by 1-2 each week
- Listen to your body and rest when needed
- Stay hydrated throughout workouts

**SAFETY NOTES:**
- Warm up with 5 minutes of light movement
- Stop if you feel pain (not muscle fatigue)
- Cool down with gentle stretching`;
  }
  
  // Cardio and weight loss
  if (lowerPrompt.includes('cardio') || lowerPrompt.includes('weight loss') || lowerPrompt.includes('fat burn')) {
    return `🔥 CARDIO & WEIGHT LOSS PROGRAM

**WEEK 1-4: PROGRESSIVE CARDIO**

**Day 1: Steady State Cardio**
• Warm-up: 5 minutes light walking
• Main workout: 20-30 minutes brisk walking or cycling
• Target: 60-70% max heart rate
• Cool-down: 5 minutes slow walking + stretching

**Day 2: Interval Training**
• Warm-up: 5 minutes easy pace
• Intervals: 8 rounds of:
  - 30 seconds high intensity (jumping jacks, mountain climbers)
  - 90 seconds recovery (walking in place)
• Cool-down: 5 minutes stretching

**Day 3: Active Recovery**
• 20-30 minutes gentle yoga or stretching
• Light walking
• Focus on mobility and flexibility

**Day 4: Circuit Training**
• 3 rounds of:
  - Jumping jacks: 45 seconds
  - High knees: 30 seconds
  - Butt kicks: 30 seconds
  - Mountain climbers: 30 seconds
  - Rest: 60 seconds between rounds

**Day 5: Long Distance**
• 30-45 minutes at comfortable pace
• Focus on breathing and endurance
• Can split into 2 sessions if needed

**NUTRITION TIPS:**
- Stay hydrated before, during, and after workouts
- Eat a light snack 30-60 minutes before exercise
- Post-workout: protein + carbs within 30 minutes

**PROGRESSION:**
- Week 1-2: Build base fitness
- Week 3-4: Increase intensity and duration by 10-15%`;
  }
  
  // Strength training
  if (lowerPrompt.includes('strength') || lowerPrompt.includes('muscle') || lowerPrompt.includes('build') || lowerPrompt.includes('tone')) {
    return `💪 STRENGTH TRAINING PROGRAM

**4-WEEK PROGRESSIVE STRENGTH PLAN**

**Day 1 - Upper Body Push (Chest, Shoulders, Triceps)**
• Push-ups or incline push-ups: 3 sets of 8-12 reps
• Pike push-ups (shoulders): 3 sets of 6-10 reps
• Tricep dips (chair/bench): 3 sets of 8-12 reps
• Arm circles: 2 sets of 15 each direction
• Plank to downward dog: 2 sets of 8-10 reps
• Rest: 90-120 seconds between sets

**Day 2 - Lower Body Power**
• Bodyweight squats: 3 sets of 12-15 reps
• Single-leg glute bridges: 3 sets of 8-10 each leg
• Lunges (alternating): 3 sets of 10-12 each leg
• Calf raises: 3 sets of 15-20 reps
• Wall sits: 3 sets of 30-45 seconds
• Rest: 90-120 seconds between sets

**Day 3 - Upper Body Pull (Back, Biceps)**
• Superman holds: 3 sets of 10-15 reps
• Reverse flies (arms extended): 3 sets of 12-15 reps
• Door frame rows (towel): 3 sets of 8-12 reps
• Bicep curls (water bottles): 3 sets of 10-12 reps
• Plank: 3 sets of 30-60 seconds
• Rest: 90-120 seconds between sets

**Day 4 - Full Body Circuit**
• Burpees (modified if needed): 3 sets of 5-8 reps
• Mountain climbers: 3 sets of 20 reps (10 each leg)
• Jump squats (or regular squats): 3 sets of 10-12 reps
• Push-up to T: 3 sets of 6-8 reps each side
• Bicycle crunches: 3 sets of 20 reps (10 each side)

**PROGRESSION STRATEGY:**
- Week 1: Learn movements, focus on form
- Week 2: Increase reps by 2-3 per set
- Week 3: Add extra set or increase difficulty
- Week 4: Combine exercises or add isometric holds

**RECOVERY TIPS:**
- 48-72 hours rest between training same muscle groups
- Adequate sleep (7-9 hours) for muscle recovery
- Proper hydration and nutrition`;
  }

  // Home workout
  if (lowerPrompt.includes('home') || lowerPrompt.includes('no gym') || lowerPrompt.includes('bodyweight')) {
    return `🏠 HOME BODYWEIGHT WORKOUT

**NO EQUIPMENT NEEDED - 30 MINUTE SESSIONS**

**Workout A: Total Body Strength**
• Warm-up: 5 minutes (arm circles, leg swings, light jogging in place)

**Main Workout (3 rounds):**
• Push-ups: 10-15 reps
• Squats: 15-20 reps
• Plank: 30-45 seconds
• Lunges: 10 reps each leg
• Mountain climbers: 20 reps (10 each leg)
• Glute bridges: 15-20 reps
• Rest: 60 seconds between exercises, 2 minutes between rounds

**Workout B: Cardio + Core**
• Warm-up: 5 minutes dynamic stretching

**Circuit (4 rounds):**
• Jumping jacks: 45 seconds
• High knees: 30 seconds
• Bicycle crunches: 20 reps (10 each side)
• Burpees: 5-8 reps
• Russian twists: 20 reps
• Rest: 45 seconds between exercises, 90 seconds between rounds

**Cool-down (Both workouts):**
• 5-10 minutes stretching
• Focus on major muscle groups worked
• Deep breathing and relaxation

**WEEKLY SCHEDULE:**
- Monday: Workout A
- Tuesday: 20-30 min walk or rest
- Wednesday: Workout B
- Thursday: Active recovery (yoga/stretching)
- Friday: Workout A
- Saturday: Workout B or outdoor activity
- Sunday: Complete rest

**EQUIPMENT ALTERNATIVES:**
- Water bottles = light weights
- Towel = resistance band
- Chair/couch = bench for dips
- Wall = support for modifications`;
  }
  
  // Default comprehensive plan
  return `🎯 COMPREHENSIVE FITNESS PLAN

**3-DAY BALANCED ROUTINE**

**Day 1: Strength & Endurance**
**Warm-up (5 minutes):**
• Light jogging in place: 2 minutes
• Arm circles and leg swings: 2 minutes
• Dynamic stretching: 1 minute

**Main Workout:**
• Squats: 3 sets of 12-15 reps
• Push-ups (modified if needed): 3 sets of 8-12 reps
• Plank hold: 3 sets of 30-45 seconds
• Lunges: 3 sets of 10 reps each leg
• Glute bridges: 3 sets of 15 reps
• Rest: 60-90 seconds between sets

**Day 2: Cardio & Agility**
**Warm-up (5 minutes):**
• Light walking and dynamic stretches

**Cardio Circuit (20-25 minutes):**
• 4 rounds of:
  - Jumping jacks: 45 seconds
  - Mountain climbers: 30 seconds
  - High knees: 30 seconds
  - Rest: 60 seconds

**Core Finisher:**
• Bicycle crunches: 2 sets of 20 reps
• Dead bugs: 2 sets of 10 each side

**Day 3: Flexibility & Recovery**
**Active Recovery Session (30 minutes):**
• Gentle yoga flow: 15 minutes
• Full body stretching routine: 15 minutes

**Focus Areas:**
• Hip flexors and hamstrings
• Shoulders and chest
• Lower back and glutes
• Calves and ankles

**WEEKLY PROGRESSION:**
- Week 1: Focus on form and consistency
- Week 2: Increase reps by 10-20%
- Week 3: Add extra set or increase hold times
- Week 4: Combine movements or add variations

**GENERAL TIPS:**
• Stay hydrated throughout workouts
• Listen to your body and rest when needed
• Consistency is more important than intensity
• Track your progress weekly
• Aim for 7-9 hours of sleep for recovery

**SAFETY REMINDERS:**
• Stop if you experience pain
• Modify exercises as needed
• Consult healthcare provider if you have concerns
• Progress gradually to avoid injury`;
}