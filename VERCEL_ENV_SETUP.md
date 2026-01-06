# ✅ Vercel Environment Variables Setup

## 🚀 Required Environment Variables for Production

Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

Add these **EXACT** variables (for **Production** environment):

```
REACT_APP_API_URL
https://tawasol-backend-main-5wgtje.laravel.cloud/api

REACT_APP_REVERB_APP_KEY
mysipvrzcwc0i8xemtua

REACT_APP_REVERB_HOST
tawasol-backend-main-5wgtje.laravel.cloud

REACT_APP_REVERB_PORT
443

REACT_APP_REVERB_SCHEME
https

REACT_APP_AUTH_ENDPOINT
https://tawasol-backend-main-5wgtje.laravel.cloud/api/broadcasting/auth

REACT_APP_NAME
Tawasol Chat

REACT_APP_VERSION
1.0.0
```

---

## ⚠️ IMPORTANT NOTES

### ✅ DO:
- Use `https` as the scheme (NOT `wss`, `ws`, or `http`)
- Set for **Production** environment in Vercel
- Use port `443` for production
- **REDEPLOY** after setting variables (they are baked in at build time!)

### ❌ DON'T:
- Don't use `localhost` in production variables
- Don't use `ws://` or `wss://` as scheme (use `http` or `https`)
- Don't use port `8080` in production
- Don't forget to rebuild after changing variables!

---

## 🔄 After Setting Variables

### Option 1: Trigger Redeploy from Vercel
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **...** menu → **Redeploy**

### Option 2: Git Push (Recommended)
```bash
cd C:\Users\User\Desktop\frontend
git add .
git commit -m "Fix: Updated to Laravel Echo with Reverb broadcaster"
git push
```

---

## ✅ Verify It's Working

After redeployment:

1. Open your production site
2. Open browser DevTools (F12) → Console tab
3. Look for: `🔌 Initializing Laravel Echo with Reverb:`
4. Verify it shows your production host (NOT localhost)
5. Look for: `✅ WebSocket connected successfully`

---

## 📋 What Changed?

### Before (WRONG):
- Used `pusher-js` directly ❌
- Used `ws://` or `wss://` scheme ❌
- Pusher protocol with hardcoded values ❌

### After (CORRECT):
- Using `laravel-echo` with Reverb broadcaster ✅
- Using `http://` or `https://` scheme ✅
- Proper environment variable configuration ✅

---

## 🆘 Troubleshooting

### Still seeing localhost connections?
1. **Clear build cache** in Vercel
2. **Verify environment variables** are set correctly
3. **Check they're set for Production** (not just Preview)
4. **Trigger a fresh deployment**

### WebSocket not connecting?
1. Check browser console for error messages
2. Verify Reverb is running on your Laravel backend
3. Check CORS settings on backend
4. Ensure `REVERB_SCALING_ENABLED=false` in backend if Redis isn't available

---

## 📝 Summary

**Old setup:** pusher-js + Pusher protocol  
**New setup:** laravel-echo + Reverb broadcaster  
**Result:** Native Laravel Reverb connection that works in both local and production! 🎉

