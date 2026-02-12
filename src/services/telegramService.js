const TelegramBot = require('node-telegram-bot-api');
const { Transaction, User } = require('../models');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 Telegram Bot Polling Started...');

// Store pending tx references
const pending = new Map();

// Send deposit notification
async function notifyDeposit(transaction, user) {
  const message = `
🔔 NUEVO DEPÓSITO PENDIENTE

👤 Usuario: ${user.username}
📱 País: ${user.country}
💰 Monto: ${transaction.currency} ${transaction.amount}

🆔 ID: ${transaction.transactionId}

⚠️ Acción requerida:
  `.trim();

  const buttons = {
    inline_keyboard: [
      [
        { text: '✅ Aprobar', callback_data: `approve_${transaction.transactionId}` },
        { text: '❌ Rechazar', callback_data: `reject_${transaction.transactionId}` }
      ]
    ]
  };

  pending.set(transaction.transactionId, {
    transactionId: transaction.transactionId,
    userId: user.id
  });

  await bot.sendMessage(ADMIN_CHAT_ID, message, {
    reply_markup: buttons
  });
}

// Handle approve / reject
bot.on('callback_query', async (query) => {
  const data = query.data;
  const [action, txId] = data.split('_');

  const record = pending.get(txId);
  if (!record) {
    return bot.answerCallbackQuery(query.id, { text: 'Already processed' });
  }

  const transaction = await Transaction.findOne({
    where: { transactionId: txId }
  });

  if (!transaction || transaction.status !== 'PENDING') {
    return bot.answerCallbackQuery(query.id, { text: 'Invalid transaction' });
  }

  const user = await User.findByPk(transaction.userId);

  if (action === 'approve') {
    transaction.status = 'COMPLETED';
    await transaction.save();

    user.balance = parseFloat(user.balance) + parseFloat(transaction.amount);
    await user.save();

    await bot.editMessageText(
      `✅ DEPÓSITO APROBADO\n\nUsuario: ${user.username}\nNuevo balance: ${user.balance}`,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
      }
    );
  }

  if (action === 'reject') {
    transaction.status = 'REJECTED';
    await transaction.save();

    await bot.editMessageText(
      `❌ DEPÓSITO RECHAZADO\n\nUsuario: ${user.username}`,
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
      }
    );
  }

  pending.delete(txId);

  await bot.answerCallbackQuery(query.id);
});

module.exports = {
  notifyDeposit
};
