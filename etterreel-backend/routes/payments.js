// ============================================================
//  EtterReel — Stripe Payment Routes
//  Handles: subscriptions, credit packs, free trial tracking
// ============================================================

const express = require('express');
const router  = express.Router();
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ─── Price IDs (set these up in your Stripe dashboard) ────
const PRICES = {
  creator_monthly: 'price_creator_monthly',  // $19/mo — replace with real Stripe Price ID
  pro_monthly:     'price_pro_monthly',       // $49/mo — replace with real Stripe Price ID
  creator_yearly:  'price_creator_yearly',    // $13/mo billed yearly
  pro_yearly:      'price_pro_yearly',        // $34/mo billed yearly
  credits_5:       'price_credits_5',         // $9  — 5 videos
  credits_15:      'price_credits_15',        // $19 — 15 videos
  credits_30:      'price_credits_30',        // $35 — 30 videos
  credits_100:     'price_credits_100',       // $99 — 100 videos
};

// ─── POST /api/payments/checkout ─────────────────────────
// Creates a Stripe checkout session
router.post('/checkout', async (req, res) => {
  try {
    const { priceType, email, userId } = req.body;

    if (!PRICES[priceType]) {
      return res.status(400).json({ error: 'Invalid price type' });
    }

    const isSubscription = priceType.includes('monthly') || priceType.includes('yearly');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      mode: isSubscription ? 'subscription' : 'payment',
      line_items: [{
        price: PRICES[priceType],
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.FRONTEND_URL || 'http://localhost:3001'}/pricing`,
      metadata: { userId, priceType },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/payments/webhook ──────────────────────────
// Stripe calls this when a payment completes
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log(`✅ Payment complete for user: ${session.metadata.userId}`);
      // TODO: Update user credits/subscription in your database
      // addCreditsToUser(session.metadata.userId, session.metadata.priceType);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      console.log(`❌ Subscription cancelled: ${sub.id}`);
      // TODO: Remove subscription access from user
      break;
    }
  }

  res.json({ received: true });
});

// ─── GET /api/payments/credits/:userId ───────────────────
// Check how many credits a user has
router.get('/credits/:userId', async (req, res) => {
  // TODO: Connect to your database
  // For now returns a mock response
  res.json({
    userId: req.params.userId,
    freeVideosUsed: 0,
    freeVideosAllowed: 1,
    credits: 0,
    plan: 'free',
  });
});

module.exports = router;
