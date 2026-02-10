// backend/services/welcome-bonus.js
// Welcome Bonus Service - Auto-credit on registration

const { Transaction } = require('../models'); // adjust if your path differs

/**
 * Country-specific welcome bonuses
 * Only Colombia and Peru supported
 */
const WELCOME_BONUSES = {
  CO: { amount: 12000, currency: 'COP', name: 'Colombia' },
  PE: { amount: 10, currency: 'PEN', name: 'Peru' }
};

/**
 * Credit welcome bonus to new user
 * @param {Object} user - Sequelize user instance
 * @param {string} country - 'CO' or 'PE'
 * @returns {Promise<Object>}
 */
async function creditWelcomeBonus(user, country) {
  try {
    // Validate supported country
    if (!WELCOME_BONUSES[country]) {
      throw new Error('Unsupported country for welcome bonus');
    }

    const bonus = WELCOME_BONUSES[country];

    // Prevent double credit
    if (user.welcomeBonusCredited) {
      return {
        success: false,
        message: 'Welcome bonus already credited'
      };
    }

    // Calculate new balance
    const currentBalance = parseFloat(user.balance) || 0;
    const newBalance = currentBalance + bonus.amount;

    // Update user
    await user.update({
      balance: newBalance,
      currency: bonus.currency,
      country: country,
      welcomeBonusCredited: true
    });

    // Create transaction record
    const transaction = await Transaction.create({
      userId: user.id,
      transactionId: `WB${Date.now()}${user.id}`,
      type: 'WELCOME_BONUS',
      amount: bonus.amount,
      currency: bonus.currency,
      status: 'COMPLETED',
      description: `Welcome Bonus - ${bonus.name}`
    });

    console.log(
      `✅ Welcome bonus credited: User ${user.id} → ${bonus.currency} ${bonus.amount}`
    );

    return {
      success: true,
      bonus: bonus,
      newBalance,
      transaction
    };
  } catch (error) {
    console.error('❌ Error crediting welcome bonus:', error);
    throw error;
  }
}

module.exports = {
  creditWelcomeBonus
};
