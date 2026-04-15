// ============================================================
//  EtterReel — Auth Routes (Sign up / Log in)
// ============================================================

const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');

// Simple in-memory user store (replace with a real database later)
const users = new Map();

// ─── POST /api/auth/signup ────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (users.has(email)) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const userId = crypto.randomUUID();
    const token  = crypto.randomBytes(32).toString('hex');

    users.set(email, {
      id: userId, name, email,
      passwordHash: crypto.createHash('sha256').update(password).digest('hex'),
      token,
      plan: 'free',
      freeVideosUsed: 0,
      credits: 0,
      createdAt: new Date().toISOString(),
    });

    console.log(`✅ New user signed up: ${name} (${email})`);

    res.json({
      success: true,
      user: { id: userId, name, email, plan: 'free', freeVideosUsed: 0, credits: 0 },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users.get(email);

    if (!user) {
      return res.status(401).json({ error: 'No account found with that email' });
    }

    const hash = crypto.createHash('sha256').update(password).digest('hex');
    if (hash !== user.passwordHash) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    res.json({
      success: true,
      user: { id: user.id, name: user.name, email, plan: user.plan, credits: user.credits },
      token: user.token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
