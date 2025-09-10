const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');
const fs = require('fs');

// Load environment variables from secret file
const loadEnvFile = () => {
  try {
    // Try to load from Render's secret file location
    const secretPath = '/etc/secrets/.env';
    if (fs.existsSync(secretPath)) {
      const envFile = fs.readFileSync(secretPath, 'utf8');
      envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      });
      console.log('Loaded environment variables from secret file');
    }
  } catch (error) {
    console.log('No secret file found, using regular environment variables');
  }
};

loadEnvFile();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key' // Fallback for development
});

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running with secret files!',
    hasOpenAIKey: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-dummy-key'
  });
});

// Evaluation endpoint
app.post('/api/evaluate', async (req, res) => {
  try {
    const { prompt, userResponse } = req.body;

    if (!prompt || !userResponse) {
      return res.status(400).json({ 
        error: 'Prompt and user response are required' 
      });
    }

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

    res.json({
      evaluation,
      score,
      prompt,
      userResponse
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ 
      error: 'Failed to evaluate response',
      details: error.message 
    });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  
  // Handle SPA routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Loaded' : 'Not found'}`);
});