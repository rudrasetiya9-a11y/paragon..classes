# PARAGON CLASSES - Free Deployment Guide

## Project Overview
Physics coaching management app with PWA capabilities for mobile installation.

## Free Deployment Options

### Option 1: Netlify (Recommended for Frontend)
1. Create account at netlify.com (free)
2. Upload the exported ZIP file
3. Set build command: `npm run build`
4. Set publish directory: `dist/public`
5. Add environment variables in Netlify dashboard

### Option 2: Vercel (Great for Full-Stack)
1. Create account at vercel.com (free)
2. Connect GitHub repository or upload files
3. Vercel auto-detects build settings
4. Add environment variables in project settings

### Option 3: Railway (Full-Stack with Database)
1. Create account at railway.app (free tier)
2. Deploy from GitHub
3. Automatic PostgreSQL database included
4. Set environment variables

## Required Environment Variables
```
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_random_secret_key
REPLIT_DOMAINS=your_deployed_domain.com
ISSUER_URL=https://replit.com/oidc
REPL_ID=your_repl_id
```

## Build Commands
- Install: `npm install`
- Build: `npm run build`
- Start: `npm start`

## PWA Features Included
✓ Service Worker for offline functionality
✓ Web App Manifest for mobile installation
✓ Responsive design for all devices
✓ Install prompt for users

## Post-Deployment
1. Test PWA installation on mobile devices
2. Verify authentication flows
3. Check file upload functionality
4. Test payment processing (if Stripe keys added)

Your app will be installable as a mobile app once deployed!