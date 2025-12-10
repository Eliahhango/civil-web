# 🚀 Deployment Guide - Quick Start

## Deployment Options

### ✅ Option 1: Vercel (Recommended - Full Stack)

**Deploy both frontend and backend together:**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

**Environment Variables (Vercel Dashboard):**
- `JWT_SECRET` - Strong random string
- `FRONTEND_URL` - Your Vercel frontend URL
- `VITE_API_BASE_URL` - Leave empty (uses relative paths)

**That's it!** Vercel handles everything automatically.

---

### ✅ Option 2: Netlify (Frontend) + Railway/Render (Backend)

**Frontend on Netlify:**
1. Connect Git repository
2. Build command: `cd client && npm install && npm run build`
3. Publish directory: `client/dist`
4. Environment variable: `VITE_API_BASE_URL=https://your-backend-url.com/api`

**Backend on Railway/Render:**
1. Connect Git repository
2. Root directory: `server`
3. Build command: `npm install`
4. Start command: `node index.js`
5. Environment variables:
   - `JWT_SECRET`
   - `FRONTEND_URL` (your Netlify URL)
   - `PORT` (auto-set by platform)

---

### ✅ Option 3: Separate Hosting

**Frontend:** Vercel, Netlify, GitHub Pages, Cloudflare Pages
**Backend:** Railway, Render, Heroku, DigitalOcean, AWS, GCP, Azure

Set `VITE_API_BASE_URL` in frontend to point to your backend.

---

## 📋 Pre-Deployment Checklist

- [ ] Change default admin password
- [ ] Set strong `JWT_SECRET`
- [ ] Configure `FRONTEND_URL` in backend
- [ ] Set `VITE_API_BASE_URL` in frontend (if backend is separate)
- [ ] Test build locally: `cd client && npm run build`
- [ ] Review security settings

---

## 🔧 Environment Variables

### Frontend
```env
VITE_API_BASE_URL=https://your-backend.com/api
```

### Backend
```env
PORT=5000
JWT_SECRET=your-strong-secret-key
FRONTEND_URL=https://your-frontend.com
NODE_ENV=production
```

---

## ✅ Build Test

```bash
# Test frontend build
cd client
npm install
npm run build
npm run preview

# Test backend
cd server
npm install
npm start
```

---

## 📚 Full Documentation

See `DEPLOYMENT.md` for detailed instructions for each platform.

