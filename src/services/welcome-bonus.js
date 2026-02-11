const { User, Transaction } = require('../models');

/**
 * Colombia & Peru only
 */
const WELCOME_BONUS = {
  CO: {
    amount: 12000,
    currency: 'COP'
  },
  PE: {
    amount: 10,
    currency: 'PEN'
  }
};

async function handleUserRegistration(user, countryCode) {
  try {
    const country = countryCode === 'CO' ? 'CO' : 'PE';

    const bonus = WELCOME_BONUS[country];

    const newBalance = parseFloat(user.balance) + bonus.amount;

    await user.update({
      balance: newBalance,
      currency: bonus.currency,
      country: country,
      welcomeBonusCredited: true
    });

    await Transaction.create({
      userId: user.id,
      type: 'WELCOME_BONUS',
      amount: bonus.amount,
      currency: bonus.currency,
      status: 'COMPLETED',
      description: 'Welcome Bonus'
    });

    return {
      user,
      welcomeBonus: bonus
    };

  } catch (error) {
    console.error('Welcome bonus error:', error);
    throw error;
  }
}

module.exports = { handleUserRegistration };
