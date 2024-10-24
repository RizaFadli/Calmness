const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// Token verifikasi untuk webhook
const VERIFY_TOKEN = 'aBc123XyZ456';

// Middleware untuk mengurai JSON dari body request
app.use(bodyParser.json());

// Endpoint untuk verifikasi webhook dari Facebook
app.get('/webhook', (req, res) => {
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Verifikasi token dari Facebook
    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// Endpoint untuk menerima pesan dari Messenger
app.post('/webhook', (req, res) => {
    let body = req.body;

    // Memastikan webhook hanya merespon event dari Messenger
    if (body.object === 'page') {
        body.entry.forEach(function(entry) {
            let webhookEvent = entry.messaging[0];
            console.log(webhookEvent);

            // Di sini Anda bisa memproses pesan dan memberikan respons balik ke pengguna
        });

        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));