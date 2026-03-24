/**
 * Push Notification Routes
 * Handles push subscription management and sending notifications
 */

import { Router } from 'express';
import webpush from 'web-push';

const router = Router();

// In-memory storage for subscriptions (use database in production)
// You can migrate this to Prisma later
const subscriptions = new Map();

// Configure web-push with VAPID keys from environment
const vapidPublicKey = process.env.VAPID_PUBLIC;
const vapidPrivateKey = process.env.VAPID_PRIVATE;
const contactEmail = process.env.CONTACT_EMAIL || 'mailto:admin@skycast.app';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(contactEmail, vapidPublicKey, vapidPrivateKey);
  console.log('✅ VAPID keys configured for push notifications');
} else {
  console.warn('⚠️ VAPID keys not found - push notifications will not work');
}

// =====================================================
// GET /api/push/vapid-public-key
// Returns the public VAPID key for client subscription
// =====================================================
router.get('/vapid-public-key', (req, res) => {
  if (!vapidPublicKey) {
    return res.status(500).json({
      success: false,
      error: 'VAPID public key not configured'
    });
  }
  
  res.json({
    success: true,
    publicKey: vapidPublicKey
  });
});

// =====================================================
// POST /api/subscribe
// Subscribe a client to push notifications
// =====================================================
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription, userId } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        success: false,
        error: 'Invalid subscription object'
      });
    }

    // Generate a unique ID for this subscription
    const subscriptionId = userId || `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store the subscription
    subscriptions.set(subscriptionId, {
      subscription,
      userId,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    });

    console.log(`📱 New push subscription registered: ${subscriptionId}`);
    console.log(`📊 Total subscriptions: ${subscriptions.size}`);

    res.status(201).json({
      success: true,
      message: 'Subscription saved successfully',
      subscriptionId
    });
  } catch (error) {
    console.error('❌ Error saving subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save subscription'
    });
  }
});

// =====================================================
// POST /api/unsubscribe
// Unsubscribe a client from push notifications
// =====================================================
router.post('/unsubscribe', async (req, res) => {
  try {
    const { id, endpoint } = req.body;

    if (id) {
      subscriptions.delete(id);
      console.log(`🗑️ Subscription removed by ID: ${id}`);
    } else if (endpoint) {
      // Find and remove by endpoint
      for (const [key, value] of subscriptions.entries()) {
        if (value.subscription.endpoint === endpoint) {
          subscriptions.delete(key);
          console.log(`🗑️ Subscription removed by endpoint: ${key}`);
          break;
        }
      }
    }

    res.json({
      success: true,
      message: 'Unsubscribed successfully'
    });
  } catch (error) {
    console.error('❌ Error removing subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe'
    });
  }
});

// =====================================================
// POST /api/push/send
// Send a push notification to a specific subscription
// =====================================================
router.post('/send', async (req, res) => {
  try {
    const { subscriptionId, title, body, icon, badge, url, data } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        error: 'subscriptionId is required'
      });
    }

    const subData = subscriptions.get(subscriptionId);
    if (!subData) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    const payload = JSON.stringify({
      title: title || '🌤️ SkyCast Weather',
      body: body || 'Weather update available',
      icon: icon || '/favicon.ico',
      badge: badge || '/favicon.ico',
      data: {
        url: url || '/',
        ...data
      },
      tag: `skycast-${Date.now()}`,
      requireInteraction: false
    });

    await webpush.sendNotification(subData.subscription, payload);
    
    // Update last used timestamp
    subData.lastUsed = new Date().toISOString();
    subscriptions.set(subscriptionId, subData);

    console.log(`📤 Push notification sent to: ${subscriptionId}`);

    res.json({
      success: true,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    
    // If subscription is invalid, remove it
    if (error.statusCode === 410 || error.statusCode === 404) {
      const { subscriptionId } = req.body;
      subscriptions.delete(subscriptionId);
      console.log(`🗑️ Removed invalid subscription: ${subscriptionId}`);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to send notification',
      details: error.message
    });
  }
});

// =====================================================
// POST /api/push/broadcast
// Send a push notification to ALL subscribed users
// =====================================================
router.post('/broadcast', async (req, res) => {
  try {
    const { title, body, icon, badge, url, data } = req.body;

    if (subscriptions.size === 0) {
      return res.status(404).json({
        success: false,
        error: 'No subscriptions found'
      });
    }

    const payload = JSON.stringify({
      title: title || '🌤️ SkyCast Weather',
      body: body || 'Weather update available',
      icon: icon || '/favicon.ico',
      badge: badge || '/favicon.ico',
      data: {
        url: url || '/',
        ...data
      },
      tag: `skycast-broadcast-${Date.now()}`,
      requireInteraction: false
    });

    const results = {
      sent: 0,
      failed: 0,
      removed: 0
    };

    const sendPromises = [];

    for (const [id, subData] of subscriptions.entries()) {
      const promise = webpush
        .sendNotification(subData.subscription, payload)
        .then(() => {
          results.sent++;
          subData.lastUsed = new Date().toISOString();
          subscriptions.set(id, subData);
        })
        .catch((error) => {
          results.failed++;
          // Remove invalid subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            subscriptions.delete(id);
            results.removed++;
            console.log(`🗑️ Removed invalid subscription: ${id}`);
          }
        });
      
      sendPromises.push(promise);
    }

    await Promise.all(sendPromises);

    console.log(`📢 Broadcast complete: ${results.sent} sent, ${results.failed} failed, ${results.removed} removed`);

    res.json({
      success: true,
      message: 'Broadcast complete',
      results
    });
  } catch (error) {
    console.error('❌ Error broadcasting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast notification'
    });
  }
});

// =====================================================
// POST /api/push/weather-alert
// Send a weather alert notification (specialized for weather)
// =====================================================
router.post('/weather-alert', async (req, res) => {
  try {
    const { 
      city, 
      temperature, 
      condition, 
      humidity, 
      windSpeed,
      alertType = 'update'
    } = req.body;

    if (!city) {
      return res.status(400).json({
        success: false,
        error: 'city is required'
      });
    }

    // Build notification content
    let title, body;
    
    switch (alertType) {
      case 'severe':
        title = `⚠️ Severe Weather Alert - ${city}`;
        body = `${condition || 'Severe weather'} expected. Stay safe!`;
        break;
      case 'rain':
        title = `🌧️ Rain Alert - ${city}`;
        body = `Rain expected. ${temperature ? `Current: ${temperature}°C` : ''}`;
        break;
      case 'temperature':
        title = `🌡️ Temperature Alert - ${city}`;
        body = `${temperature}°C - ${condition || 'Temperature change detected'}`;
        break;
      default:
        title = `🌤️ Weather Update - ${city}`;
        body = `${temperature ? `${temperature}°C` : ''} ${condition ? `- ${condition}` : ''}`;
        if (humidity) body += `\n💧 Humidity: ${humidity}%`;
        if (windSpeed) body += `\n💨 Wind: ${windSpeed} km/h`;
    }

    const payload = JSON.stringify({
      title,
      body: body.trim(),
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: {
        url: '/dashboard',
        city,
        alertType
      },
      tag: `weather-${alertType}-${Date.now()}`,
      requireInteraction: alertType === 'severe'
    });

    const results = { sent: 0, failed: 0 };

    for (const [id, subData] of subscriptions.entries()) {
      try {
        await webpush.sendNotification(subData.subscription, payload);
        results.sent++;
      } catch (error) {
        results.failed++;
        if (error.statusCode === 410 || error.statusCode === 404) {
          subscriptions.delete(id);
        }
      }
    }

    console.log(`🌤️ Weather alert sent: ${results.sent} success, ${results.failed} failed`);

    res.json({
      success: true,
      message: 'Weather alert sent',
      results
    });
  } catch (error) {
    console.error('❌ Error sending weather alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send weather alert'
    });
  }
});

// =====================================================
// GET /api/push/subscriptions
// Get subscription statistics (admin/debug)
// =====================================================
router.get('/subscriptions', (req, res) => {
  res.json({
    success: true,
    count: subscriptions.size,
    subscriptions: Array.from(subscriptions.entries()).map(([id, data]) => ({
      id,
      userId: data.userId,
      createdAt: data.createdAt,
      lastUsed: data.lastUsed
    }))
  });
});

export default router;