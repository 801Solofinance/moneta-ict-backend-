// src/models/index.js

const { Sequelize } = require('sequelize');
const UserModel = require('./User');
const TransactionModel = require('./Transaction');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false
  }
);

const User = UserModel(sequelize);
const Transaction = TransactionModel(sequelize);

// Associations
User.hasMany(Transaction, { foreignKey: 'userId' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Transaction
};
