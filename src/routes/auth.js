// src/routes/auth.js

const { User } = require('../models');
const { Op } = require('sequelize');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, Transaction } = require('../models');

/*
|--------------------------------------------------------------------------
| PASSWORD VALIDATION
|--------------------------------------------------------------------------
*/

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
      hasSpecialChar
    }
  };
}

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName, country } = req.body;

    if (!username || !email || !password || !country) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, password and country are required'
      });
    }

    // Only allow CO or PE
    if (!['CO', 'PE'].includes(country)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid country. Only Colombia (CO) and Peru (PE) allowed.'
      });
    }

    const passwordValidation = validatePassword(password);

    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        requirements: passwordValidation.requirements
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
        message: 'Username or email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Country-based bonus
    const welcomeBonusAmount = country === 'CO' ? 12000 : 10;
    const currency = country === 'CO' ? 'COP' : 'PEN';

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      fullName: fullName || username,
      country,
      balance: welcomeBonusAmount,
      currency,
      welcomeBonusCredited: true
    });

    // Create bonus transaction
    await Transaction.create({
      userId: user.id,
      type: 'WELCOME_BONUS',
      amount: welcomeBonusAmount,
      currency,
      status: 'COMPLETED',
      description: 'Welcome Bonus',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email
      },
      process.env.JWT_SECRET || 'super-secret-key',
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
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
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/email and password required'
      });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email: username }]
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email
      },
      process.env.JWT_SECRET || 'super-secret-key',
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
        country: user.country
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

/*
|--------------------------------------------------------------------------
| PASSWORD VALIDATION ENDPOINT
|--------------------------------------------------------------------------
*/

router.post('/validate-password', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password required'
    });
  }

  const validation = validatePassword(password);

  return res.json({
    success: true,
    isValid: validation.isValid,
    requirements: validation.requirements
  });
});

module.exports = router;
