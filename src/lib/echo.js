import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

let echoInstance = null;

export function createEcho(token) {
  if (echoInstance) return echoInstance;

  if (!token) {
    throw new Error("Echo cannot be created without auth token");
  }

  const apiUrl = process.env.REACT_APP_API_URL;
  if (!apiUrl) {
    throw new Error("REACT_APP_API_URL is required");
  }

  // Get Pusher credentials - support both naming conventions
  const pusherKey = process.env.REACT_APP_PUSHER_APP_KEY || process.env.REACT_APP_PUSHER_KEY;
  const pusherCluster = process.env.REACT_APP_PUSHER_APP_CLUSTER || process.env.REACT_APP_PUSHER_CLUSTER || "eu";

  if (!pusherKey) {
    throw new Error(
      "Pusher app key is required. Please set REACT_APP_PUSHER_APP_KEY or REACT_APP_PUSHER_KEY in your .env file"
    );
  }

  const baseUrl = apiUrl.replace(/\/api\/?$/, "");

  echoInstance = new Echo({
    broadcaster: "pusher",
    key: pusherKey,
    cluster: pusherCluster,
    forceTLS: true,
    encrypted: true,
    authEndpoint: `${baseUrl}/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  });

  return echoInstance;
}

export function getEcho() {
  return echoInstance;
}

export function disconnectEcho() {
  echoInstance?.disconnect?.();
  echoInstance = null;
}

export function isEchoConnected() {
  return echoInstance?.connector?.pusher?.connection?.state === "connected";
}
