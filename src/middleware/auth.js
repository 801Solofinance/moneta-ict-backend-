const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    );

    req.user = decoded; // 👈 THIS IS IMPORTANT

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
