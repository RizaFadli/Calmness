const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// Middleware untuk parsing body JSON
app.use(express.json());

// -----------------------------------
// 1. Route untuk GitHub Webhook
// -----------------------------------
app.post('/github-webhook', (req, res) => {
  const payload = req.body;
  console.log('Received GitHub Webhook:', payload);

  // Tambahkan logika Anda di sini untuk menangani event dari GitHub
  res.status(200).send('GitHub Webhook received');
});

// -----------------------------------
// 2. Route untuk Verifikasi dan Webhook Facebook
// -----------------------------------

// Verifikasi webhook Facebook
app.get('/facebook-webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN;

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook Verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Menerima pesan dari Facebook
app.post('/facebook-webhook', async (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(async (entry) => {
      const message = entry.messaging[0].message.text;
      const senderId = entry.messaging[0].sender.id;

      // Kirim pesan ke ChatGPT dan dapatkan respons
      const chatGPTResponse = await getChatGPTResponse(message);

      // Kirim respons ChatGPT kembali ke pengguna di Facebook Messenger
      await sendMessageToFacebook(senderId, chatGPTResponse);
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// -----------------------------------
// 3. Fungsi untuk Memanggil OpenAI ChatGPT API
// -----------------------------------

async function getChatGPTResponse(prompt) {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error with ChatGPT API:', error);
    return 'Sorry, I am unable to respond at the moment.';
  }
}

// -----------------------------------
// 4. Fungsi untuk Mengirim Pesan ke Facebook Messenger
// -----------------------------------

async function sendMessageToFacebook(recipientId, text) {
  try {
    await axios.post(`https://graph.facebook.com/v13.0/me/messages?access_token=${process.env.FACEBOOK_PAGE_ACCESS_TOKEN}`, {
      recipient: { id: recipientId },
      message: { text: text }
    });
  } catch (error) {
    console.error('Error sending message to Facebook:', error);
  }
}

// -----------------------------------
// Jalankan Server
// -----------------------------------
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
