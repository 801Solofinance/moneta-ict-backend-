const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Withdrawal = sequelize.define('Withdrawal', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    transactionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    userId: {
      type: DataTypes.INTEGER,
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
      type: DataTypes.ENUM('PENDING', 'COMPLETED', 'REJECTED'),
      defaultValue: 'PENDING'
    },

    bankName: {
      type: DataTypes.STRING,
      allowNull: true
    },

    accountNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },

    accountType: {
      type: DataTypes.STRING,
      allowNull: true
    }

  }, {
    tableName: 'withdrawals',
    timestamps: true
  });

  return Withdrawal;
};
