const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // si erreur, on passera par axios

const app = express();
app.use(cors());
app.use(express.json());

// on récupère la clé OpenAI depuis Render (Environment -> OPENAI_API_KEY)
const apiKey = process.env.OPENAI_API_KEY;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'otebot-api' });
});

app.post('/chat', async (req, res) => {
  const { message } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'message manquant' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'API OpenAI non configurée' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: "Tu es OtéBot, assistante IA pour un créateur de sites web, SEO et outils digitaux à La Réunion. Tu réponds de façon claire, professionnelle mais chaleureuse, et tu restes concise."
          },
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI error:', errorText);
      return res.status(500).json({ error: 'Erreur côté IA' });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Je n'ai pas pu générer de réponse pour le moment.";

    res.json({ reply });
  } catch (err) {
    console.error('Chat route error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Otebot API listening on port ${PORT}`);
});
