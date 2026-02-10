# MONETA-ICT Backend Deployment Guide

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 3. Initialize database
npm run init-db

# 4. Seed admin user (optional)
node src/scripts/seedData.js

# 5. Start server
npm run dev
```

Server runs at http://localhost:3000

## Deploy to Render

### Step 1: Create PostgreSQL Database

1. Go to https://render.com
2. Click "New +" → "PostgreSQL"
3. Configure:
   - Name: `moneta-ict-db`
   - Database: `moneta_ict`
   - Region: Same as backend
   - Plan: Free
4. Copy **Internal Database URL**

### Step 2: Deploy Backend

1. Push code to GitHub
2. In Render: "New +" → "Web Service"
3. Connect GitHub repo
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add environment variables (see .env.example)
6. Deploy!

### Step 3: Initialize Database

1. In Render → your service → Shell tab
2. Run: `npm run init-db`
3. Run: `node src/scripts/seedData.js`

## Environment Variables

Required variables (from .env.example):
- DATABASE_URL
- JWT_SECRET (generate strong random string)
- TELEGRAM_BOT_TOKEN (from @BotFather)
- TELEGRAM_ADMIN_CHAT_ID
- CLOUDINARY credentials
- FRONTEND_URL

## Testing

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","phone":"+573001234567","country":"CO","password":"test1234"}'
```

## Production Checklist

- [ ] Strong JWT_SECRET set
- [ ] Database backups enabled
- [ ] HTTPS enforced
- [ ] Rate limiting configured
- [ ] Error monitoring setup
- [ ] Admin password changed
- [ ] Telegram bot configured
- [ ] Cloud storage (Cloudinary) configured

## Support

See README.md for API documentation
