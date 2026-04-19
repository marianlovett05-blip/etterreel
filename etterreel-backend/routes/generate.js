// EtterReel Ã¢ÂÂ Video Generation Routes
const express = require('express');
const router = express.Router();
const multer = require('multer');
const Replicate = require('replicate');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const upload = multer({ dest: '/tmp/' });
const replicate = new Replicate({ auth: process.env.REPLICATE_API_KEY || '' });
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const STYLE_PROMPTS = {
  cinematic: 'cinematic wide shot, ultra realistic, dramatic lighting, 8K, film grain',
  neon: 'neon city night, cyberpunk, glowing neon signs, rain reflections',
  abstract: 'abstract art, flowing shapes, vibrant colors, digital painting',
  nature: 'breathtaking nature landscape, golden hour, cinematic, 8K',
  anime: 'anime style, highly detailed, studio ghibli inspired',
  retro: 'retro 80s style, vaporwave aesthetics, synthwave colors',
};

router.post('/song-to-video', upload.single('song'), async (req, res) => {
  try {
    const { style = 'cinematic', artistName = '', trackTitle = '' } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No song file uploaded' });
    let moodDescription = 'energetic, emotional, powerful music';
    if (process.env.OPENAI_API_KEY) {
      const r = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: `Visual mood for music video: "${trackTitle}" by "${artistName}" - 15 words max.` }], max_tokens: 60 });
      moodDescription = r.choices[0].message.content;
    }
    const styleModifier = STYLE_PROMPTS[style] || STYLE_PROMPTS.cinematic;
    const imagePrompt = `Music video scene for "${trackTitle}", ${moodDescription}, ${styleModifier}, no text`;
    const framePromises = Array.from({ length: 8 }, (_, i) =>
      replicate.run('stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ed7461b5f9a2aad6c64c4b5d6', { input: { prompt: `${imagePrompt}, scene ${i+1} of 8`, negative_prompt: 'text, watermark, blurry, low quality', width: 1024, height: 576, num_inference_steps: 25, guidance_scale: 7.5 } })
    );
    const frameUrls = await Promise.all(framePromises);
    try { fs.unlinkSync(req.file.path); } catch(e) {}
    res.json({ success: true, mode: 'song-to-video', frames: frameUrls, mood: moodDescription, style });
  } catch (err) { res.status(500).json({ error: 'Generation failed', details: err.message }); }
});

router.post('/text-to-video', async (req, res) => {
  try {
    const { prompt, style = 'cinematic' } = req.body;
    if (!prompt) return res.status(400).json({ error: 'No prompt provided' });
    let expandedPrompt = prompt;
    if (process.env.OPENAI_API_KEY) {
      const r = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: `Expand this music video concept into a rich visual description (max 50 words): "${prompt}". Focus on visuals, lighting, colors, emotion.` }], max_tokens: 100 });
      expandedPrompt = r.choices[0].message.content;
    }
    const fullPrompt = `${expandedPrompt}, ${STYLE_PROMPTS[style] || STYLE_PROMPTS.cinematic}, no text, music video frame`;
    const frameUrls = await Promise.all(Array.from({ length: 6 }, (_, i) =>
      replicate.run('stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ed7461b5f9a2aad6c64c4b5d6', { input: { prompt: `${fullPrompt}, moment ${i+1}`, negative_prompt: 'text, watermark, blurry, low quality', width: 1024, height: 576, num_inference_steps: 25 } })
    ));
    res.json({ success: true, mode: 'text-to-video', frames: frameUrls, expandedPrompt, style });
  } catch (err) { res.status(500).json({ error: 'Generation failed', details: err.message }); }
});

router.post('/images-to-video', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || !req.files.length) return res.status(400).json({ error: 'No images uploaded' });
    const clips = req.files.map(f => `/uploads/${path.basename(f.path)}`);
    res.json({ success: true, mode: 'images-to-video', clips });
  } catch (err) { res.status(500).json({ error: 'Generation failed', details: err.message }); }
});

router.post('/lyrics', async (req, res) => {
  try {
    const { topic, genre, mood, artist, structure = 'verse-chorus' } = req.body;
    if (!topic) return res.status(400).json({ error: 'Song topic is required' });
    const structureGuide = { 'verse-chorus': 'Write: [Verse 1], [Chorus], [Verse 2], [Chorus]', 'verse-chorus-bridge': 'Write: [Verse 1], [Chorus], [Verse 2], [Chorus], [Bridge], [Chorus]', 'verse-hook': 'Write: [Verse 1], [Hook], [Verse 2], [Hook], [Verse 3], [Hook]', 'full': 'Write: [Intro], [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Chorus], [Bridge], [Outro]' };
    const prompt = `You are a professional songwriter. Write original song lyrics:\n- Topic: ${topic}\n- Genre: ${genre}\n- Mood: ${mood}\n- Structure: ${structureGuide[structure]}\n${artist ? 'Style of ' + artist : ''}\nRules: ORIGINAL lyrics, section labels in [brackets], 4-8 lines per section, no explanations.`;
    const r = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 800, temperature: 0.85 });
    res.json({ success: true, lyrics: r.choices[0].message.content, topic, genre, mood });
  } catch (err) { res.status(500).json({ error: 'Lyrics generation failed', details: err.message }); }
});

router.get('/status/:predictionId', async (req, res) => {
  try { res.json(await replicate.predictions.get(req.params.predictionId)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
