const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(authenticate);
router.post('/deposit', upload.single('proof'), transactionController.createDeposit);
router.get('/deposits', transactionController.getDeposits);
router.post('/withdraw', transactionController.createWithdrawal);
router.get('/withdrawals', transactionController.getWithdrawals);
router.post('/invest', transactionController.createInvestment);
router.get('/investments', transactionController.getInvestments);
router.get('/history', transactionController.getHistory);

module.exports = router;
