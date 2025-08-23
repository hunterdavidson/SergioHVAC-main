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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, phone, message, page_path, utm, hp } = req.body || {};

  if (typeof hp === 'string' && hp.trim() !== '') return res.status(200).json({ ok: true });

  if (!name || !email || !phone) return res.status(400).json({ error: 'Missing required fields' });

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email' });

  if (message && String(message).length > 4000)
    return res.status(400).json({ error: 'Message too long' });

  const { error } = await supabase.from('leads').insert({
    name,
    email,
    phone, // phone required
    message: message ?? null, // optional
    page_path: page_path || null,
    utm_source: utm?.source || null,
    utm_medium: utm?.medium || null,
    utm_campaign: utm?.campaign || null,
    source: 'website'
  });

  if (error) {
    console.error('[leads] Supabase insert error:', error);
    return res.status(500).json({ error: 'Database insert failed' });
  }

  return res.status(200).json({ ok: true });
};