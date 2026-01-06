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

  const baseUrl = apiUrl.replace(/\/api\/?$/, "");

  const isProduction = process.env.NODE_ENV === "production";

  const echoConfig = {
    broadcaster: "reverb",
    key: process.env.REACT_APP_REVERB_APP_KEY,

    authEndpoint: `${baseUrl}/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  };

  if (isProduction) {
    // ✅ Laravel Cloud Managed Reverb
    echoConfig.forceTLS = true;
    echoConfig.encrypted = true;
  } else {
    // ✅ Local self-hosted Reverb
    echoConfig.wsHost = process.env.REACT_APP_REVERB_HOST || "localhost";
    echoConfig.wsPort = Number(process.env.REACT_APP_REVERB_PORT || 8080);
    echoConfig.forceTLS = false;
    echoConfig.encrypted = false;
    echoConfig.enabledTransports = ["ws"];
  }

  echoInstance = new Echo(echoConfig);

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
  return echoInstance?.connector?.pusher?.connection?.state === "connected";
}
