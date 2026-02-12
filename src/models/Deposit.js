const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Deposit = sequelize.define('Deposit', {
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
      type: DataTypes.ENUM('PENDING', 'REVIEWING', 'COMPLETED', 'REJECTED'),
      defaultValue: 'PENDING'
    },

    paymentProofUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },

    reference: {
      type: DataTypes.STRING,
      allowNull: true
    }

  }, {
    tableName: 'deposits',
    timestamps: true
  });

  return Deposit;
};
