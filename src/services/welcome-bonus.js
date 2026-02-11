// backend/services/welcome-bonus.js

const db = require('../database'); // <-- change if your DB file name is different

const WELCOME_BONUSES = {
  CO: { amount: 12000, currency: 'COP', name: 'Colombia' },
  PE: { amount: 10, currency: 'PEN', name: 'Peru' }
};

async function creditWelcomeBonus(user, country) {
  try {
    if (!WELCOME_BONUSES[country]) {
      throw new Error('Unsupported country');
    }

    const bonus = WELCOME_BONUSES[country];

    // prevent double credit
    if (user.welcome_bonus_credited) {
      return { success: false };
    }

    const newBalance = parseFloat(user.balance || 0) + bonus.amount;

    // Update user
    await db.query(
      `UPDATE users 
       SET balance = $1,
           currency = $2,
           welcome_bonus_credited = true
       WHERE id = $3`,
      [newBalance, bonus.currency, user.id]
    );

    // Insert transaction
    await db.query(
      `INSERT INTO transactions 
        (user_id, type, amount, currency, status, description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        user.id,
        'WELCOME_BONUS',
        bonus.amount,
        bonus.currency,
        'COMPLETED',
        `Welcome Bonus - ${bonus.name}`
      ]
    );

    return {
      success: true,
      amount: bonus.amount,
      currency: bonus.currency,
      newBalance
    };

  } catch (error) {
    console.error('Welcome bonus error:', error);
    throw error;
  }
}

module.exports = { creditWelcomeBonus };
