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

// âââ Middleware âââââââââââââââââââââââââââââââââââââââââââ
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// âââ File upload setup ââââââââââââââââââââââââââââââââââââ
const upload = multer({
  dest: '/tmp/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

// âââ Routes ââââââââââââââââââââââââââââââââââââââââââââââ
app.use('/api/generate', require('./routes/generate'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/auth',     require('./routes/auth'));

// âââ Serve frontend ââââââââââââââââââââââââââââââââââââââ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// âââ Start server âââââââââââââââââââââââââââââââââââââââââ
app.listen(PORT, () => {
  console.log(`\nð¬ EtterReel server running on http://localhost:${PORT}`);
  console.log(`â Replicate API: ${process.env.REPLICATE_API_KEY ? 'Connected' : 'â Missing'}`);
  console.log(`${process.env.OPENAI_API_KEY    ? 'â' : 'â'} OpenAI API:    ${process.env.OPENAI_API_KEY    ? 'Connected' : 'Missing - add to .env'}`);
  console.log(`${process.env.RUNWAY_API_KEY    ? 'â' : 'â'} RunwayML API:  ${process.env.RUNWAY_API_KEY    ? 'Connected' : 'Missing - add to .env'}`);
  console.log(`${process.env.STRIPE_SECRET_KEY ? 'â' : 'â'} Stripe:        ${process.env.STRIPE_SECRET_KEY ? 'Connected' : 'Missing - add to .env'}`);
  console.log('\n');
});
