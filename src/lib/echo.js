import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// 🔴 MUST be BEFORE new Echo()
window.Pusher = Pusher;

let echo = null;

/**
 * Get or create the Echo instance (singleton pattern)
 */
export function getEcho(token = null) {
  // If Echo exists and we have a new token, update the auth headers
  if (echo && token) {
    if (echo.connector && echo.connector.options) {
      echo.connector.options.auth = echo.connector.options.auth || {};
      echo.connector.options.auth.headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      };
    }
    return echo;
  }

  if (echo) {
    return echo;
  }

  // Get token from storage if not provided
  const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');

  echo = new Echo({
    broadcaster: 'reverb',
    key: process.env.REACT_APP_REVERB_APP_KEY || 'local',

    wsHost: 'localhost',
    wsPort: 8080,
    forceTLS: false,

    enabledTransports: ['ws', 'wss'],
    
    // 🔴 CRITICAL: Auth endpoint must point to Laravel backend
    authEndpoint: 'http://localhost:8000/api/broadcasting/auth',
    auth: {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: 'application/json',
      },
    },
  });

  return echo;
}

/**
 * Disconnect Echo (rarely needed)
 */
export function disconnectEcho() {
  if (echo) {
    try {
      if (echo.disconnect && typeof echo.disconnect === 'function') {
        echo.disconnect();
      }
    } catch (err) {
      console.error('Error disconnecting Echo:', err);
    }
  }
  echo = null;
}

/**
 * Check if Echo is connected
 */
export function isEchoConnected() {
  return echo && 
         echo.connector && 
         echo.connector.pusher && 
         echo.connector.pusher.connection &&
         echo.connector.pusher.connection.state === 'connected';
}

export default getEcho;
