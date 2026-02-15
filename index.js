const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // si erreur, on passera par axios
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

// on récupère la clé OpenAI depuis Render (Environment -> OPENAI_API_KEY)
const apiKey = process.env.OPENAI_API_KEY;

// --- Auth minimale (V1) ---

// provisoire : un seul user admin en dur, configuré via variables d'env
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@otebot.local';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || null;

// middleware pour vérifier le JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.split(' ')[1]; // format "Bearer xxx"

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

// route de login (admin V1)
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email et password requis' });
  }

  if (email !== ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) {
    return res.status(401).json({ error: 'Identifiants invalides' });
  }

  try {
    const ok = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!ok) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const token = jwt.sign(
      { email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '6h' }
    );

    res.json({ token });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Erreur serveur auth' });
  }
});

// --- Fin auth ---

app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'otebot-api' });
});

// on protège le chat : il faut un JWT valide
app.post('/chat', authenticateToken, async (req, res) => {
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
