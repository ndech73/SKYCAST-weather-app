// Minimal push server example (Node + Express + web-push)
// Place at backend/push-server/index.js
// Usage:
//   npm install express body-parser web-push dotenv
//   set VAPID_PUBLIC and VAPID_PRIVATE in environment (.env)
//   node index.js

const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(bodyParser.json());

// Load VAPID keys from environment
const VAPID_PUBLIC = process.env.VAPID_PUBLIC;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'mailto:you@example.com';

if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
  console.error('Missing VAPID_PUBLIC or VAPID_PRIVATE in environment. Generate them with web-push generateVAPIDKeys().');
  process.exit(1);
}

webpush.setVapidDetails(CONTACT_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

// In-memory subscription store (replace with DB in production)
const subscriptions = new Map(); // id -> subscription

// POST /api/subscribe
// { subscription: <PushSubscription>, userId?: <string> }
app.post('/api/subscribe', (req, res) => {
  try {
    const { subscription, userId } = req.body;
    if (!subscription) return res.status(400).json({ error: 'No subscription provided' });

    // Generate an id for storage (use userId or timestamp)
    const id = userId || Date.now().toString();
    subscriptions.set(id, subscription);

    console.log(`Subscription saved: ${id}`);
    res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/unsubscribe
// { id: subscriptionId }
app.post('/api/unsubscribe', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id required' });
  subscriptions.delete(id);
  res.json({ success: true });
});

// POST /api/sendPush
// { id?: <subscriptionId>, payload: {...} }
// If id is omitted, broadcast to all subscriptions
app.post('/api/sendPush', async (req, res) => {
  const { id, payload } = req.body;
  if (!payload) return res.status(400).json({ error: 'payload required' });

  const sendTo = id ? [subscriptions.get(id)].filter(Boolean) : Array.from(subscriptions.values());
  if (sendTo.length === 0) return res.status(404).json({ error: 'No subscriptions found' });

  const results = await Promise.all(sendTo.map(async (sub) => {
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload));
      return { ok: true };
    } catch (err) {
      // Remove invalid subscription if 410/GONE
      if (err.statusCode === 410 || err.statusCode === 404) {
        // find and delete subscription(s)
        for (const [key, s] of subscriptions.entries()) {
          if (JSON.stringify(s) === JSON.stringify(sub)) subscriptions.delete(key);
        }
      }
      console.error('Push error', err);
      return { ok: false, error: err.message || err };
    }
  }));

  res.json({ results });
});

// GET /api/vapidPublicKey - returns public key so client can subscribe
app.get('/api/vapidPublicKey', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Push server listening on port ${PORT}`);
  console.log(`VAPID public key: ${VAPID_PUBLIC}`);
});