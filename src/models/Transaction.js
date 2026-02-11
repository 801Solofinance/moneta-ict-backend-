// src/models/Transaction.js

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    type: {
      type: DataTypes.STRING,
      allowNull: false
    },

    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },

    currency: {
      type: DataTypes.STRING,
      allowNull: false
    },

    status: {
      type: DataTypes.STRING,
      defaultValue: 'PENDING'
    },

    description: {
      type: DataTypes.STRING
    }

  }, {
    tableName: 'transactions',
    timestamps: true
  });

  return Transaction;
};
