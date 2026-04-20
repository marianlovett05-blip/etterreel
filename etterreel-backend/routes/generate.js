// EtterReel — Video Generation Routes (fixed)
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const Replicate = require('replicate');

// Accept both naming conventions for the API key
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY
});

// Store uploads in memory (Vercel serverless-safe)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB
});

// Helper: expand prompt with GPT-4o-mini if key present
async function expandPrompt(raw) {
  if (!process.env.OPENAI_API_KEY) return raw;
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Write a vivid, cinematic 2-sentence music video scene description for: "' + raw + '". Focus on visuals only.' }],
      max_tokens: 100
    });
    return r.choices[0].message.content.trim();
  } catch { return raw; }
}

// POST /api/generate/song-to-video
router.post('/song-to-video', upload.single('song'), async (req, res) => {
  try {
    const { style = 'cinematic', artistName = '', trackTitle = '', customStyle = '' } = req.body;
    let prompt = customStyle || (style + ' music video');
    if (artistName) prompt += ' for artist ' + artistName;
    if (trackTitle) prompt += ', song titled "' + trackTitle + '"';
    prompt += '. High-quality cinematography, atmospheric lighting, dynamic camera movement.';
    const expanded = await expandPrompt(prompt);
    const prediction = await replicate.predictions.create({
      model: 'minimax/video-01',
      input: { prompt: expanded, prompt_optimizer: true }
    });
    res.json({ predictionId: prediction.id, status: prediction.status });
  } catch (err) {
    console.error('song-to-video error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/generate/text-to-video
router.post('/text-to-video', async (req, res) => {
  try {
    const { prompt, style = 'cinematic', customStyle = '' } = req.body;
    if (!prompt) return res.status(400).json({ error: 'No prompt provided' });
    const fullPrompt = customStyle ? (customStyle + ': ' + prompt) : (style + ' style: ' + prompt + '. High-quality video, smooth motion, professional.');
    const expanded = await expandPrompt(fullPrompt);
    const prediction = await replicate.predictions.create({
      model: 'minimax/video-01',
      input: { prompt: expanded, prompt_optimizer: true }
    });
    res.json({ predictionId: prediction.id, status: prediction.status });
  } catch (err) {
    console.error('text-to-video error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/generate/images-to-video
router.post('/images-to-video', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No images uploaded' });
    const { style = 'cinematic', prompt = '', customStyle = '' } = req.body;
    const firstFile = req.files[0];
    const imageBlob = new Blob([firstFile.buffer], { type: firstFile.mimetype });
    const videoPrompt = customStyle || prompt || (style + ' music video, smooth cinematic camera movement, professional lighting');
    const prediction = await replicate.predictions.create({
      model: 'minimax/video-01-live',
      input: { first_frame_image: imageBlob, prompt: videoPrompt, prompt_optimizer: true }
    });
    res.json({ predictionId: prediction.id, status: prediction.status });
  } catch (err) {
    console.error('images-to-video error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/generate/lyrics
router.post('/lyrics', async (req, res) => {
  try {
    const { theme, genre = 'pop', structure = 'verse-chorus' } = req.body;
    if (!theme) return res.status(400).json({ error: 'Theme required' });
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'OpenAI API key not configured on server' });
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Write original ' + genre + ' song lyrics about: ' + theme + '.\nStructure: ' + structure + '.\nLabel each section (Verse 1, Chorus, etc.).\nMake it emotional, vivid, and radio-ready. Just the lyrics, no explanation.' }],
      max_tokens: 700
    });
    res.json({ lyrics: completion.choices[0].message.content.trim() });
  } catch (err) {
    console.error('lyrics error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/generate/status/:predictionId
router.get('/status/:predictionId', async (req, res) => {
  try {
    const prediction = await replicate.predictions.get(req.params.predictionId);
    res.json(prediction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;