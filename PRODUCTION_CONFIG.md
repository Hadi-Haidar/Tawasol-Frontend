# Production Environment Configuration

## Quick Setup Guide

### 1. Create `.env.production` file

In your `frontend` folder, create a file named `.env.production` with the following content:

```env
# Backend API URL (replace with your actual production domain)
REACT_APP_API_URL=https://api.yourdomain.com/api

# Pusher/Broadcasting (if using WebSockets)
REACT_APP_PUSHER_KEY=your-pusher-app-key
REACT_APP_PUSHER_CLUSTER=mt1
REACT_APP_PUSHER_HOST=your-pusher-host.com
REACT_APP_PUSHER_PORT=443
REACT_APP_PUSHER_SCHEME=https
```

### 2. Build for Production

```bash
npm run build
```

The build process will automatically use `.env.production` when building for production.

### 3. Deploy

Upload the `build` folder to your production server.

---

## Environment Files Structure

```
frontend/
├── .env                  # Local development (used by npm start)
├── .env.production       # Production (used by npm run build)
└── .env.production.example  # Template (not used, for reference)
```

---

## Important Notes

1. **MUST start with `REACT_APP_`**: All custom environment variables must start with `REACT_APP_` prefix
2. **Rebuild after changes**: After changing environment variables, you must rebuild the app
3. **CORS**: Make sure your Laravel backend allows requests from your frontend domain
4. **HTTPS**: Production should use HTTPS for security

---

## Testing Production Build Locally

You can test your production build locally:

```bash
# Build for production
npm run build

# Serve the production build
npx serve -s build -p 3000
```

Then visit `http://localhost:3000` to test the production build.

