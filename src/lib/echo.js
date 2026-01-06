import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

let echoInstance = null;

export function createEcho(token) {
  if (echoInstance) return echoInstance;

  if (!token) {
    throw new Error("Echo cannot be created without auth token");
  }

  const scheme = process.env.REACT_APP_REVERB_SCHEME;
  const isSecure = scheme === "https" || scheme === "wss";

  const apiUrl = process.env.REACT_APP_API_URL;
  const baseUrl = apiUrl.replace(/\/api\/?$/, "");

  echoInstance = new Echo({
    broadcaster: "reverb",
    key: process.env.REACT_APP_REVERB_APP_KEY,

    wsHost: process.env.REACT_APP_REVERB_HOST,
    wsPort: Number(process.env.REACT_APP_REVERB_PORT),
    wssPort: 443,

    forceTLS: isSecure,
    encrypted: isSecure,

    enabledTransports: ["ws", "wss"],

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
  if (echoInstance?.disconnect) {
    echoInstance.disconnect();
  }
  echoInstance = null;
}

export function isEchoConnected() {
  return (
    echoInstance?.connector?.pusher?.connection?.state === "connected"
  );
}
