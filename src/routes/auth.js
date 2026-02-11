// src/routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

const { User } = require('../models');
const { handleUserRegistration } = require('../services/welcome-bonus');

/*
  PASSWORD VALIDATION
*/
function validatePassword(password) {
  const minLength = password.length >= 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);

  return minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
}

/*
  REGISTER
*/
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName, country } = req.body;

    if (!username || !email || !password || !country) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password too weak'
      });
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      fullName: fullName || username,
      country,
      balance: 0,
      currency: country === '
