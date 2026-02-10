# MONETA-ICT Backend API

Complete Express.js + PostgreSQL backend for the MONETA-ICT investment platform.

## Features

- ✅ User authentication (JWT)
- ✅ Deposit processing with file uploads
- ✅ Withdrawal management
- ✅ Investment tracking
- ✅ Admin approval system via Telegram
- ✅ Transaction history
- ✅ Referral system
- ✅ Country-specific currency handling (COP/PEN)

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
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token

### User
- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update profile

### Transactions
- `POST /api/transactions/deposit` - Create deposit
- `POST /api/transactions/withdraw` - Request withdrawal
- `POST /api/transactions/invest` - Create investment
- `GET /api/transactions/history` - Get user transactions

### Admin
- `GET /api/admin/deposits/pending` - Get pending deposits
- `PATCH /api/admin/deposits/:id/approve` - Approve deposit
- `PATCH /api/admin/deposits/:id/reject` - Reject deposit
- `GET /api/admin/withdrawals/pending` - Get pending withdrawals
- `PATCH /api/admin/withdrawals/:id/approve` - Approve withdrawal
- `GET /api/admin/users` - Get all users
- `GET /api/admin/stats` - System statistics

## Environment Variables

See `.env.example` for all required variables.

## Database Schema

Run `npm run init-db` to create all tables:
- users
- deposits
- withdrawals
- investments
- transactions

## Deployment

See `/FULLSTACK-DEPLOYMENT.md` for complete deployment guide to Render.
