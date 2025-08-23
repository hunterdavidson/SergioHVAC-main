// /api/leads.js
// Force Node runtime on Vercel so we can use server-only libs (Resend, service key)
module.exports = handler;
module.exports.config = { runtime: 'nodejs' };

const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

// ---- Env
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
// Use a safe default so you can test without a custom domain
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('[leads] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_KEY || '');
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// ---- Helpers
const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).trim());
const clean = (v) => (typeof v === 'string' ? v.trim() : v);
const isValidPhone = (p) => /^[0-9()+\-.\s]{7,20}$/.test(String(p || ''));

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

// ---- Handler
async function handler(req, res) {
  // (optional) very light CORS for local dev; tighten for prod if needed
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  // In some setups body can be a string — parse it
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }
  body = body || {};

  const name = clean(body.name);
  const email = clean(body.email);
  const phone = clean(body.phone);
  const message = clean(body.message);
  const page_path = clean(body.page_path);
  const utm = body.utm || {};
  const hp = clean(body.hp);

  // Honeypot
  if (typeof hp === 'string' && hp !== '') {
    return res.status(200).json({ ok: true });
  }

  // Validation
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: 'Invalid phone' });
  }
  if (message && String(message).length > 4000) {
    return res.status(400).json({ error: 'Message too long' });
  }

  try {
    // 1) Insert lead
    const { error: insertError } = await supabase.from('leads').insert({
      name,
      email: email.toLowerCase(),
      phone,
      message: message || null,
      page_path: page_path || null,
      utm_source: clean(utm.source) || null,
      utm_medium: clean(utm.medium) || null,
      utm_campaign: clean(utm.campaign) || null,
      source: 'website'
    });

    if (insertError) {
      console.error('[leads] Supabase insert error:', insertError);
      return res.status(500).json({ error: 'Database insert failed' });
    }

    // 2) Email notification (non-blocking)
    try {
      if (!resend) {
        console.warn('[leads] RESEND_API_KEY not set; skipping email notification.');
      } else {
        const { data: settings, error: settingsErr } = await supabase
          .from('admin_settings')
          .select('notify_new_lead, email_to')
          .limit(1)
          .maybeSingle();

        if (settingsErr) {
          console.warn('[leads] Could not load admin_settings:', settingsErr);
        } else if (settings?.notify_new_lead && settings?.email_to) {
          const html = `
            <div style="font-family:Arial,sans-serif;font-size:14px;color:#111;line-height:1.45">
              <h2 style="margin:0 0 8px">New S.V. HVAC Services Lead</h2>
              <p><b>Name:</b> ${escapeHtml(name)}</p>
              <p><b>Email:</b> ${escapeHtml(email)}</p>
              <p><b>Phone:</b> ${escapeHtml(phone)}</p>
              <p><b>Message:</b><br/>${escapeHtml(message)}</p>
            </div>
          `;
          // before sending the email (right before resend.emails.send)
          await resend.emails.send({
            from: EMAIL_FROM,
            to: settings.email_to,
            subject: 'New S.V. HVAC Services Lead',
            html
          });
        }
      }
    } catch (notifyErr) {
      console.error('[leads] Notification send failed:', notifyErr);
      // don’t fail the request just because email failed
    }

    // 3) Done
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[leads] Unexpected error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}