// backend/routes/transactions.js
// API routes for deposit and transaction management

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { sendDepositNotification } = require('../telegram-bot');

// Import your database models (adjust based on your setup)
// const { Transaction, User } = require('../models');

// Configure multer for payment proof uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/payment-proofs/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'proof-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

/**
 * CREATE DEPOSIT
 * POST /api/transactions/deposit
 * Body: { amount, currency }
 */
router.post('/deposit', async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const userId = req.user.id; // From authentication middleware

    // Validate amount
    const minAmount = 10; // Set minimum based on currency
    if (amount < minAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum deposit amount is ${currency} ${minAmount}`
      });
    }

    // Generate unique transaction ID and reference
    const transactionId = `DEP${Date.now()}${userId}`;
    const reference = `REF${Date.now()}`;

    // Create transaction record
    const transaction = await Transaction.create({
      transactionId,
      userId,
      type: 'DEPOSIT',
      amount,
      currency,
      status: 'PENDING',
      reference,
      paymentProofUrl: null,
      reviewTimerStart: null,
      reviewTimerEnd: null,
      createdAt: new Date()
    });

    res.json({
      success: true,
      transaction: {
        id: transaction.id,
        transactionId,
        reference,
        amount,
        currency,
        accountDetails: {
          bankName: process.env.BANK_NAME || 'Sample Bank',
          accountNumber: process.env.ACCOUNT_NUMBER || '1234567890',
          accountName: process.env.ACCOUNT_NAME || 'MONETA-ICT'
        }
      }
    });
  } catch (error) {
    console.error('Error creating deposit:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating deposit'
    });
  }
});

/**
 * UPLOAD PAYMENT PROOF
 * POST /api/transactions/:transactionId/upload-proof
 */
router.post('/:transactionId/upload-proof', upload.single('paymentProof'), async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Find transaction
    const transaction = await Transaction.findOne({
      where: { transactionId, userId }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Update transaction with payment proof
    const paymentProofUrl = `/uploads/payment-proofs/${req.file.filename}`;
    const reviewStart = new Date();
    const reviewEnd = new Date(reviewStart.getTime() + 5 * 60000); // 5 minutes

    await transaction.update({
      paymentProofUrl,
      reviewTimerStart: reviewStart,
      reviewTimerEnd: reviewEnd,
      status: 'REVIEWING'
    });

    // Get user details
    const user = await User.findByPk(userId);

    // Send notification to admin via Telegram
    await sendDepositNotification({
      transactionId: transaction.transactionId,
      userId: user.id,
      username: user.username,
      amount: transaction.amount,
      currency: transaction.currency,
      paymentProofUrl: `${process.env.APP_URL}${paymentProofUrl}`,
      timestamp: transaction.createdAt
    });

    res.json({
      success: true,
      message: 'Payment proof uploaded successfully',
      reviewTimerEnd: reviewEnd
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading payment proof'
    });
  }
});

/**
 * CHECK TRANSACTION STATUS
 * GET /api/transactions/:transactionId/status
 */
router.get('/:transactionId/status', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;

    const transaction = await Transaction.findOne({
      where: { transactionId, userId }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    });
  } catch (error) {
    console.error('Error checking status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking transaction status'
    });
  }
});

/**
 * APPROVE TRANSACTION (Admin/Telegram Bot)
 * POST /api/transactions/:transactionId/approve
 */
router.post('/:transactionId/approve', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { adminId, timestamp } = req.body;

    // Find transaction
    const transaction = await Transaction.findOne({
      where: { transactionId }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Update user balance
    const user = await User.findByPk(transaction.userId);
    const newBalance = parseFloat(user.balance) + parseFloat(transaction.amount);

    await user.update({
      balance: newBalance
    });

    // Update transaction status
    await transaction.update({
      status: 'COMPLETED',
      adminActionTimestamp: timestamp,
      adminUserId: adminId
    });

    // Emit real-time update via WebSocket (if implemented)
    // io.to(user.id).emit('balance_update', { balance: newBalance });
    // io.to(user.id).emit('transaction_update', { transactionId, status: 'COMPLETED' });

    res.json({
      success: true,
      message: 'Transaction approved successfully',
      newBalance
    });
  } catch (error) {
    console.error('Error approving transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving transaction'
    });
  }
});

/**
 * REJECT TRANSACTION (Admin/Telegram Bot)
 * POST /api/transactions/:transactionId/reject
 */
router.post('/:transactionId/reject', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { adminId, timestamp } = req.body;

    // Find transaction
    const transaction = await Transaction.findOne({
      where: { transactionId }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Update transaction status
    await transaction.update({
      status: 'REJECTED',
      adminActionTimestamp: timestamp,
      adminUserId: adminId
    });

    // Emit real-time update via WebSocket
    // io.to(transaction.userId).emit('transaction_update', { 
    //   transactionId, 
    //   status: 'REJECTED' 
    // });

    res.json({
      success: true,
      message: 'Transaction rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting transaction'
    });
  }
});

/**
 * GET USER TRANSACTIONS
 * GET /api/transactions
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0, type } = req.query;

    const whereClause = { userId };
    if (type) whereClause.type = type;

    const transactions = await Transaction.findAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions'
    });
  }
});

module.exports = router;
