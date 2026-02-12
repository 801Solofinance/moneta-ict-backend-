const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token' });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    );

    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false });
    }

    req.user = user;
    next();

  } catch (err) {
    return res.status(401).json({ success: false });
  }
};

exports.requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin only'
    });
  }

  next();
};
