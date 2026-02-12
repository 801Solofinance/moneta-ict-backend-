const { authenticate } = require('./middleware/auth');
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const transactionsRoutes = require('./routes/transactions');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['https://moneta-ict-huua.onrender.com', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', authenticate, transactionsRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'MONETA-ICT Backend Running',
    time: new Date().toISOString()
  });
});

// Connect DB + Start Server
sequelize.sync().then(() => {
  console.log('✅ Database connected');
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('❌ Database connection error:', err);
});
