// src/services/welcome-bonus.js

/**
 * Welcome bonus amounts
 * Only Colombia & Peru supported
 */
const WELCOME_BONUSES = {
  CO: { amount: 12000, currency: 'COP' },
  PE: { amount: 10, currency: 'PEN' }
};

/**
 * Apply welcome bonus to user
 * @param {Object} user
 */
function applyWelcomeBonus(user) {
  if (!user) return user;

  // Prevent double bonus
  if (user.welcomeBonusApplied) {
    return user;
  }

  const country = user.country === 'PE' ? 'PE' : 'CO';
  const bonus = WELCOME_BONUSES[country];

  const currentBalance = parseFloat(user.balance || 0);
  const newBalance = currentBalance + bonus.amount;

  return {
    ...user,
    balance: newBalance,
    currency: bonus.currency,
    welcomeBonusApplied: true
  };
}

module.exports = {
  applyWelcomeBonus
};
