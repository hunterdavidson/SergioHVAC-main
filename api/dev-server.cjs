// Simple dev API server that reuses the Vercel handler locally.
// Usage: npm run dev:api (then in another terminal run: npm start)

const express = require('express');

// Load .env so SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY are available
try { require('dotenv').config(); } catch {}

const handler = require('./leads.js');

const app = express();
app.use(express.json({ limit: '1mb' }));

// Mirror the production route
app.all('/api/leads', (req, res) => handler(req, res));

const PORT = process.env.DEV_API_PORT || 8787;
app.listen(PORT, () => {
  console.log(`[dev-api] Listening on http://127.0.0.1:${PORT}`);
});

