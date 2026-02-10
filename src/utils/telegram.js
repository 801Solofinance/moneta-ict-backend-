const TelegramBot = require('node-telegram-bot-api');

const bot = process.env.TELEGRAM_BOT_TOKEN 
  ? new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })
  : null;

exports.sendDepositNotification = async (deposit, user) => {
  if (!bot || !process.env.TELEGRAM_ADMIN_CHAT_ID) return;
  
  const message = `
🔔 *New Deposit Request*

👤 User: ${user.name}
📧 Email: ${user.email}
💰 Amount: ${deposit.currency} ${deposit.amount}
📅 Date: ${new Date(deposit.created_at).toLocaleString()}

ID: ${deposit.id}
  `;
  
  try {
    await bot.sendMessage(process.env.TELEGRAM_ADMIN_CHAT_ID, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Approve', callback_data: `approve_${deposit.id}` },
          { text: '❌ Reject', callback_data: `reject_${deposit.id}` }
        ]]
      }
    });
  } catch (error) {
    console.error('Telegram error:', error);
  }
};

exports.sendWithdrawalNotification = async (withdrawal, user) => {
  if (!bot || !process.env.TELEGRAM_ADMIN_CHAT_ID) return;
  
  const message = `
💸 *New Withdrawal Request*

👤 User: ${user.name}
💰 Amount: ${withdrawal.currency} ${withdrawal.amount}
🏦 Bank: ${withdrawal.bank_name}
📱 Account: ${withdrawal.account_number}

ID: ${withdrawal.id}
  `;
  
  try {
    await bot.sendMessage(process.env.TELEGRAM_ADMIN_CHAT_ID, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Telegram error:', error);
  }
};
