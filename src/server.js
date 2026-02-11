require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

// In-memory database (temporary - replace with PostgreSQL later)
const users = new Map();
const deposits = new Map();
const withdrawals = new Map();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://moneta-ict-huua.onrender.com',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Generate referral code
function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create admin user on startup
const adminId = 'admin-001';
const adminPassword = bcrypt.hashSync('admin123', 10);
users.set('admin@moneta-ict.com', {
  id: adminId,
  name: 'Admin User',
  email: 'admin@moneta-ict.com',
  phone: '+57 300 123 4567',
  country: 'CO',
  password_hash: adminPassword,
  referral_code: 'ADMIN1',
  referred_by: null,
  balance: 0,
  role: 'admin',
  status: 'active',
  created_at: new Date().toISOString()
});

console.log('✅ Admin user created: admin@moneta-ict.com / admin123');

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    users: users.size
  });
});

// Auth - Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, country, password, referredBy } = req.body;

    console.log('📝 Registration attempt:', email);

    if (users.has(email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const userId = 'user-' + Date.now();
    const passwordHash = await bcrypt.hash(password, 10);
    const referralCode = req.body.referralCode || generateReferralCode();

    const user = {
      id: userId,
      name,
      email,
      phone,
      country,
      password_hash: passwordHash,
      referral_code: referralCode,
      referred_by: referredBy || null,
      balance: 0,
      role: 'user',
      status: 'active',
      created_at: new Date().toISOString()
    };

    users.set(email, user);
    console.log('✅ User registered:', email);

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'moneta-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    const { password_hash, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Auth - Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', email);

    const user = users.get(email);
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Login successful:', email);

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'moneta-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    const { password_hash, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Middleware to verify JWT
function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'moneta-secret-key-change-in-production'
    );
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// User - Get Profile
app.get('/api/user/profile', authenticate, (req, res) => {
  try {
    const user = Array.from(users.values()).find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password_hash, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// User - Update Profile
app.patch('/api/user/profile', authenticate, (req, res) => {
  try {
    const { name, phone } = req.body;
    const userEntry = Array.from(users.entries()).find(([, u]) => u.id === req.userId);
    
    if (!userEntry) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [email, user] = userEntry;
    if (name) user.name = name;
    if (phone) user.phone = phone;
    users.set(email, user);

    const { password_hash, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Transactions - Create Deposit
app.post('/api/transactions/deposit', authenticate, (req, res) => {
  try {
    const { amount, currency } = req.body;
    const depositId = 'dep-' + Date.now();

    const deposit = {
      id: depositId,
      user_id: req.userId,
      amount: parseFloat(amount),
      currency,
      proof_url: 'pending-upload',
      status: 'pending',
      created_at: new Date().toISOString()
    };

    deposits.set(depositId, deposit);
    console.log('✅ Deposit created:', depositId);

    res.status(201).json({ deposit });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Failed to create deposit' });
  }
});

// Transactions - Get Deposits
app.get('/api/transactions/deposits', authenticate, (req, res) => {
  try {
    const userDeposits = Array.from(deposits.values())
      .filter(d => d.user_id === req.userId);
    res.json({ deposits: userDeposits });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get deposits' });
  }
});

// 404 handler
app.use((req, res) => {
  console.log('404:', req.method, req.path);
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'https://moneta-ict-huua.onrender.com'}`);
  console.log(`👤 Admin: admin@moneta-ict.com / admin123`);
});
