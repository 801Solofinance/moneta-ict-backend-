const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);
router.get('/referrals', userController.getReferrals);

module.exports = router;
