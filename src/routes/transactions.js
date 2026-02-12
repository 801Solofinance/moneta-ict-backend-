// src/routes/transactions.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const axios = require('axios');

const { Transaction, User } = require('../models');
const { authenticate } = require('../middleware/auth'); // adjust path if needed

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

router.post('/deposit', authenticate, async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const userId = req.userId; // ✅ FIXED

    if (!amount || !currency) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    const transactionId = `DEP${Date.now()}${userId}`;

    const transaction = await Transaction.create({
      userId,
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
    res.status(500).json({ success: false, message: 'Deposit error' });
  }
});

// ===============================
// UPLOAD PAYMENT PROOF
// ===============================

router.post('/:transactionId/upload-proof', authenticate, upload.single('paymentProof'), async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.userId; // ✅ FIXED

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const transaction = await Transaction.findOne({
      where: { id: transactionId, userId }
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const paymentProofUrl = `/uploads/payment-proofs/${req.file.filename}`;

    await transaction.update({
      paymentProofUrl,
      status: 'REVIEWING'
    });

    const user = await User.findByPk(userId);

    // Send Telegram notification
    await axios.post(`${process.env.BACKEND_URL}/api/notify-deposit`, {
      userId: user.id,
      userName: user.username,
      userEmail: user.email,
      userPhone: user.phone || '',
      amount: transaction.amount,
      country: user.country,
      transactionId: transaction.id,
      proofImageUrl: `${process.env.BACKEND_URL}${paymentProofUrl}`,
      proofFileName: req.file.filename,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Proof uploaded and sent to admin'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Upload error' });
  }
});

// ===============================
// APPROVE
// ===============================

router.post('/:transactionId/approve', async (req, res) => {
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
    console.error(error);
    res.status(500).json({ success: false });
  }
});

// ===============================
// REJECT
// ===============================

router.post('/:transactionId/reject', async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findByPk(transactionId);

    if (!transaction) {
      return res.status(404).json({ success: false });
    }

    await transaction.update({ status: 'REJECTED' });

    res.json({ success: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
