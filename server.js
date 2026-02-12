const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// ===== YOUR CONFIGURATION (ALREADY SET) =====
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8119310136:AAGByR_L6fCR9rhjJmOQ26pX3ZWiiWMDYaI';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '7705534225';
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = 'https://moneta-ict-huua.onrender.com';

console.log('🔧 Configuration loaded:');
console.log('   Bot Token:', TELEGRAM_BOT_TOKEN.substring(0, 20) + '...');
console.log('   Chat ID:', TELEGRAM_CHAT_ID);
console.log('   Frontend URL:', FRONTEND_URL);

// Middleware
app.use(cors({
  origin: [
    FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== TELEGRAM FUNCTIONS =====

async function sendTelegramMessage(text, buttons = null) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const payload = {
    chat_id: TELEGRAM_CHAT_ID,
    text: text,
    parse_mode: 'HTML',
  };

  if (buttons) {
    payload.reply_markup = {
      inline_keyboard: buttons
    };
  }

  try {
    const response = await axios.post(url, payload);
    console.log('✅ Telegram message sent');
    return response.data;
  } catch (error) {
    console.error('❌ Telegram error:', error.response?.data || error.message);
    throw error;
  }
}

async function sendTelegramPhoto(photoUrl, caption, buttons = null) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
  
  const payload = {
    chat_id: TELEGRAM_CHAT_ID,
    photo: photoUrl,
    caption: caption,
    parse_mode: 'HTML',
  };

  if (buttons) {
    payload.reply_markup = {
      inline_keyboard: buttons
    };
  }

  try {
    const response = await axios.post(url, payload);
    console.log('✅ Telegram photo sent');
    return response.data;
  } catch (error) {
    console.error('❌ Telegram photo error:', error.response?.data || error.message);
    await sendTelegramMessage(caption, buttons);
    return null;
  }
}

async function answerCallbackQuery(callbackQueryId, text = '') {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
  
  try {
    await axios.post(url, {
      callback_query_id: callbackQueryId,
      text: text,
    });
  } catch (error) {
    console.error('❌ Error answering callback:', error.message);
  }
}

// ===== API ENDPOINTS =====

app.get('/', (req, res) => {
  res.json({
    status: '✅ Online',
    service: 'MONETA-ICT Telegram Bot',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    configured: {
      telegram: !!TELEGRAM_BOT_TOKEN && TELEGRAM_BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE',
      chatId: !!TELEGRAM_CHAT_ID && TELEGRAM_CHAT_ID !== 'YOUR_CHAT_ID_HERE'
    }
  });
});

app.get('/api/test', async (req, res) => {
  try {
    await sendTelegramMessage(
      '🧪 <b>TEST MESSAGE</b>\n\n' +
      '✅ Your Telegram bot is working!\n' +
      '⏰ Time: ' + new Date().toLocaleString('es-ES') + '\n\n' +
      'Ready to receive deposit/withdrawal notifications! 🚀'
    );
    res.json({ 
      success: true, 
      message: '✅ Test message sent! Check your Telegram.' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      hint: 'Check bot token and chat ID'
    });
  }
});

app.post('/api/notify-deposit', async (req, res) => {
  console.log('📥 DEPOSIT notification received');

  const { 
    userId, 
    userName, 
    userEmail, 
    userPhone,
    amount, 
    country,
    transactionId,
    proofImageUrl,
    proofFileName,
    timestamp 
  } = req.body;

  if (!userId || !amount || !transactionId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    });
  }

  try {
    const currencySymbol = country === 'CO' ? '$' : 'S/';
    const currencyCode = country === 'CO' ? 'COP' : 'PEN';
    const countryFlag = country === 'CO' ? '🇨🇴' : '🇵🇪';
    const countryName = country === 'CO' ? 'Colombia' : 'Perú';

    const message = `
🔔 <b>NUEVO DEPÓSITO PENDIENTE</b>

👤 <b>Usuario:</b> ${userName}
📧 <b>Email:</b> ${userEmail}
📱 <b>Teléfono:</b> ${userPhone}

💰 <b>Monto:</b> ${currencySymbol}${amount.toLocaleString()} ${currencyCode}
🌎 <b>País:</b> ${countryFlag} ${countryName}

🆔 <b>ID:</b> <code>${transactionId}</code>
📸 <b>Comprobante:</b> ${proofFileName || 'Adjunto abajo'}
⏰ <b>Fecha:</b> ${new Date(timestamp).toLocaleString('es-ES')}

⚠️ <b>ACCIÓN REQUERIDA:</b> Verificar y aprobar
    `.trim();

    const buttons = [
      [
        { text: '✅ Aprobar', callback_data: `approve_dep_${transactionId}` },
        { text: '❌ Rechazar', callback_data: `reject_dep_${transactionId}` }
      ],
      [
        { text: '👤 Ver Usuario', callback_data: `view_user_${userId}` }
      ]
    ];

    if (proofImageUrl && proofImageUrl.startsWith('http')) {
      try {
        await sendTelegramPhoto(proofImageUrl, message, buttons);
      } catch {
        await sendTelegramMessage(message + '\n\n⚠️ <i>Imagen no disponible</i>', buttons);
      }
    } else {
      await sendTelegramMessage(message, buttons);
    }

    console.log('✅ Deposit notification sent for:', transactionId);

    res.json({ 
      success: true, 
      message: 'Notification sent',
      transactionId 
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/api/notify-withdrawal', async (req, res) => {
  console.log('📥 WITHDRAWAL notification received');

  const { 
    userId, 
    userName, 
    userEmail,
    userPhone,
    amount, 
    country,
    transactionId,
    bankName,
    accountNumber,
    accountType,
    timestamp 
  } = req.body;

  if (!userId || !amount || !transactionId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    });
  }

  try {
    const currencySymbol = country === 'CO' ? '$' : 'S/';
    const currencyCode = country === 'CO' ? 'COP' : 'PEN';
    const countryFlag = country === 'CO' ? '🇨🇴' : '🇵🇪';
    const countryName = country === 'CO' ? 'Colombia' : 'Perú';

    const message = `
💳 <b>NUEVO RETIRO PENDIENTE</b>

👤 <b>Usuario:</b> ${userName}
📧 <b>Email:</b> ${userEmail}
📱 <b>Teléfono:</b> ${userPhone}

💰 <b>Monto:</b> ${currencySymbol}${amount.toLocaleString()} ${currencyCode}
🌎 <b>País:</b> ${countryFlag} ${countryName}

🏦 <b>DATOS BANCARIOS:</b>
   • Banco: ${bankName}
   • Cuenta: <code>${accountNumber}</code>
   • Tipo: ${accountType}

🆔 <b>ID:</b> <code>${transactionId}</code>
⏰ <b>Fecha:</b> ${new Date(timestamp).toLocaleString('es-ES')}

⚠️ <b>ACCIÓN REQUERIDA:</b> Procesar transferencia
    `.trim();

    const buttons = [
      [
        { text: '✅ Aprobar y Pagar', callback_data: `approve_wit_${transactionId}` },
        { text: '❌ Rechazar', callback_data: `reject_wit_${transactionId}` }
      ],
      [
        { text: '👤 Ver Usuario', callback_data: `view_user_${userId}` }
      ]
    ];

    await sendTelegramMessage(message, buttons);

    console.log('✅ Withdrawal notification sent for:', transactionId);

    res.json({ 
      success: true, 
      message: 'Notification sent',
      transactionId 
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/api/telegram-webhook', async (req, res) => {
  const { callback_query, message } = req.body;

  if (callback_query) {
    const data = callback_query.data;
    console.log('🔘 Button clicked:', data);

    try {
      if (data.startsWith('approve_')) {
        const parts = data.split('_');
        const txId = parts.slice(2).join('_');
        
        await answerCallbackQuery(callback_query.id, '✅ Aprobación registrada');
        
        await sendTelegramMessage(
          `✅ <b>APROBADO</b>\n\n` +
          `🆔 ID: <code>${txId}</code>\n\n` +
          `📝 <b>Próximos pasos:</b>\n` +
          `1. Ir al panel admin\n` +
          `2. Buscar: ${txId}\n` +
          `3. Cambiar estado a "Aprobado"\n` +
          `4. Actualizar balance del usuario\n\n` +
          `💡 <i>Pronto será automático</i>`
        );

      } else if (data.startsWith('reject_')) {
        const parts = data.split('_');
        const txId = parts.slice(2).join('_');
        
        await answerCallbackQuery(callback_query.id, '❌ Rechazo registrado');
        
        await sendTelegramMessage(
          `❌ <b>RECHAZADO</b>\n\n` +
          `🆔 ID: <code>${txId}</code>\n\n` +
          `📝 <b>Próximos pasos:</b>\n` +
          `1. Ir al panel admin\n` +
          `2. Buscar: ${txId}\n` +
          `3. Cambiar estado a "Rechazado"\n\n` +
          `Usuario será notificado`
        );

      } else if (data.startsWith('view_user_')) {
        const userId = data.replace('view_user_', '');
        
        await answerCallbackQuery(callback_query.id);
        
        await sendTelegramMessage(
          `👤 <b>USUARIO</b>\n\n` +
          `🆔 ID: <code>${userId}</code>\n\n` +
          `Ver detalles en:\n` +
          `Panel Admin → Usuarios → ${userId}`
        );
      }

    } catch (error) {
      console.error('❌ Callback error:', error);
      await answerCallbackQuery(callback_query.id, '❌ Error');
    }
  }

  if (message && message.text) {
    const text = message.text;
    const chatId = message.chat.id;

    if (text === '/start') {
      await sendTelegramMessage(
        `👋 <b>MONETA-ICT Admin Bot</b>\n\n` +
        `Recibirás notificaciones de:\n` +
        `• 💰 Depósitos\n` +
        `• 💳 Retiros\n\n` +
        `Tu Chat ID: <code>${chatId}</code>`
      );
    } else if (text === '/status') {
      await sendTelegramMessage(
        `✅ <b>SISTEMA ACTIVO</b>\n\n` +
        `🤖 Bot: Online\n` +
        `🌐 Backend: Funcionando\n` +
        `📱 Telegram: Conectado\n` +
        `⏰ ${new Date().toLocaleString('es-ES')}`
      );
    }
  }

  res.json({ ok: true });
});

app.get('/api/setup-webhook', async (req, res) => {
  const webhookUrl = `${req.protocol}://${req.get('host')}/api/telegram-webhook`;
  
  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query']
      }
    );

    res.json({
      success: true,
      message: '✅ Webhook configured!',
      webhookUrl,
      response: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/webhook-info', async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
    );
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message
  });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   MONETA-ICT Telegram Bot Backend    ║
╠═══════════════════════════════════════╣
║  Status: ✅ Running                   ║
║  Port: ${PORT}                        ║
║  Bot: ✅ Configured                   ║
║  Chat ID: ✅ ${TELEGRAM_CHAT_ID}      ║
╚═══════════════════════════════════════╝

🚀 Ready to receive notifications!

Test it: GET /api/test
  `);
});

module.exports = app;
