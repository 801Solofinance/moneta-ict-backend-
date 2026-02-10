// backend/services/welcome-bonus.js
// Welcome Bonus Service - Auto-credit on registration

/**
 * Country-specific welcome bonuses
 */
const WELCOME_BONUSES = {
  PE: { amount: 10, currency: 'PEN', name: 'Peru' },      // Peru - 10 soles
  US: { amount: 5, currency: 'USD', name: 'United States' },
  GB: { amount: 5, currency: 'GBP', name: 'United Kingdom' },
  EU: { amount: 5, currency: 'EUR', name: 'European Union' },
  MX: { amount: 100, currency: 'MXN', name: 'Mexico' },
  BR: { amount: 25, currency: 'BRL', name: 'Brazil' },
  AR: { amount: 500, currency: 'ARS', name: 'Argentina' },
  CL: { amount: 5000, currency: 'CLP', name: 'Chile' },
  CO: { amount: 20000, currency: 'COP', name: 'Colombia' },
  DEFAULT: { amount: 5, currency: 'USD', name: 'Default' }
};

/**
 * Credit welcome bonus to new user
 * @param {Object} user - User object
 * @param {string} country - User's country code (ISO 2-letter)
 * @returns {Promise<Object>} Bonus details
 */
async function creditWelcomeBonus(user, country = 'DEFAULT') {
  try {
    // Get bonus amount for country
    const bonus = WELCOME_BONUSES[country] || WELCOME_BONUSES.DEFAULT;

    // Update user balance
    const currentBalance = parseFloat(user.balance) || 0;
    const newBalance = currentBalance + bonus.amount;

    await user.update({
      balance: newBalance,
      currency: bonus.currency,
      welcomeBonusCredited: true,
      country: country
    });

    // Create transaction record for welcome bonus
    const transaction = await Transaction.create({
      userId: user.id,
      transactionId: `WB${Date.now()}${user.id}`,
      type: 'WELCOME_BONUS',
      amount: bonus.amount,
      currency: bonus.currency,
      status: 'COMPLETED',
      description: `Welcome Bonus - ${bonus.name}`,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`✅ Welcome bonus credited to user ${user.id}: ${bonus.currency} ${bonus.amount}`);

    return {
      success: true,
      bonus: {
        amount: bonus.amount,
        currency: bonus.currency,
        country: bonus.name
      },
      newBalance,
      transaction
    };
  } catch (error) {
    console.error('Error crediting welcome bonus:', error);
    throw error;
  }
}

/**
 * Detect user's country from IP address
 * @param {string} ipAddress - User's IP address
 * @returns {Promise<string>} Country code
 */
async function detectCountryFromIP(ipAddress) {
  try {
    // Use a geolocation API (e.g., ipapi.co, ip-api.com)
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
    const data = await response.json();
    
    return data.country_code || 'DEFAULT';
  } catch (error) {
    console.error('Error detecting country:', error);
    return 'DEFAULT';
  }
}

/**
 * Integration with user registration
 * Call this function after user registration is complete
 */
async function handleUserRegistration(user, ipAddress) {
  try {
    // Detect country
    const country = await detectCountryFromIP(ipAddress);

    // Credit welcome bonus
    const bonusResult = await creditWelcomeBonus(user, country);

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        balance: bonusResult.newBalance,
        currency: bonusResult.bonus.currency
      },
      welcomeBonus: bonusResult.bonus
    };
  } catch (error) {
    console.error('Error handling user registration:', error);
    // Don't fail registration if bonus fails
    return {
      success: false,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        balance: user.balance || 0,
        currency: user.currency || 'USD'
      },
      error: 'Failed to credit welcome bonus'
    };
  }
}

module.exports = {
  creditWelcomeBonus,
  detectCountryFromIP,
  handleUserRegistration,
  WELCOME_BONUSES
};
