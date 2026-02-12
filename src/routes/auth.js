const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize');

// ============================
// REGISTER
// ============================

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName, country } = req.body;

    if (!username || !email || !password || !country) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or Email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const currency = country === 'CO' ? 'COP' : 'PEN';

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      fullName,
      country,
      currency,
      balance: 0
    });

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    res.json({
  success: true,
  message: 'Login successful',
  token,
  user: {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    balance: user.balance,
    currency: user.currency,
    country: user.country
  }
});

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// ============================
// LOGIN
// ============================

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password required'
      });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email: username }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

module.exports = router;
