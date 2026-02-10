const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate, requireAdmin);
router.get('/deposits/pending', adminController.getPendingDeposits);
router.patch('/deposits/:id/approve', adminController.approveDeposit);
router.patch('/deposits/:id/reject', adminController.rejectDeposit);
router.get('/withdrawals/pending', adminController.getPendingWithdrawals);
router.patch('/withdrawals/:id/approve', adminController.approveWithdrawal);
router.patch('/withdrawals/:id/reject', adminController.rejectWithdrawal);
router.get('/users', adminController.getUsers);
router.get('/stats', adminController.getStats);

module.exports = router;
