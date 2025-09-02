const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running!' });
});

// Mock evaluation endpoint
app.post('/api/evaluate', (req, res) => {
  const { prompt, challenge } = req.body;
  
  // Simulated AI response
  const mockEvaluation = {
    score: Math.floor(Math.random() * 40) + 60,
    feedback: "This is mock feedback. Real AI integration coming soon.",
    strengths: ["Clarity", "Structure"],
    weaknesses: ["Could be more specific", "Add examples"],
    suggestions: "Try being more specific and including examples."
  };
  
  // Simulate API delay
  setTimeout(() => {
    res.json(mockEvaluation);
  }, 1000);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});