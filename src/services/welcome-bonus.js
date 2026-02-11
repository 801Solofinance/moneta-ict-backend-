// backend/services/welcome-bonus.js
// Welcome Bonus Service - Auto-credit on registration
// UPDATED: Colombia & Peru Only

/**
 * Country-specific welcome bonuses
 * CO = Colombia: 12,000 COP (Colombian Pesos)
 * PE = Peru: 10 PEN (Peruvian Soles)
 */
const WELCOME_BONUSES = {
  CO: { amount: 12000, currency: 'COP', name: 'Colombia', symbol: '$' },  // Colombia - 12,000 pesos
  PE: { amount: 10, currency: 'PEN', name: 'Peru', symbol: 'S/' },        // Peru - 10 soles
  DEFAULT: { amount: 10, currency: 'PEN', name: 'Default', symbol: 'S/' } // Default to Peru bonus
};

/**
 * Format currency display based on country
 */
function formatCurrency(amount, country) {
  const bonus = WELCOME_BONUSES[country] || WELCOME_BONUSES.DEFAULT;
  
  if (country === 'CO') {
    // Colombian Pesos format: $12.000 (with dots for thousands)
    return `${bonus.symbol}${amount.toLocaleString('es-CO')}`;
  } else if (country === 'PE') {
    // Peruvian Soles format: S/10.00
    return `${bonus.symbol}${amount.toFixed(2)}`;
  }
  
  return `${bonus.symbol}${amount.toFixed(2)}`;
}

/**
 * Credit welcome bonus to new user
 * @param {Object} user - User object
 * @param {string} country - User's country code (ISO 2-letter: CO or PE)
 * @returns {Promise<Object>} Bonus details
 */
async function creditWelcomeBonus(user, country = 'PE') {
  try {
    // Normalize country code to uppercase
    country = country.toUpperCase();
    
    // Only allow Colombia and Peru
    if (country !== 'CO' && country !== 'PE') {
      console.log(`⚠️ Country ${country} not supported, defaulting to Peru`);
      country = 'PE';
    }

    // Get bonus amount for country
    const bonus = WELCOME_BONUSES[country];

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

    console.log(`✅ Welcome bonus credited to user ${user.id}: ${formatCurrency(bonus.amount, country)} (${bonus.name})`);

    return {
      success: true,
      bonus: {
        amount: bonus.amount,
        currency: bonus.currency,
        country: bonus.name,
        formatted: formatCurrency(bonus.amount, country)
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
 * @returns {Promise<string>} Country code (CO or PE)
 */
async function detectCountryFromIP(ipAddress) {
  try {
    // Use a geolocation API (e.g., ipapi.co, ip-api.com)
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
    const data = await response.json();
    
    const countryCode = data.country_code || 'PE';
    
    // Only return CO or PE, default to PE for all others
    if (countryCode === 'CO' || countryCode === 'PE') {
      return countryCode;
    }
    
    console.log(`⚠️ User from ${countryCode}, defaulting to Peru bonus`);
    return 'PE'; // Default to Peru
  } catch (error) {
    console.error('Error detecting country:', error);
    return 'PE'; // Default to Peru on error
  }
}

/**
 * Manual country selection (if you want users to choose)
 * Validates that only Colombia or Peru can be selected
 */
function validateCountrySelection(country) {
  country = country.toUpperCase();
  if (country === 'CO' || country === 'PE') {
    return country;
  }
  throw new Error('Invalid country. Only Colombia (CO) and Peru (PE) are supported.');
}

/**
 * Get welcome bonus info for a country (for display purposes)
 */
function getWelcomeBonusInfo(country) {
  country = country.toUpperCase();
  const bonus = WELCOME_BONUSES[country] || WELCOME_BONUSES.DEFAULT;
  
  return {
    country: bonus.name,
    amount: bonus.amount,
    currency: bonus.currency,
    formatted: formatCurrency(bonus.amount, country),
    symbol: bonus.symbol
  };
}

/**
 * Integration with user registration
 * Call this function after user registration is complete
 */
async function handleUserRegistration(user, ipAddress) {
  try {
    // Detect country from IP
    const country = await detectCountryFromIP(ipAddress);
    
    console.log(`📍 User ${user.username} detected from ${country === 'CO' ? 'Colombia' : 'Peru'}`);

    // Credit welcome bonus
    const bonusResult = await creditWelcomeBonus(user, country);

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        balance: bonusResult.newBalance,
        currency: bonusResult.bonus.currency,
        country: country
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
        currency: user.currency || 'PEN'
      },
      error: 'Failed to credit welcome bonus'
    };
  }
}

/**
 * Get minimum deposit amount based on country
 */
function getMinimumDeposit(country) {
  country = country.toUpperCase();
  
  if (country === 'CO') {
    return { amount: 50000, currency: 'COP' }; // 50,000 COP minimum
  } else if (country === 'PE') {
    return { amount: 50, currency: 'PEN' }; // 50 PEN minimum
  }
  
  return { amount: 50, currency: 'PEN' }; // Default
}

module.exports = {
  creditWelcomeBonus,
  detectCountryFromIP,
  handleUserRegistration,
  validateCountrySelection,
  getWelcomeBonusInfo,
  formatCurrency,
  getMinimumDeposit,
  WELCOME_BONUSES
};
