const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DATABASE_URL,
  {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
);

// Import models
const User = require('./User')(sequelize);
const Transaction = require('./Transaction')(sequelize);
const Deposit = require('./Deposit')(sequelize);
const Withdrawal = require('./Withdrawal')(sequelize);
const Investment = require('./Investment')(sequelize);

// Associations
User.hasMany(Transaction, { foreignKey: 'userId' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Deposit, { foreignKey: 'userId' });
Deposit.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Withdrawal, { foreignKey: 'userId' });
Withdrawal.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Investment, { foreignKey: 'userId' });
Investment.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Transaction,
  Deposit,
  Withdrawal,
  Investment
};
