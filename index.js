const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'otebot-api' });
});

app.post('/chat', (req, res) => {
  const { message } = req.body || {};
  res.json({
    reply: `OtéBot a bien reçu: "${message || ''}" (API de test en ligne, logique IA à brancher).`
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Otebot API listening on port ${PORT}`);
});
