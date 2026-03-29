

import { useState, useEffect } from 'react';
function getDeviceType() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  if (/android/i.test(ua)) return 'Android';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.userAgent.includes('Macintosh') && 'ontouchend' in document)) return 'iOS';
  return 'Other';
}
  const [deviceType, setDeviceType] = useState('');
  const [swObj, setSwObj] = useState(null);
  const [subscription, setSubscription] = useState(null);
  // Helper to refresh all notification state
  const refreshState = async () => {
    setDeviceType(getDeviceType());
    setPushSupported('serviceWorker' in navigator && 'PushManager' in window);
    setSwRegistered(false);
    setSubscription(null);
    setLastError('');
    setStatus('Refreshing notification state...');
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        if (regs.length > 0) {
          setSwRegistered(true);
          setSwObj(regs[0]);
          if ('pushManager' in regs[0]) {
            const sub = await regs[0].pushManager.getSubscription();
            setSubscription(sub);
            setSubscribed(!!sub);
          }
        }
      }
      setStatus('Notification state refreshed.');
    } catch (err) {
      setLastError('Refresh state error: ' + (err && err.message ? err.message : String(err)));
      setStatus('Refresh state failed');
    }
  };

  useEffect(() => {
    refreshState();
    // eslint-disable-next-line
  }, []);
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}


function NotificationControls() {
  const [permission, setPermission] = useState(Notification.permission);
  const [subscribed, setSubscribed] = useState(false);
  const [swRegistered, setSwRegistered] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [lastApiResponse, setLastApiResponse] = useState('');
  const [lastError, setLastError] = useState('');
  const [status, setStatus] = useState('');

  // Remove old useEffect, now handled by refreshState

  const enableAlerts = async () => {
    setStatus('Enable Alerts button clicked');
    setLastError('');
    setLastApiResponse('');
    try {
      if (!pushSupported) {
        setLastError('Push not supported in this browser.');
        setStatus('Push not supported');
        return;
      }
      setStatus('Requesting notification permission...');
      const perm = await Notification.requestPermission();
      setPermission(perm);
      setStatus(`Notification permission: ${perm}`);
      if (perm !== 'granted') {
        setLastError('Notification permission not granted.');
        return;
      }
      setStatus('Registering service worker...');
      console.log('[SW] Registration start: /service-worker.js');
      let reg = null;
      try {
        reg = await navigator.serviceWorker.register('/service-worker.js');
        setSwRegistered(true);
        setSwObj(reg);
        setStatus('Service worker registered.');
        console.log('[SW] Registration success:', reg);
      } catch (swErr) {
        setSwRegistered(false);
        setSwObj(null);
        setLastError('Service worker registration failed: ' + (swErr && swErr.message ? swErr.message : String(swErr)));
        setStatus('Service worker registration failed');
        console.error('[SW] Registration failed:', swErr);
        return;
      }
      // Check if SW is active and controlling the page
      let swState = 'unknown';
      if (navigator.serviceWorker.controller) {
        swState = 'active (controlling page)';
      } else if (reg && reg.active) {
        swState = 'active (not yet controlling page)';
      } else {
        swState = 'not active';
      }
      setStatus('Service worker state: ' + swState);
      console.log('[SW] State:', swState);
      setStatus('Subscribing to push...');
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      setSubscription(sub);
      setStatus('Push subscription created. Sending to backend...');
      const resp = await fetch(`${BACKEND_URL}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub)
      });
      const respText = await resp.text();
      setLastApiResponse(respText);
      if (!resp.ok) {
        setLastError(`Subscribe API error: ${resp.status} ${resp.statusText}`);
        setStatus('Subscribe API failed');
        return;
      }
      setSubscribed(true);
      setStatus('Push notifications enabled!');
    } catch (err) {
      setLastError('Enable Alerts error: ' + (err && err.message ? err.message : String(err)));
      setStatus('Enable Alerts failed');
      console.error('Enable Alerts error:', err);
    }
    refreshState();
  };
  const unregisterServiceWorker = async () => {
    setStatus('Unregistering service worker...');
    setLastError('');
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          await reg.unregister();
        }
        setSwRegistered(false);
        setSubscribed(false);
        setSubscription(null);
        setSwObj(null);
        setStatus('Service worker unregistered.');
      } else {
        setLastError('Service worker not supported.');
      }
    } catch (err) {
      setLastError('Unregister error: ' + (err && err.message ? err.message : String(err)));
      setStatus('Unregister failed');
    }
    refreshState();
  };
  // iOS Home Screen guidance
  const showIosGuidance = deviceType === 'iOS';

  const sendTestAlert = async () => {
    setStatus('Send Test Alert button clicked');
    setLastError('');
    setLastApiResponse('');
    try {
      setStatus('Calling backend to send test push...');
      const resp = await fetch(`${BACKEND_URL}/api/send-test-push`, { method: 'POST' });
      const respText = await resp.text();
      setLastApiResponse(respText);
      if (!resp.ok) {
        setLastError(`Test push API error: ${resp.status} ${resp.statusText}`);
        setStatus('Test push API failed');
        return;
      }
      setStatus('Test push sent!');
    } catch (err) {
      setLastError('Send Test Alert error: ' + (err && err.message ? err.message : String(err)));
      setStatus('Send Test Alert failed');
      console.error('Send Test Alert error:', err);
    }
  };

  return (
    <div style={{ margin: '1em 0' }}>
      <button onClick={enableAlerts}>Enable Alerts</button>
      <button onClick={sendTestAlert} style={{ marginLeft: 8 }} disabled={!subscribed}>Send Test Alert</button>
      <button onClick={refreshState} style={{ marginLeft: 8 }}>Refresh Notification State</button>
      <button onClick={unregisterServiceWorker} style={{ marginLeft: 8 }}>Unregister Service Worker</button>
      <div style={{ fontSize: 12, marginTop: 4 }}>
        Notification permission: <b>{permission}</b>
      </div>
      {showIosGuidance && (
        <div style={{ color: 'orange', marginTop: 8 }}>
          <b>iPhone/iPad detected:</b> For push notifications, you must install this app to your Home Screen and enable notifications from there. Push will not work in a normal browser tab.
        </div>
      )}
      <div style={{ marginTop: 12, padding: 8, border: '1px solid #ccc', borderRadius: 4, background: '#f9f9f9' }}>
        <b>Debug Notifications</b>
        <div>Device: <b>{deviceType}</b></div>
        <div>Backend URL: <code>{BACKEND_URL}</code></div>
        <div>VAPID Public Key: <code>{VAPID_PUBLIC_KEY ? VAPID_PUBLIC_KEY.slice(0, 16) + '...' : 'not set'}</code></div>
        <div>Push Supported: <b>{String(pushSupported)}</b></div>
        <div>Service Worker Registered: <b>{String(swRegistered)}</b></div>
        <div>PushManager Supported: <b>{String('PushManager' in window)}</b></div>
        <div>Push Subscribed: <b>{String(subscribed)}</b></div>
        <div>Subscription Exists: <b>{subscription ? 'yes' : 'no'}</b></div>
        <div>Status: <b>{status}</b></div>
        <div>Service Worker Error: <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: 'red' }}>{lastError && lastError.includes('Service worker registration') ? lastError : ''}</pre></div>
        <div>Last API Response: <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{lastApiResponse}</pre></div>
        <div style={{ color: 'red' }}>Last Error: <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{lastError}</pre></div>
      </div>
    </div>
  );
}

export default NotificationControls;
