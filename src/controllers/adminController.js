const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');

exports.getPendingDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.getPending();
    res.json({ deposits });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get deposits' });
  }
};

exports.approveDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    await Deposit.approve(id, req.userId, notes);
    res.json({ success: true, message: 'Deposit approved' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve deposit' });
  }
};

exports.rejectDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    await Deposit.reject(id, req.userId, notes);
    res.json({ success: true, message: 'Deposit rejected' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject deposit' });
  }
};

exports.getPendingWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.getPending();
    res.json({ withdrawals });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get withdrawals' });
  }
};

exports.approveWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    await Withdrawal.approve(id, req.userId, notes);
    res.json({ success: true, message: 'Withdrawal approved' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve withdrawal' });
  }
};

exports.rejectWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    await Withdrawal.reject(id, req.userId, notes);
    res.json({ success: true, message: 'Withdrawal rejected' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject withdrawal' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get users' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const stats = { totalUsers: 0, pendingDeposits: 0, pendingWithdrawals: 0 };
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
};
