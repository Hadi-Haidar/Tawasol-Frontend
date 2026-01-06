# Deployment Configuration Guide

## Frontend (Vercel) - Environment Variables

Set these environment variables in your **Vercel project settings**:

```env
# Production API Configuration
REACT_APP_API_URL=https://tawasol-backend-main-5wgtje.laravel.cloud/api

# Laravel Reverb WebSocket Configuration
REACT_APP_REVERB_APP_KEY=mysipvrzcwc0i8xemtua
REACT_APP_REVERB_HOST=tawasol-backend-main-5wgtje.laravel.cloud
REACT_APP_REVERB_PORT=443
REACT_APP_REVERB_SCHEME=wss
REACT_APP_AUTH_ENDPOINT=https://tawasol-backend-main-5wgtje.laravel.cloud/api/broadcasting/auth

# App Configuration
REACT_APP_NAME=Tawasol Chat
REACT_APP_VERSION=1.0.0
```

### How to Set Variables in Vercel:
1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable above
4. Redeploy your frontend

---

## Backend (Laravel Cloud) - Environment Variables

Add/Update these in your **Laravel Cloud environment settings**:

```env
# Disable Redis scaling (no Redis server needed)
REVERB_SCALING_ENABLED=false

# Queue & Cache without Redis
QUEUE_CONNECTION=database
CACHE_DRIVER=file

# Reverb Configuration (already set)
BROADCAST_DRIVER=reverb
REVERB_APP_ID=935875
REVERB_APP_KEY=mysipvrzcwc0i8xemtua
REVERB_APP_SECRET=lynswbg4phwqqcixf87f
REVERB_HOST=tawasol-backend-main-5wgtje.laravel.cloud
REVERB_PORT=443
REVERB_SCHEME=https
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080
```

### Start Reverb Server on Laravel Cloud:

You need to run Reverb as a background process. Check Laravel Cloud dashboard for:
- **"Workers"** or **"Background Processes"** section
- Add a worker with command: `php artisan reverb:start --host=0.0.0.0 --port=8080`

---

## After Configuration:

1. **Backend**: Restart your Laravel Cloud instance
2. **Frontend**: Redeploy on Vercel
3. Test the WebSocket connection

---

## For Local Development:

Create a `.env.local` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_REVERB_APP_KEY=local
REACT_APP_REVERB_HOST=localhost
REACT_APP_REVERB_PORT=8080
REACT_APP_REVERB_SCHEME=ws
REACT_APP_AUTH_ENDPOINT=http://localhost:8000/api/broadcasting/auth
REACT_APP_NAME=Tawasol Chat
REACT_APP_VERSION=1.0.0
```

Then run:
```bash
# Backend
php artisan reverb:start

# Frontend  
npm start
```

