// Lightweight integration: register SW, subscribe and POST subscription to your backend
// Place at frontend/src/scripts/pushIntegration.js

import { registerServiceWorker, subscribeToPush } from './pushManager';

/**
 * Subscribe the user to push and send subscription to server.
 * - serverUrl: base URL for your backend (example: https://yourdomain.com)
 * - vapidPublicKey: VAPID public key (URL-safe base64)
 * - userId: optional user identifier to associate the subscription on the server
 */
export async function subscribeUserForPush({ serverUrl, vapidPublicKey, userId } = {}) {
  if (!serverUrl || !vapidPublicKey) throw new Error('serverUrl and vapidPublicKey are required');

  // Permission prompt (this still uses Notification API permission)
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported in this browser.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    // on mobile this often returns 'denied' - caller can fallback to in-app notifications
    return { success: false, reason: 'permission-not-granted', permission };
  }

  const registration = await registerServiceWorker();
  const subscription = await subscribeToPush(registration, vapidPublicKey);

  // Send subscription to server
  const resp = await fetch(`${serverUrl.replace(/\/$/, '')}/api/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription, userId })
  });

  const body = await resp.json();
  return { success: true, subscription, serverResponse: body };
}

/**
 * Unsubscribe helper - unregisters subscription locally and optionally notifies server
 */
export async function unsubscribeUser({ serverUrl, subscriptionId } = {}) {
  // remove server-side subscription if provided
  if (serverUrl && subscriptionId) {
    await fetch(`${serverUrl.replace(/\/$/, '')}/api/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: subscriptionId })
    }).catch(() => {});
  }

  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
  }
}