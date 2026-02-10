// backend/telegram-bot.js
// Telegram Bot Integration for Transaction Approvals

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Initialize bot with your bot token
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const ADMIN_CHAT_ID = process.env.ADMIN_TELEGRAM_ID || 'YOUR_ADMIN_CHAT_ID';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Store pending transactions for callback reference
const pendingTransactions = new Map();

/**
 * Send deposit notification to admin with approve/reject buttons
 * @param {Object} depositData - Deposit transaction data
 * @returns {Promise<boolean>} Success status
 */
async function sendDepositNotification(depositData) {
  const {
    transactionId,
    userId,
    username,
    amount,
    currency,
    paymentProofUrl,
    timestamp
  } = depositData;

  try {
    // Store transaction data
    pendingTransactions.set(transactionId, depositData);

    // Format message
    const message = `
🔔 *NEW DEPOSIT REQUEST*

👤 *User:* ${username} (#${userId})
💰 *Amount:* ${currency} ${amount.toFixed(2)}
⏰ *Time:* ${new Date(timestamp).toLocaleString()}
🔖 *Transaction ID:* #${transactionId}

⬇️ *Payment Proof Below* ⬇️
    `.trim();

    // Inline keyboard with Approve/Reject buttons
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '✅ Approve',
            callback_data: `approve_${transactionId}`
          },
          {
            text: '❌ Reject',
            callback_data: `reject_${transactionId}`
          }
        ],
        [
          {
            text: '👤 View User Profile',
            callback_data: `profile_${userId}`
          }
        ]
      ]
    };

    // Send message
    await bot.sendMessage(ADMIN_CHAT_ID, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

    // Send payment proof image
    if (paymentProofUrl) {
      await bot.sendPhoto(ADMIN_CHAT_ID, paymentProofUrl, {
        caption: `Payment proof for Transaction #${transactionId}`
      });
    }

    return true;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return false;
  }
}

/**
 * Handle callback queries (button presses)
 */
bot.on('callback_query', async (callbackQuery) => {
  const { data, message } = callbackQuery;
  const chatId = message.chat.id;

  try {
    // Parse callback data
    const [action, id] = data.split('_');

    switch (action) {
      case 'approve':
        await handleApproval(id, chatId, message.message_id);
        break;
      case 'reject':
        await handleRejection(id, chatId, message.message_id);
        break;
      case 'profile':
        await handleProfileView(id, chatId);
        break;
    }

    // Answer callback to remove loading state
    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    console.error('Error handling callback:', error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '❌ Error processing request',
      show_alert: true
    });
  }
});

/**
 * Handle deposit approval
 */
async function handleApproval(transactionId, chatId, messageId) {
  const transaction = pendingTransactions.get(transactionId);

  if (!transaction) {
    await bot.sendMessage(chatId, '❌ Transaction not found or already processed');
    return;
  }

  try {
    // Call your API to approve the transaction
    const response = await axios.post(
      `${process.env.API_URL}/api/transactions/${transactionId}/approve`,
      {
        adminId: 'telegram_admin',
        timestamp: new Date().toISOString()
      }
    );

    if (response.data.success) {
      // Update message to show approval
      const approvedMessage = `
✅ *DEPOSIT APPROVED*

👤 *User:* ${transaction.username} (#${transaction.userId})
💰 *Amount:* ${transaction.currency} ${transaction.amount.toFixed(2)}
🔖 *Transaction ID:* #${transactionId}
⏰ *Approved at:* ${new Date().toLocaleString()}

✨ User's balance has been updated!
      `.trim();

      await bot.editMessageText(approvedMessage, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown'
      });

      // Remove from pending
      pendingTransactions.delete(transactionId);

      // Send confirmation
      await bot.sendMessage(chatId, '✅ Transaction approved successfully!');
    }
  } catch (error) {
    console.error('Error approving transaction:', error);
    await bot.sendMessage(chatId, '❌ Error approving transaction. Please try again.');
  }
}

/**
 * Handle deposit rejection
 */
async function handleRejection(transactionId, chatId, messageId) {
  const transaction = pendingTransactions.get(transactionId);

  if (!transaction) {
    await bot.sendMessage(chatId, '❌ Transaction not found or already processed');
    return;
  }

  try {
    // Call your API to reject the transaction
    const response = await axios.post(
      `${process.env.API_URL}/api/transactions/${transactionId}/reject`,
      {
        adminId: 'telegram_admin',
        timestamp: new Date().toISOString()
      }
    );

    if (response.data.success) {
      // Update message to show rejection
      const rejectedMessage = `
❌ *DEPOSIT REJECTED*

👤 *User:* ${transaction.username} (#${transaction.userId})
💰 *Amount:* ${transaction.currency} ${transaction.amount.toFixed(2)}
🔖 *Transaction ID:* #${transactionId}
⏰ *Rejected at:* ${new Date().toLocaleString()}

⚠️ User has been notified.
      `.trim();

      await bot.editMessageText(rejectedMessage, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown'
      });

      // Remove from pending
      pendingTransactions.delete(transactionId);

      // Send confirmation
      await bot.sendMessage(chatId, '❌ Transaction rejected.');
    }
  } catch (error) {
    console.error('Error rejecting transaction:', error);
    await bot.sendMessage(chatId, '❌ Error rejecting transaction. Please try again.');
  }
}

/**
 * Handle user profile view
 */
async function handleProfileView(userId, chatId) {
  try {
    // Fetch user data from your API
    const response = await axios.get(
      `${process.env.API_URL}/api/admin/users/${userId}`
    );

    const user = response.data.user;

    const profileMessage = `
👤 *USER PROFILE*

*Name:* ${user.fullName || user.username}
*Username:* @${user.username}
*Email:* ${user.email}
*User ID:* #${userId}

💰 *Balance:* ${user.currency} ${user.balance.toFixed(2)}
📊 *Total Deposits:* ${user.currency} ${user.totalDeposits.toFixed(2)}
📤 *Total Withdrawals:* ${user.currency} ${user.totalWithdrawals.toFixed(2)}

📅 *Registered:* ${new Date(user.createdAt).toLocaleDateString()}
🏳️ *Country:* ${user.country || 'N/A'}
    `.trim();

    await bot.sendMessage(chatId, profileMessage, {
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    await bot.sendMessage(chatId, '❌ Error fetching user profile');
  }
}

/**
 * Send notification to user about transaction status
 */
async function notifyUser(userId, message, telegramUserId = null) {
  if (!telegramUserId) {
    // Fetch user's Telegram ID from database if not provided
    // This would require users to link their Telegram account
    return false;
  }

  try {
    await bot.sendMessage(telegramUserId, message, {
      parse_mode: 'Markdown'
    });
    return true;
  } catch (error) {
    console.error('Error notifying user:', error);
    return false;
  }
}

// Export functions
module.exports = {
  bot,
  sendDepositNotification,
  notifyUser
};

// Handle bot errors
bot.on('polling_error', (error) => {
  console.error('Telegram bot polling error:', error);
});

console.log('💬 Telegram Bot is running...');
