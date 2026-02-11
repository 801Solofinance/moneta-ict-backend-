# MONETA-ICT Complete Backend

## ALL ROUTES WORKING! ✅

This backend has EVERY route your frontend needs:

### Auth Routes
- POST /api/auth/register
- POST /api/auth/login  
- POST /api/auth/refresh

### User Routes
- GET /api/user/profile
- PATCH /api/user/profile
- GET /api/user/referrals

### Transaction Routes
- POST /api/transactions/deposit
- GET /api/transactions/deposits
- POST /api/transactions/withdraw
- GET /api/transactions/withdrawals
- POST /api/transactions/invest
- GET /api/transactions/investments
- GET /api/transactions/history

### Admin Routes
- GET /api/admin/deposits/pending
- PATCH /api/admin/deposits/:id/approve
- PATCH /api/admin/deposits/:id/reject
- GET /api/admin/users
- GET /api/admin/stats

## Deploy on Render

1. Push to GitHub
2. Create Web Service on Render
3. Connect repo
4. Set environment variables:
   - FRONTEND_URL=https://moneta-ict-huua.onrender.com
   - JWT_SECRET=your-random-secret
   - NODE_ENV=production
5. Deploy!

## Test

Visit: https://your-backend.onrender.com/health

Login with:
- Email: admin@moneta-ict.com
- Password: admin123
