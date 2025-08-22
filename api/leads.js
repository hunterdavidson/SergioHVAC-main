// api/leads.js
const { createClient } = require('@supabase/supabase-js');

const url = process.env['SUPABASE_URL'];
const serviceKey = process.env['SUPABASE_SERVICE_KEY'];

if (!url || !serviceKey) {
  console.warn('[leads] Missing env vars. SUPABASE_URL or SUPABASE_SERVICE_KEY not set.');
}

const supabase = createClient(url || '', serviceKey || '');

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!url || !serviceKey) {
    // Helpful message for local/dev. In production, keep this generic.
    res.status(500).json({ error: 'Server env not configured (missing SUPABASE_URL or SUPABASE_SERVICE_KEY)' });
    return;
  }

  const body = req.body || {};
  const { name, email, phone, message, page_path, utm, hp } = body;

  if (typeof hp === 'string' && hp.trim() !== '') {
    res.status(200).json({ ok: true });
    return;
  }
  if (!name || !email || !message) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Invalid email' });
    return;
  }
  if (String(message).length > 4000) {
    res.status(400).json({ error: 'Message too long' });
    return;
  }

  const { error } = await supabase.from('leads').insert({
    name,
    email,
    phone: phone,
    message,
    page_path: page_path || null,
    utm_source: utm?.source || null,
    utm_medium: utm?.medium || null,
    utm_campaign: utm?.campaign || null,
    source: 'website'
  });

  if (error) {
    // This prints the exact cause into your terminal running `vercel dev`
    console.error('[leads] Supabase insert error:', error);
    res.status(500).json({ error: 'Database insert failed' });
    return;
  }

  res.status(200).json({ ok: true });
};