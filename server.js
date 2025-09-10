const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');
const fs = require('fs');

// Debug environment variables
console.log('Environment check:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);

// Load environment variables from secret file
const loadEnvFile = () => {
  console.log('Checking for secret file...');
  
  // Render stores secrets here. Check if it exists.
  const secretPath = '/etc/secrets/.env';
  
  if (fs.existsSync(secretPath)) {
    console.log('Secret file FOUND at', secretPath);
    // Instead of reading it manually, let Render inject it
    // Render automatically makes these available as environment variables
  } else {
    console.log('Secret file NOT found at', secretPath);
    // Check if key is available anyway (Render might have injected it another way)
    if (process.env.OPENAI_API_KEY) {
      console.log('But OPENAI_API_KEY was found in process.env');
    }
  }
};

loadEnvFile();

// Initialize OpenAI with better error handling
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key'
  });
  console.log('OpenAI initialized successfully');
} catch (error) {
  console.error('OpenAI initialization failed:', error.message);
}

const app = express();

// CORS configuration - allow all origins for now
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Health check endpoint with more detailed info
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running!',
    hasOpenAIKey: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-dummy-key',
    openAIInitialized: !!openai,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Test endpoint is working!',
    success: true
  });
});

// Evaluation endpoint
app.post('/api/evaluate', async (req, res) => {
  try {
    // Check if OpenAI is configured
    if (!openai) {
      console.error('OpenAI not configured in /api/evaluate');
      return res.status(500).json({ 
        error: 'OpenAI not configured',
        details: 'API key not available or invalid'
      });
    }

    const { prompt, userResponse } = req.body;

    if (!prompt || !userResponse) {
      return res.status(400).json({ 
        error: 'Prompt and user response are required' 
      });
    }

    console.log('Received evaluation request for prompt:', prompt.substring(0, 50) + '...');

    // Create the evaluation prompt for OpenAI
    const evaluationPrompt = `
    Evaluate the following user response to the prompt. Provide feedback on:
    1. Relevance to the prompt
    2. Clarity and coherence
    3. Creativity (if applicable)
    4. Overall quality
    
    Provide a score from 1-10 and specific feedback.
    
    PROMPT: "${prompt}"
    
    USER RESPONSE: "${userResponse}"
    
    EVALUATION:
    `;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that evaluates user responses to prompts." },
        { role: "user", content: evaluationPrompt }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const evaluation = completion.choices[0].message.content;

    // Extract score if possible (look for a number between 1-10)
    let score = null;
    const scoreMatch = evaluation.match(/\b(\d{1,2})\/10\b/);
    if (scoreMatch) {
      score = parseInt(scoreMatch[1]);
    }

    console.log('Evaluation completed successfully');
    
    res.json({
      evaluation,
      score,
      prompt,
      userResponse,
      success: true
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ 
      error: 'Failed to evaluate response',
      details: error.message,
      success: false
    });
  }
});

// Serve static files in both development and production
app.use(express.static(path.join(__dirname, 'public')));

// Handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Loaded' : 'Not found'}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});
