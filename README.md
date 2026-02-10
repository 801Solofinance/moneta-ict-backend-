# MONETA-ICT Backend API

Complete Express.js + PostgreSQL backend for MONETA-ICT investment platform.

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your credentials
npm run init-db
npm run dev
```

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh

### User
- GET /api/user/profile
- PATCH /api/user/profile
- GET /api/user/referrals

### Transactions
- POST /api/transactions/deposit
- GET /api/transactions/deposits
- POST /api/transactions/withdraw
- GET /api/transactions/withdrawals
- POST /api/transactions/invest
- GET /api/transactions/investments
- GET /api/transactions/history

### Admin
- GET /api/admin/deposits/pending
- PATCH /api/admin/deposits/:id/approve
- PATCH /api/admin/deposits/:id/reject
- GET /api/admin/withdrawals/pending
- PATCH /api/admin/withdrawals/:id/approve
- PATCH /api/admin/withdrawals/:id/reject
- GET /api/admin/users
- GET /api/admin/stats

## Deployment

See DEPLOYMENT-GUIDE.md
