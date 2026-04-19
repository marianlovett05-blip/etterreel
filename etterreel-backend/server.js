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

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Middleware Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ File upload setup Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
const upload = multer({
  dest: '/tmp/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Routes Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
app.use('/api/generate', require('./routes/generate'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/auth',     require('./routes/auth'));

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Serve frontend Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ

app.get('/debug-path', (req, res) => {
  const p = path.join(__dirname, 'public', 'index.html');
  const exists = fs.existsSync(p);
  const dirContents = fs.existsSync(path.join(__dirname, 'public')) ? fs.readdirSync(path.join(__dirname, 'public')).join(',') : 'NO_DIR';
  res.json({ __dirname, p, exists, dirContents, cwd: process.cwd() });
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Start server Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
app.listen(PORT, () => {
  console.log(`\nÃ°ÂÂÂ¬ EtterReel server running on http://localhost:${PORT}`);
  console.log(`Ã¢ÂÂ Replicate API: ${process.env.REPLICATE_API_KEY ? 'Connected' : 'Ã¢ÂÂ Missing'}`);
  console.log(`${process.env.OPENAI_API_KEY    ? 'Ã¢ÂÂ' : 'Ã¢ÂÂ'} OpenAI API:    ${process.env.OPENAI_API_KEY    ? 'Connected' : 'Missing - add to .env'}`);
  console.log(`${process.env.RUNWAY_API_KEY    ? 'Ã¢ÂÂ' : 'Ã¢ÂÂ'} RunwayML API:  ${process.env.RUNWAY_API_KEY    ? 'Connected' : 'Missing - add to .env'}`);
  console.log(`${process.env.STRIPE_SECRET_KEY ? 'Ã¢ÂÂ' : 'Ã¢ÂÂ'} Stripe:        ${process.env.STRIPE_SECRET_KEY ? 'Connected' : 'Missing - add to .env'}`);
  console.log('\n');
});
