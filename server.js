const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running on Render!',
    message: 'Your AI prompt trainer backend is ready',
    timestamp: new Date().toISOString()
  });
});

// Mock evaluation endpoint
app.post('/api/evaluate', (req, res) => {
  const { prompt, challenge } = req.body;
  
  // Simulated AI response
  const promptLength = prompt.length;
  let score = 60 + Math.min(40, Math.floor(promptLength / 5));
  
  const mockEvaluation = {
    score: score,
    feedback: "This is mock feedback. Add your OpenAI API key for real AI analysis.",
    strengths: ["Good structure", "Clear intent"],
    weaknesses: ["Could be more specific", "Needs examples"],
    suggestions: "Try adding specific examples and constraints to your prompt.",
    promptReceived: prompt.substring(0, 50) + (prompt.length > 50 ? "..." : ""),
    challengeType: challenge
  };
  
  // Simulate API delay
  setTimeout(() => {
    res.json(mockEvaluation);
  }, 800);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Prompt Trainer API',
    endpoints: {
      health: 'GET /api/health',
      evaluate: 'POST /api/evaluate'
    },
    usage: 'Send a POST request to /api/evaluate with JSON body containing "prompt" and "challenge"'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});