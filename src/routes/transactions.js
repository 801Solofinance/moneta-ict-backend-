// src/routes/transactions.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const axios = require('axios');

const { Transaction, User } = require('../models');
const { authenticate } = require('../middleware/auth'); // ✅ FIXED

// ===============================
// Multer Setup
// ===============================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/payment-proofs/');
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'proof-' + unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

// ===============================
// CREATE DEPOSIT
// ===============================

const { authenticate } = require('../middleware/auth');

router.post('/deposit', authenticate, async (req, res) => {
  try {
    const { amount, currency } = req.body;

    if (!amount || !currency) {
      return res.status(400).json({
        success: false,
        message: 'Missing amount or currency'
      });
    }

    const transaction = await Transaction.create({
      transactionId: `DEP${Date.now()}${req.user.id}`,
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
    res.status(500).json({
      success: false,
      message: 'Deposit error'
    });
  }
});

// ===============================
// UPLOAD PAYMENT PROOF
// ===============================

router.post('/:transactionId/upload-proof',
  authenticate,
  upload.single('paymentProof'),
  async (req, res) => {
    try {
      const { transactionId } = req.params;
      const userId = req.userId;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const transaction = await Transaction.findOne({
        where: { id: transactionId, userId }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      const paymentProofUrl = `/uploads/payment-proofs/${req.file.filename}`;

      await transaction.update({
        status: 'REVIEWING'
      });

      const user = await User.findByPk(userId);

      // Optional Telegram notify
      if (process.env.BACKEND_URL) {
        await axios.post(`${process.env.BACKEND_URL}/api/notify-deposit`, {
          userId: user.id,
          username: user.username,
          amount: transaction.amount,
          transactionId: transaction.id,
          proofUrl: `${process.env.BACKEND_URL}${paymentProofUrl}`
        });
      }

      res.json({
        success: true,
        message: 'Proof uploaded successfully'
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Upload error'
      });
    }
  }
);

// ===============================
// APPROVE DEPOSIT
// ===============================

router.post('/:transactionId/approve', authenticate, async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findByPk(transactionId);

    if (!transaction) {
      return res.status(404).json({ success: false });
    }

    const user = await User.findByPk(transaction.userId);

    const newBalance =
      parseFloat(user.balance) + parseFloat(transaction.amount);

    await user.update({ balance: newBalance });

    await transaction.update({ status: 'COMPLETED' });

    res.json({
      success: true,
      newBalance
    });

  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ success: false });
  }
});

// ===============================
// REJECT DEPOSIT
// ===============================

router.post('/:transactionId/reject', authenticate, async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findByPk(transactionId);

    if (!transaction) {
      return res.status(404).json({ success: false });
    }

    await transaction.update({ status: 'REJECTED' });

    res.json({ success: true });

  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
