require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// ===== IN-MEMORY DATABASE =====
const users = new Map();
const deposits = new Map();
const withdrawals = new Map();
const investments = new Map();
const transactions = new Map();

// Generate ID
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Generate referral code
const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Create admin user
const adminId = generateId('user');
users.set('admin@moneta-ict.com', {
  id: adminId,
  name: 'Admin User',
  email: 'admin@moneta-ict.com',
  phone: '+573001234567',
  country: 'CO',
  password_hash: bcrypt.hashSync('admin123', 10),
  referral_code: 'ADMIN1',
  referred_by: null,
  balance: 0,
  role: 'admin',
  status: 'active',
  created_at: new Date().toISOString()
});

console.log('✅ Admin created: admin@moneta-ict.com / admin123');

// ===== MIDDLEWARE =====
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ===== AUTH MIDDLEWARE =====
function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-change-in-production');
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// ===== ROUTES =====

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    users: users.size,
    deposits: deposits.size,
    routes: 'configured'
  });
});

// ===== AUTH ROUTES =====

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, country, password, referredBy } = req.body;

    console.log('📝 Registration:', email);

    if (users.has(email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const userId = generateId('user');
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
      process.env.JWT_SECRET || 'default-secret-change-in-production',
      { expiresIn: '7d' }
    );

    const { password_hash, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', email);

    const user = users.get(email);
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      console.log('❌ Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Login successful');

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'default-secret-change-in-production',
      { expiresIn: '7d' }
    );

    const { password_hash, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh token
app.post('/api/auth/refresh', authenticate, (req, res) => {
  try {
    const user = Array.from(users.values()).find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'default-secret-change-in-production',
      { expiresIn: '7d' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// ===== USER ROUTES =====

// Get profile
app.get('/api/user/profile', authenticate, (req, res) => {
  try {
    const user = Array.from(users.values()).find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password_hash, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update profile
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
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get referrals
app.get('/api/user/referrals', authenticate, (req, res) => {
  try {
    const user = Array.from(users.values()).find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const referrals = Array.from(users.values())
      .filter(u => u.referred_by === user.referral_code)
      .map(({ password_hash, ...u }) => u);

    res.json({ referrals, count: referrals.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get referrals' });
  }
});

// ===== TRANSACTION ROUTES =====

// Create deposit
app.post('/api/transactions/deposit', authenticate, upload.single('proof'), (req, res) => {
  try {
    const { amount, currency } = req.body;
    const depositId = generateId('dep');

    const deposit = {
      id: depositId,
      user_id: req.userId,
      amount: parseFloat(amount),
      currency,
      proof_url: req.file ? 'uploaded' : 'no-file',
      status: 'pending',
      admin_notes: null,
      created_at: new Date().toISOString()
    };

    deposits.set(depositId, deposit);
    console.log('✅ Deposit created:', depositId, amount, currency);

    res.status(201).json({ deposit });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Failed to create deposit' });
  }
});

// Get user deposits
app.get('/api/transactions/deposits', authenticate, (req, res) => {
  try {
    const userDeposits = Array.from(deposits.values())
      .filter(d => d.user_id === req.userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    res.json({ deposits: userDeposits });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get deposits' });
  }
});

// Create withdrawal
app.post('/api/transactions/withdraw', authenticate, (req, res) => {
  try {
    const { amount, currency, bankName, accountNumber, accountType } = req.body;
    
    const user = Array.from(users.values()).find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct balance immediately
    user.balance -= parseFloat(amount);
    users.set(user.email, user);

    const withdrawalId = generateId('wdr');
    const withdrawal = {
      id: withdrawalId,
      user_id: req.userId,
      amount: parseFloat(amount),
      currency,
      bank_name: bankName,
      account_number: accountNumber,
      account_type: accountType,
      status: 'pending',
      admin_notes: null,
      created_at: new Date().toISOString()
    };

    withdrawals.set(withdrawalId, withdrawal);
    console.log('✅ Withdrawal created:', withdrawalId, amount);

    res.status(201).json({ withdrawal });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: 'Failed to create withdrawal' });
  }
});

// Get user withdrawals
app.get('/api/transactions/withdrawals', authenticate, (req, res) => {
  try {
    const userWithdrawals = Array.from(withdrawals.values())
      .filter(w => w.user_id === req.userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    res.json({ withdrawals: userWithdrawals });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get withdrawals' });
  }
});

// Create investment
app.post('/api/transactions/invest', authenticate, (req, res) => {
  try {
    const { planId, planName, amount, dailyReturn, durationDays } = req.body;
    
    const user = Array.from(users.values()).find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct balance
    user.balance -= parseFloat(amount);
    users.set(user.email, user);

    const investmentId = generateId('inv');
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + parseInt(durationDays));

    const investment = {
      id: investmentId,
      user_id: req.userId,
      plan_id: planId,
      plan_name: planName,
      amount: parseFloat(amount),
      daily_return: parseFloat(dailyReturn),
      duration_days: parseInt(durationDays),
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: 'active',
      created_at: new Date().toISOString()
    };

    investments.set(investmentId, investment);
    console.log('✅ Investment created:', investmentId);

    res.status(201).json({ investment });
  } catch (error) {
    console.error('Investment error:', error);
    res.status(500).json({ error: 'Failed to create investment' });
  }
});

// Get user investments
app.get('/api/transactions/investments', authenticate, (req, res) => {
  try {
    const userInvestments = Array.from(investments.values())
      .filter(i => i.user_id === req.userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    res.json({ investments: userInvestments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get investments' });
  }
});

// Get transaction history
app.get('/api/transactions/history', authenticate, (req, res) => {
  try {
    const userTransactions = Array.from(transactions.values())
      .filter(t => t.user_id === req.userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    res.json({ transactions: userTransactions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// ===== ADMIN ROUTES =====

// Get pending deposits
app.get('/api/admin/deposits/pending', authenticate, requireAdmin, (req, res) => {
  try {
    const pending = Array.from(deposits.values())
      .filter(d => d.status === 'pending')
      .map(d => {
        const user = Array.from(users.values()).find(u => u.id === d.user_id);
        return { ...d, user_name: user?.name, user_email: user?.email };
      });
    
    res.json({ deposits: pending });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get deposits' });
  }
});

// Approve deposit
app.patch('/api/admin/deposits/:id/approve', authenticate, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const deposit = deposits.get(id);
    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    deposit.status = 'approved';
    deposit.admin_notes = notes;
    deposit.approved_at = new Date().toISOString();
    deposits.set(id, deposit);

    // Update user balance
    const user = Array.from(users.values()).find(u => u.id === deposit.user_id);
    if (user) {
      user.balance += deposit.amount;
      users.set(user.email, user);
    }

    console.log('✅ Deposit approved:', id);
    res.json({ success: true, message: 'Deposit approved' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve deposit' });
  }
});

// Reject deposit
app.patch('/api/admin/deposits/:id/reject', authenticate, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const deposit = deposits.get(id);
    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    deposit.status = 'rejected';
    deposit.admin_notes = notes;
    deposit.approved_at = new Date().toISOString();
    deposits.set(id, deposit);

    console.log('❌ Deposit rejected:', id);
    res.json({ success: true, message: 'Deposit rejected' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject deposit' });
  }
});

// Get all users
app.get('/api/admin/users', authenticate, requireAdmin, (req, res) => {
  try {
    const allUsers = Array.from(users.values())
      .map(({ password_hash, ...u }) => u);
    
    res.json({ users: allUsers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get stats
app.get('/api/admin/stats', authenticate, requireAdmin, (req, res) => {
  try {
    const stats = {
      totalUsers: users.size,
      pendingDeposits: Array.from(deposits.values()).filter(d => d.status === 'pending').length,
      pendingWithdrawals: Array.from(withdrawals.values()).filter(w => w.status === 'pending').length,
      totalDeposits: deposits.size,
      totalWithdrawals: withdrawals.size,
      totalInvestments: investments.size
    };
    
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ===== ERROR HANDLERS =====

// 404 handler
app.use((req, res) => {
  console.log('❌ 404:', req.method, req.path);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
🚀 Server running on port ${PORT}
📡 Environment: ${process.env.NODE_ENV || 'development'}
🌐 CORS: ${process.env.FRONTEND_URL || '*'}
👤 Admin: admin@moneta-ict.com / admin123
📊 Users: ${users.size}

Available routes:
✅ POST /api/auth/register
✅ POST /api/auth/login
✅ POST /api/auth/refresh
✅ GET /api/user/profile
✅ PATCH /api/user/profile
✅ GET /api/user/referrals
✅ POST /api/transactions/deposit
✅ GET /api/transactions/deposits
✅ POST /api/transactions/withdraw
✅ GET /api/transactions/withdrawals
✅ POST /api/transactions/invest
✅ GET /api/transactions/investments
✅ GET /api/transactions/history
✅ GET /api/admin/deposits/pending
✅ PATCH /api/admin/deposits/:id/approve
✅ PATCH /api/admin/deposits/:id/reject
✅ GET /api/admin/users
✅ GET /api/admin/stats
  `);
});
