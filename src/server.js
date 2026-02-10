require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

/* =============================
   TRUST PROXY (Required on Render)
============================= */
app.set('trust proxy', 1);

/* =============================
   SECURITY MIDDLEWARE
============================= */
app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

/* =============================
   RATE LIMITING (API only)
============================= */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

/* =============================
   BODY PARSING
============================= */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* =============================
   LOGGING
============================= */
app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')
);

/* =============================
   ROUTES
============================= */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/admin', require('./routes/admin'));

/* =============================
   ROOT ROUTE
============================= */
app.get('/', (req, res) => {
  res.json({
    name: 'MONETA-ICT API',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
  });
});

/* =============================
   HEALTH CHECK
============================= */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/* =============================
   404 HANDLER
============================= */
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

/* =============================
   ERROR HANDLER
============================= */
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err);

  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
  });
});

/* =============================
   SERVER START
============================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});
