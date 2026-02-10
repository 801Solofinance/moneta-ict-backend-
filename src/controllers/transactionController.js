const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { sendDepositNotification } = require('../utils/telegram');

exports.createDeposit = async (req, res) => {
  try {
    const { amount, currency } = req.body;
    let proofUrl = null;
    if (req.file) proofUrl = await uploadToCloudinary(req.file);
    
    const deposit = await Deposit.create({ userId: req.userId, amount, currency, proofUrl });
    const user = await User.findById(req.userId);
    await sendDepositNotification(deposit, user);
    
    res.status(201).json({ deposit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create deposit' });
  }
};

exports.getDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.findByUserId(req.userId);
    res.json({ deposits });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get deposits' });
  }
};

exports.createWithdrawal = async (req, res) => {
  try {
    const { amount, currency, bankName, accountNumber, accountType } = req.body;
    const user = await User.findById(req.userId);
    if (user.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });
    
    await User.updateBalance(req.userId, -amount);
    const withdrawal = await Withdrawal.create({ userId: req.userId, amount, currency, bankName, accountNumber, accountType });
    
    res.status(201).json({ withdrawal });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create withdrawal' });
  }
};

exports.getWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.findByUserId(req.userId);
    res.json({ withdrawals });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get withdrawals' });
  }
};

exports.createInvestment = async (req, res) => {
  try {
    const { planId, planName, amount, dailyReturn, durationDays } = req.body;
    const user = await User.findById(req.userId);
    if (user.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });
    
    const investment = await Investment.create({ userId: req.userId, planId, planName, amount, dailyReturn, durationDays });
    res.status(201).json({ investment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create investment' });
  }
};

exports.getInvestments = async (req, res) => {
  try {
    const investments = await Investment.findByUserId(req.userId);
    res.json({ investments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get investments' });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const transactions = await Transaction.findByUserId(req.userId);
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get history' });
  }
};
