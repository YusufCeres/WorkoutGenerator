require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const cors = require('cors');
const path = require('path');
const { Together } = require('together-ai');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize Together AI using environment variable
const together = new Together({ apiKey: process.env.TOGETHER_API_KEY });


async function queryModel(prompt) {
    try {
        console.log('Generating with Together AI (Llama 3)');
        
        const response = await together.chat.completions.create({
            model: "meta-llama/Llama-3-70b-chat-hf",
            messages: [
                { 
                    role: "system", 
                    content: "You are an expert fitness trainer. Create detailed workout plans with exercises, sets, reps, and rest periods. Format clearly with days/weeks." 
                },
                { 
                    role: "user", 
                    content: prompt 
                }
            ],
            max_tokens: 1500,
            temperature: 0.7,
        });

        return { 
            data: [{ generated_text: response.choices[0].message.content }],
            modelUsed: "meta-llama/Llama-3-70b-chat-hf"
        };
    } catch (error) {
        console.error('Together AI Error:', error.message);
        throw error;
    }
}

async function generateWorkoutPlan(prompt) {
    const enhancedPrompt = `Create a detailed workout plan based on: "${prompt}". 
    Include exercises, sets, reps, and rest periods. Format it clearly with days/weeks if needed.
    Make it practical and safe for the fitness level mentioned.`;
    
    try {
        const result = await queryModel(enhancedPrompt);
        return result;
    } catch (error) {
        console.error('All models failed, using fallback');
        throw new Error(`Generation failed: ${error.message}`);
    }
}

app.post('/generate', async (req, res) => {
    try {
        const prompt = req.body.prompt;
        if (!prompt) {
            return res.status(400).json({ error: "Please enter a workout prompt" });
        }

        console.log('Generating workout for:', prompt);
        const result = await generateWorkoutPlan(prompt);
        
        let generatedText = result.data[0].generated_text;

        // If the generated text is empty or just repeats the prompt, create a fallback response
        if (!generatedText || generatedText.trim().length < 50 || generatedText.includes(prompt)) {
            generatedText = generateFallbackWorkout(prompt);
        }

        res.json({ 
            generated_text: generatedText,
            model_used: result.modelUsed,
            prompt: prompt
        });
        
    } catch (error) {
        console.error('Server Error:', error);
        
        // Provide a fallback workout if AI fails completely
        const fallbackResponse = generateFallbackWorkout(req.body.prompt || 'general fitness');
        
        res.json({
            generated_text: fallbackResponse,
            model_used: 'fallback',
            prompt: req.body.prompt,
            note: 'AI service temporarily unavailable - using fallback workout'
        });
    }
});

function generateFallbackWorkout(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('beginner') || lowerPrompt.includes('start')) {
    return `BEGINNER WORKOUT PLAN

Week 1-2: Foundation Building
Day 1 - Upper Body:
• Push-ups: 2 sets of 8-12 reps
• Dumbbell rows: 2 sets of 10-12 reps
• Shoulder press: 2 sets of 8-10 reps
• Plank: 2 sets of 20-30 seconds

Day 2 - Lower Body:
• Bodyweight squats: 2 sets of 10-15 reps
• Lunges: 2 sets of 8-10 per leg
• Glute bridges: 2 sets of 12-15 reps
• Calf raises: 2 sets of 15-20 reps

Day 3 - Rest or light walking

Day 4 - Full Body:
• Modified burpees: 2 sets of 5-8 reps
• Wall sits: 2 sets of 15-30 seconds
• Dead bugs: 2 sets of 8-10 per side
• Arm circles: 2 sets of 10 each direction

Rest 2-3 days between sessions. Focus on proper form over speed.`;
  }
  
  if (lowerPrompt.includes('cardio') || lowerPrompt.includes('weight loss')) {
    return `CARDIO WORKOUT PLAN

Week 1-4: Progressive Cardio Program

Day 1: Low-Intensity Steady State
• 20-30 minutes brisk walking or cycling
• Keep heart rate at 60-70% max

Day 2: Interval Training
• 5-minute warm-up
• 8 rounds: 30 seconds high intensity, 90 seconds recovery
• 5-minute cool-down

Day 3: Active Recovery
• 15-20 minutes gentle yoga or stretching
• Light walking

Day 4: Circuit Training
• 3 rounds of:
  - Jumping jacks: 30 seconds
  - Mountain climbers: 30 seconds
  - High knees: 30 seconds
  - Rest: 60 seconds

Day 5: Long, Slow Distance
• 30-45 minutes at comfortable pace
• Focus on breathing and endurance

Gradually increase duration and intensity each week.`;
  }
  
  if (lowerPrompt.includes('strength') || lowerPrompt.includes('muscle')) {
    return `STRENGTH TRAINING PLAN

4-Week Progressive Program

Day 1 - Push (Chest, Shoulders, Triceps):
• Bench press or push-ups: 3 sets of 8-12 reps
• Overhead press: 3 sets of 8-10 reps
• Dips or tricep extensions: 3 sets of 10-12 reps
• Lateral raises: 3 sets of 12-15 reps

Day 2 - Pull (Back, Biceps):
• Pull-ups or rows: 3 sets of 8-12 reps
• Lat pulldowns: 3 sets of 10-12 reps
• Bicep curls: 3 sets of 10-12 reps
• Face pulls: 3 sets of 12-15 reps

Day 3 - Legs:
• Squats: 3 sets of 10-15 reps
• Deadlifts: 3 sets of 8-10 reps
• Leg press: 3 sets of 12-15 reps
• Calf raises: 3 sets of 15-20 reps

Rest 1-2 days between sessions. Increase weight when you can complete all reps easily.`;
  }
  
  // Default general fitness plan
  return `GENERAL FITNESS WORKOUT PLAN

3-Day Full Body Routine

Day 1: Strength & Endurance
• Squats: 3 sets of 12-15 reps
• Push-ups: 3 sets of 8-12 reps
• Plank: 3 sets of 30-45 seconds
• Jumping jacks: 3 sets of 20 reps

Day 2: Cardio & Core
• 20-minute brisk walk or jog
• Mountain climbers: 3 sets of 15 reps
• Bicycle crunches: 3 sets of 20 reps
• Burpees: 3 sets of 5-8 reps

Day 3: Flexibility & Balance
• 15-minute yoga flow
• Single-leg stands: 3 sets of 30 seconds each leg
• Stretching routine: 10-15 minutes
• Deep breathing exercises: 5 minutes

Perform 3 times per week with rest days between sessions.
Stay hydrated and listen to your body!`;
}

// Test endpoint to check if API is working
app.get('/test-models', async (req, res) => {
    try {
        const testResponse = await together.chat.completions.create({
            model: "meta-llama/Llama-3-70b-chat-hf",
            messages: [{ role: "user", content: "Hello, how are you?" }],
            max_tokens: 50,
        });
        
        res.json({ 
            status: 'working',
            model: "meta-llama/Llama-3-70b-chat-hf",
            response: testResponse.choices[0].message.content
        });
    } catch (error) {
        res.json({ 
            status: 'error', 
            model: "meta-llama/Llama-3-70b-chat-hf",
            error: error.message 
        });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Test endpoint: http://localhost:${PORT}/test-models`);
});