// Client-side Push helpers
// Place at frontend/src/scripts/pushManager.js

// registerServiceWorker() -> registers /ServiceWorker.js and returns the registration
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) throw new Error('Service workers are not supported in this browser.');
  
  // FIXED: Use correct service worker filename
  const registration = await navigator.serviceWorker.register('/ServiceWorker.js');
  console.log('✅ Service Worker registered:', registration);
  return registration;
}

// subscribeToPush(registration, vapidPublicKey) -> returns PushSubscription
// vapidPublicKey must be URL-safe base64 (the public VAPID key from your server)
export async function subscribeToPush(registration, vapidPublicKey) {
  if (!('PushManager' in window)) throw new Error('PushManager not supported in this browser.');
  
  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey
  });
  console.log('✅ Push subscription obtained:', subscription);
  return subscription;
}

// Check if already subscribed
export async function getExistingSubscription() {
  if (!('serviceWorker' in navigator)) return null;
  
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return null;
  
  return await registration.pushManager.getSubscription();
}

// Utility: convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}