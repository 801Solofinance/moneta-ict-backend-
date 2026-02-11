// src/routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

const { User } = require('../models');
const { handleUserRegistration } = require('../services/welcome-bonus');

/* ==================================================
   PASSWORD VALIDATION
================================================== */

function validatePassword(password) {
  const minLength = password.length >= 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const isValid =
    minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumber &&
    hasSpecialChar;

  return {
    isValid,
    requirements: {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
    },
  };
}

/* ==================================================
   REGISTER
================================================== */

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName, country } = req.body;

    if (!username || !email || !password || !country) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, password and country are required',
      });
    }

    const passwordValidation = validatePassword(password);

    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        requirements: passwordValidation.requirements,
      });
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      fullName: fullName || username,
      balance: 0,
      currency: 'COP',
      welcomeBonusCredited: false,
    });

    // Apply welcome bonus (CO = 12000, PE = 10)
    const result = await handleUserRegistration(user, country);

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        fullName: result.user.fullName,
        balance: result.user.balance,
        currency: result.user.currency,
      },
      welcomeBonus: result.welcomeBonus,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
});

/* ==================================================
   LOGIN
================================================== */

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password required',
      });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email: username }],
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '30d' }
    );

    return res.json({
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
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
});

module.exports = router;
