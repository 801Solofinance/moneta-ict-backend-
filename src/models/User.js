// src/models/User.js

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false
    },

    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },

    country: {
      type: DataTypes.ENUM('CO', 'PE'),
      allowNull: false
    },

    // 🔐 NEW: Role system
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user'
    },

    balance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },

    currency: {
      type: DataTypes.STRING,
      allowNull: false
    },

    welcomeBonusCredited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }

  }, {
    tableName: 'users',
    timestamps: true
  });

  return User;
};
