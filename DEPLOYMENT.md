# Deployment Guide

This guide covers deploying the website to various hosting platforms.

## 🚀 Quick Deployment Options

### Option 1: Vercel (Recommended for Full-Stack)

**Frontend + Backend on Vercel:**

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Configure Environment Variables in Vercel Dashboard:**
   - `JWT_SECRET` - Strong random string
   - `FRONTEND_URL` - Your Vercel frontend URL
   - `NODE_ENV=production`

4. **Set API URL in Frontend:**
   - In Vercel dashboard, go to your frontend project
   - Add environment variable: `VITE_API_BASE_URL=https://your-api.vercel.app/api`

**Note:** Vercel will automatically:
- Build the frontend from `client/` directory
- Deploy API as serverless functions from `api/` directory
- Handle routing automatically

### Option 2: Netlify (Frontend Only)

**For Frontend on Netlify:**

1. **Connect Repository:**
   - Go to [Netlify](https://netlify.com)
   - Connect your Git repository

2. **Build Settings:**
   - Build command: `cd client && npm install && npm run build`
   - Publish directory: `client/dist`
   - Base directory: `.` (root)

3. **Environment Variables:**
   - `VITE_API_BASE_URL` - Your backend API URL

4. **Deploy:**
   - Netlify will auto-deploy on git push
   - Or use Netlify CLI: `netlify deploy --prod`

**Backend Options for Netlify:**
- Deploy backend separately to:
  - Railway
  - Render
  - Heroku
  - DigitalOcean
  - AWS/GCP/Azure

### Option 3: Separate Frontend + Backend

**Frontend (Vercel/Netlify):**
- Deploy `client/` directory
- Set `VITE_API_BASE_URL` to your backend URL

**Backend (Railway/Render/Heroku):**
- Deploy `server/` directory
- Set environment variables
- Update CORS to allow frontend domain

## 📋 Pre-Deployment Checklist

### 1. Environment Variables

**Frontend (.env or hosting platform):**
```env
VITE_API_BASE_URL=https://your-backend-api.com/api
```

**Backend (.env or hosting platform):**
```env
PORT=5000
JWT_SECRET=your-strong-secret-key-here
FRONTEND_URL=https://your-frontend-domain.com
NODE_ENV=production
```

### 2. Security Checklist

- [ ] Change default admin credentials
- [ ] Set strong JWT_SECRET (use random string generator)
- [ ] Configure CORS properly for production domain
- [ ] Enable HTTPS (automatic on Vercel/Netlify)
- [ ] Review security logs
- [ ] Update API URLs in frontend

### 3. Build Test

Test the build locally:
```bash
# Frontend
cd client
npm install
npm run build
npm run preview  # Test production build

# Backend
cd server
npm install
npm start
```

### 4. Database/Storage

- If using Firebase: Configure Firebase credentials
- If using JSON files: Ensure write permissions
- Consider migrating to database for production

## 🔧 Platform-Specific Instructions

### Vercel Deployment

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Production Deploy:**
   ```bash
   vercel --prod
   ```

5. **Environment Variables:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all required variables

**Vercel Structure:**
- Frontend: Automatically detected from `client/` directory
- Backend: Serverless functions in `api/` directory
- Routing: Handled by `vercel.json`

### Netlify Deployment

1. **Via Git:**
   - Connect repository
   - Build settings are in `netlify.toml`
   - Auto-deploys on push

2. **Via CLI:**
   ```bash
   npm i -g netlify-cli
   netlify login
   netlify deploy
   netlify deploy --prod
   ```

3. **Environment Variables:**
   - Netlify Dashboard → Site Settings → Environment Variables

**Netlify Structure:**
- Frontend: Built from `client/` directory
- Backend: Deploy separately (Netlify Functions or external)

### Railway Deployment

1. **Backend:**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login and deploy
   railway login
   railway init
   railway up
   ```

2. **Configure:**
   - Set environment variables in Railway dashboard
   - Railway auto-detects Node.js projects

### Render Deployment

1. **Backend:**
   - Create new Web Service
   - Connect repository
   - Build command: `cd server && npm install && npm start`
   - Start command: `node index.js`

2. **Environment Variables:**
   - Add in Render dashboard

### Heroku Deployment

1. **Backend:**
   ```bash
   # Install Heroku CLI
   heroku create your-app-name
   git push heroku main
   ```

2. **Environment Variables:**
   ```bash
   heroku config:set JWT_SECRET=your-secret
   heroku config:set FRONTEND_URL=https://your-frontend.com
   ```

## 🌐 Domain Configuration

### Custom Domain

1. **Vercel:**
   - Settings → Domains → Add domain
   - Configure DNS as instructed

2. **Netlify:**
   - Site Settings → Domain Management
   - Add custom domain
   - Configure DNS

### SSL/HTTPS

- Automatically handled by Vercel/Netlify
- Free SSL certificates provided
- Auto-renewal enabled

## 🔍 Post-Deployment Verification

1. **Test Frontend:**
   - [ ] Homepage loads
   - [ ] Navigation works
   - [ ] All pages accessible
   - [ ] Theme toggle works
   - [ ] Forms submit correctly

2. **Test Backend:**
   - [ ] API endpoints respond
   - [ ] Authentication works
   - [ ] CORS configured correctly
   - [ ] Security features active

3. **Test Integration:**
   - [ ] Frontend can reach backend
   - [ ] Login/Register works
   - [ ] Admin panel accessible
   - [ ] Security logs working

## 🐛 Troubleshooting

### Common Issues

**1. CORS Errors:**
- Check `FRONTEND_URL` in backend matches frontend domain
- Verify CORS configuration in `server/index.js`

**2. API Not Found:**
- Verify `VITE_API_BASE_URL` is set correctly
- Check API routes are accessible
- Test API endpoint directly

**3. Build Failures:**
- Check Node.js version (requires >= 18)
- Verify all dependencies installed
- Check for TypeScript/ESLint errors

**4. Environment Variables:**
- Ensure variables are set in hosting platform
- Restart deployment after adding variables
- Check variable names match exactly

**5. Routing Issues (404 on refresh):**
- Verify `_redirects` file exists (Netlify)
- Check `vercel.json` rewrites (Vercel)
- Ensure SPA routing is configured

## 📊 Monitoring

After deployment:
1. Monitor security logs in Admin panel
2. Check error logs in hosting platform
3. Set up uptime monitoring
4. Configure error tracking (optional)

## 🔄 Continuous Deployment

Both Vercel and Netlify support:
- Automatic deployments on git push
- Preview deployments for PRs
- Rollback to previous versions
- Branch-based deployments

## 📝 Notes

- **Vercel**: Best for full-stack (frontend + serverless backend)
- **Netlify**: Best for frontend, backend needs separate hosting
- **Railway/Render**: Good for backend deployment
- **Separate Hosting**: More control, more setup required

## 🆘 Support

For deployment issues:
1. Check hosting platform documentation
2. Review error logs
3. Test locally first
4. Check environment variables
5. Verify build commands

