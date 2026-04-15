// ============================================================
//  EtterReel Backend Server
//  Powered by: Replicate, RunwayML, OpenAI, Stripe
// ============================================================

const express    = require('express');
const cors       = require('cors');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── File upload setup ────────────────────────────────────
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

// ─── Routes ──────────────────────────────────────────────
app.use('/api/generate', require('./routes/generate'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/auth',     require('./routes/auth'));

// ─── Serve frontend ──────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start server ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎬 EtterReel server running on http://localhost:${PORT}`);
  console.log(`✅ Replicate API: ${process.env.REPLICATE_API_KEY ? 'Connected' : '❌ Missing'}`);
  console.log(`${process.env.OPENAI_API_KEY    ? '✅' : '❌'} OpenAI API:    ${process.env.OPENAI_API_KEY    ? 'Connected' : 'Missing - add to .env'}`);
  console.log(`${process.env.RUNWAY_API_KEY    ? '✅' : '❌'} RunwayML API:  ${process.env.RUNWAY_API_KEY    ? 'Connected' : 'Missing - add to .env'}`);
  console.log(`${process.env.STRIPE_SECRET_KEY ? '✅' : '❌'} Stripe:        ${process.env.STRIPE_SECRET_KEY ? 'Connected' : 'Missing - add to .env'}`);
  console.log('\n');
});
