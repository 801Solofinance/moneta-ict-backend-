require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { sequelize } = require('./models');

const app = express();

/* TRUST PROXY (Render) */
app.set('trust proxy', 1);

/* SECURITY */
app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  })
);

/* RATE LIMIT */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use('/api/', limiter);

/* BODY */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* LOGGING */
app.use(morgan('dev'));

/* ROUTES */
app.use('/api/auth', require('./routes/auth'));

/* ROOT */
app.get('/', (req, res) => {
  res.json({
    name: 'MONETA-ICT API',
    status: 'running',
  });
});

/* ERROR */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

/* START SERVER AFTER DB SYNC */
const PORT = process.env.PORT || 3000;

sequelize
  .sync()
  .then(() => {
    console.log('✅ Database connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
  });
