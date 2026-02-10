const User = require('../models/User');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.updateProfile(req.userId, { name, phone });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

exports.getReferrals = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const referrals = await User.getReferrals(user.referral_code);
    res.json({ referrals, count: referrals.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get referrals' });
  }
};
