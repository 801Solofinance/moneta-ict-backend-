// src/routes/transactions.js

const express = require('express');
const router = express.Router();
const { Transaction, User } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

// =====================================
// CREATE DEPOSIT
// =====================================

router.post('/deposit', authenticate, async (req, res) => {
  try {
    const { amount, currency } = req.body;

    if (!amount || !currency) {
      return res.status(400).json({
        success: false,
        message: 'Missing amount or currency'
      });
    }

    const transactionId = `DEP${Date.now()}${req.user.id}`;

    const transaction = await Transaction.create({
      transactionId,
      userId: req.user.id,
      type: 'DEPOSIT',
      amount,
      currency,
      status: 'PENDING'
    });

    res.json({
      success: true,
      transaction
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});


// =====================================
// GET USER TRANSACTIONS
// =====================================

router.get('/', authenticate, async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      transactions
    });

  } catch (error) {
    res.status(500).json({ success: false });
  }
});


// =====================================
// CHECK STATUS
// =====================================

router.get('/:transactionId/status', authenticate, async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findOne({
      where: {
        transactionId,
        userId: req.user.id
      }
    });

    if (!transaction) {
      return res.status(404).json({ success: false });
    }

    res.json({
      success: true,
      status: transaction.status
    });

  } catch (error) {
    res.status(500).json({ success: false });
  }
});


// =====================================
// ADMIN APPROVE
// =====================================

router.post('/:transactionId/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findOne({
      where: { transactionId }
    });

    if (!transaction || transaction.status !== 'PENDING') {
      return res.status(400).json({ success: false });
    }

    const user = await User.findByPk(transaction.userId);

    await user.update({
      balance: parseFloat(user.balance) + parseFloat(transaction.amount)
    });

    await transaction.update({ status: 'COMPLETED' });

    res.json({
      success: true,
      message: 'Deposit approved'
    });

  } catch (error) {
    res.status(500).json({ success: false });
  }
});


// =====================================
// ADMIN REJECT
// =====================================

router.post('/:transactionId/reject', authenticate, requireAdmin, async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findOne({
      where: { transactionId }
    });

    if (!transaction || transaction.status !== 'PENDING') {
      return res.status(400).json({ success: false });
    }

    await transaction.update({ status: 'REJECTED' });

    res.json({
      success: true,
      message: 'Deposit rejected'
    });

  } catch (error) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
