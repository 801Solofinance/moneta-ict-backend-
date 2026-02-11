// backend/routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize'); // IMPORTANT

// ✅ FIX: Properly import your User model
const { User } = require('../models'); 

// ✅ FIX: Correct welcome bonus import
const { applyWelcomeBonus } = require('../services/welcome-bonus');

/* =========================
   PASSWORD VALIDATION
========================= */

function validatePassword(password) {
  const minLength = password.length >= 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  return {
    isValid: minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar
  };
}

/* =========================
   REGISTER
========================= */

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName, country } = req.body;

    if (!username || !email || !password || !country) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements'
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

    let user = await User.create({
      username,
      email,
      password: hashedPassword,
      fullName,
      country,
      balance: 0,
      currency: country === 'PE' ? 'PEN' : 'COP'
    });

    // ✅ APPLY WELCOME BONUS
    const updatedUser = applyWelcomeBonus(user);

    await user.update({
      balance: updatedUser.balance,
      currency: updatedUser.currency,
      welcomeBonusApplied: true
    });

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'supersecret',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        balance: user.balance,
        currency: user.currency
      }
    });

  } catch (error) {
    console.error('REGISTER ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/* =========================
   LOGIN
========================= */

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

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

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'supersecret',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        balance: user.balance,
        currency: user.currency
      }
    });

  } catch (error) {
    console.error('LOGIN ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
