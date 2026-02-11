// src/services/welcome-bonus.js

/*
  MONETA-ICT
  Welcome Bonus Service

  Colombia  → 12,000 COP
  Peru      → 10 PEN
*/

async function handleUserRegistration(user) {
  try {
    let bonusAmount = 0;
    let currency = 'COP';

    if (user.country === 'PE') {
      bonusAmount = 10;
      currency = 'PEN';
    } else if (user.country === 'CO') {
      bonusAmount = 12000;
      currency = 'COP';
    }

    const currentBalance = parseFloat(user.balance || 0);
    const newBalance = currentBalance + bonusAmount;

    await user.update({
      balance: newBalance,
      currency: currency,
      welcomeBonusCredited: true
    });

    return {
      success: true,
      user,
      welcomeBonus: {
        amount: bonusAmount,
        currency
      }
    };

  } catch (error) {
    console.error('Welcome bonus error:', error);
    throw error;
  }
}

module.exports = {
  handleUserRegistration
};
