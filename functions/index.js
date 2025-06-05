const functions = require('firebase-functions');
const axios = require('axios');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Callable Function (recommended for authenticated users)
exports.generateWorkout = functions.https.onCall(async (data, context) => {
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

// HTTP Function with proper CORS handling (alternative approach)
exports.generateWorkoutHTTP = functions.https.onRequest(async (req, res) => {
  // Handle CORS properly
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://ai-workout-generator-40443.web.app',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  };

  // Set CORS headers
  Object.keys(corsHeaders).forEach(key => {
    res.set(key, corsHeaders[key]);
  });
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
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
    let userId = null;
    if (authToken) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(authToken);
        userId = decodedToken.uid;
        console.log('Authenticated user:', userId);
      } catch (error) {
        console.log('Auth token verification failed:', error.message);
        res.status(401).json({ error: 'Invalid auth token' });
        return;
      }
    }

    console.log('Generating workout for user:', userId || 'unauthenticated');
    console.log('Prompt:', prompt);

    // Get API key from Firebase config
    const apiKey = functions.config().together?.api_key;
    
    if (!apiKey) {
      console.log('API key not found, using fallback workout');
      const fallbackResponse = generateFallbackWorkout(prompt);
      res.json({ 
        generated_text: fallbackResponse,
        note: 'API key not configured - using fallback workout',
        model_used: "fallback"
      });
      return;
    }
    
    // Call Together AI API
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
        timeout: 30000
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
    res.json({ 
      generated_text: generatedText,
      model_used: "meta-llama/Llama-3-70b-chat-hf"
    });
    
  } catch (error) {
    console.error('Workout generation error:', error);
    
    // Provide fallback workout
    const fallbackResponse = generateFallbackWorkout(prompt);
    res.json({ 
      generated_text: fallbackResponse,
      note: 'AI service temporarily unavailable - using fallback workout',
      model_used: "fallback"
    });
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

  if (lowerPrompt.includes('beginner') || lowerPrompt.includes('start') || lowerPrompt.includes('new')) {
    return `🏋️ BEGINNER WORKOUT PLAN
WEEK 1-2: Build foundation with simple bodyweight moves.
- Upper Body: Push-ups, arm circles, plank (2 sets each)
- Lower Body: Squats, wall sits, calf raises (2 sets each)
- Recovery: Gentle walk & stretching
Tips: Focus on form, increase reps gradually, rest if needed.`;
  }

  if (lowerPrompt.includes('cardio') || lowerPrompt.includes('weight loss') || lowerPrompt.includes('fat burn')) {
    return `🔥 CARDIO & WEIGHT LOSS PROGRAM
WEEK 1-4: Progressive cardio sessions.
- Steady State: 20-30 min brisk walk/cycle
- Intervals: 30s high intensity + 90s rest, 8 rounds
- Circuit: Jumping jacks, high knees, mountain climbers
- Recovery: Yoga/stretching
Nutrition: Hydrate, light snacks pre/post workout.`;
  }

  if (lowerPrompt.includes('strength') || lowerPrompt.includes('muscle') || lowerPrompt.includes('build') || lowerPrompt.includes('tone')) {
    return `💪 STRENGTH TRAINING PROGRAM
4-WEEK plan targeting all major muscle groups.
- Upper Body Push & Pull: Push-ups, dips, rows
- Lower Body: Squats, lunges, glute bridges
- Full Body Circuit: Burpees, mountain climbers, jump squats
Progress by increasing reps/sets and focusing on form.
Rest 48-72 hours between muscle groups.`;
  }

  if (lowerPrompt.includes('home') || lowerPrompt.includes('no gym') || lowerPrompt.includes('bodyweight')) {
    return `🏠 HOME BODYWEIGHT WORKOUT
30-minute no equipment sessions.
- Workout A: Push-ups, squats, plank, lunges (3 rounds)
- Workout B: Jumping jacks, high knees, burpees, core work (4 rounds)
Schedule: Alternate workout days with walking or rest.
Use household items for light resistance if available.`;
  }

  // Default comprehensive plan
  return `🎯 COMPREHENSIVE FITNESS PLAN
3-day balanced routine:
- Day 1: Strength & endurance (squats, push-ups, plank)
- Day 2: Cardio & agility (jumping jacks, mountain climbers)
- Day 3: Flexibility & recovery (yoga, stretching)
Progress by increasing reps or sets weekly.
Stay hydrated, rest well, and avoid pain during exercise.`;
}
