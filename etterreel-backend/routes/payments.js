const express = require('express');
const router  = express.Router();

const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

const FRONTEND = process.env.FRONTEND_URL || 'https://www.etterreel.com';

// Plans — no pre-created Price IDs needed, we use price_data
const PLANS = {
  creator_monthly:  { name: 'Creator Plan',  amount: 1900, interval: 'month', credits: 50  },
  pro_monthly:      { name: 'Pro Plan',       amount: 4900, interval: 'month', credits: 200 },
  credits_10:       { name: '10 Video Credits', amount: 999,  interval: null,  credits: 10  },
  credits_25:       { name: '25 Video Credits', amount: 1999, interval: null,  credits: 25  },
  credits_50:       { name: '50 Video Credits', amount: 3499, interval: null,  credits: 50  },
};

// POST /api/payments/checkout
router.post('/checkout', async (req, res) => {
  try {
    if (!stripe) return res.status(503).json({ error: 'Stripe not configured. Add STRIPE_SECRET_KEY to Vercel env vars.' });

    const { planType, email, userId } = req.body;
    const plan = PLANS[planType];
    if (!plan) return res.status(400).json({ error: 'Invalid plan type. Valid: ' + Object.keys(PLANS).join(', ') });

    const isRecurring = !!plan.interval;

    const priceData = isRecurring
      ? { currency: 'usd', product_data: { name: plan.name }, unit_amount: plan.amount, recurring: { interval: plan.interval } }
      : { currency: 'usd', product_data: { name: plan.name + ' (' + plan.credits + ' credits)' }, unit_amount: plan.amount };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: isRecurring ? 'subscription' : 'payment',
      line_items: [{ price_data: priceData, quantity: 1 }],
      success_url: FRONTEND + '/dashboard?payment=success&credits=' + plan.credits,
      cancel_url:  FRONTEND + '/dashboard?payment=cancelled',
      customer_email: email || undefined,
      metadata: { userId: userId || '', planType, credits: String(plan.credits) }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/webhook  (add STRIPE_WEBHOOK_SECRET to Vercel)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });

  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: 'Webhook signature error: ' + err.message });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('Payment complete:', session.metadata);
    // TODO: Save credits to database for user session.metadata.userId
  }

  res.json({ received: true });
});

// GET /api/payments/plans  — list available plans
router.get('/plans', (req, res) => {
  res.json(Object.entries(PLANS).map(([id, p]) => ({ id, ...p })));
});

// GET /api/payments/credits/:userId
router.get('/credits/:userId', (req, res) => {
  // TODO: Connect to database — returning demo value for now
  res.json({ credits: 5, plan: 'free' });
});

module.exports = router;