// api/leads.js
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

// ---- Env
const url = process.env['SUPABASE_URL'];
const serviceKey = process.env['SUPABASE_SERVICE_KEY'];
const resendKey = process.env['RESEND_API_KEY'];
const EMAIL_FROM = process.env['EMAIL_FROM'] || 'S.V. HVAC <no-reply@example.com>';

if (!url || !serviceKey) {
  console.warn('[leads] Missing env vars. SUPABASE_URL or SUPABASE_SERVICE_KEY not set.');
}

const supabase = createClient(url || '', serviceKey || '');
const resend = resendKey ? new Resend(resendKey) : null;

// ---- Helpers
const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).trim());
const clean = (v) => (typeof v === 'string' ? v.trim() : v);
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

// ---- Handler
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const name = clean(body.name);
  const email = clean(body.email);
  const phone = clean(body.phone);
  const message = clean(body.message);
  const page_path = clean(body.page_path);
  const utm = body.utm || {};
  const hp = clean(body.hp);

  // Honeypot
  if (typeof hp === 'string' && hp !== '') return res.status(200).json({ ok: true });

  // Requireds
  if (!name || !email || !phone) return res.status(400).json({ error: 'Missing required fields' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email' });

  // Basic phone sanity (7–20 chars of digits/symbols)
  if (!/^[0-9()+\-.\s]{7,20}$/.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone' });
  }

  // Optional message length guard
  if (message && String(message).length > 4000) {
    return res.status(400).json({ error: 'Message too long' });
  }

  try {
    // 1) Insert lead
    const { error } = await supabase.from('leads').insert({
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

    if (error) {
      console.error('[leads] Supabase insert error:', error);
      return res.status(500).json({ error: 'Database insert failed' });
    }

    // 2) Try notification (do not block request if emailing fails)
    try {
      if (!resend) {
        console.warn('[leads] RESEND_API_KEY not set; skipping email notification.');
      } else {
        const { data: settings, error: sErr } = await supabase
          .from('admin_settings')
          .select('notify_new_lead, email_to')
          .limit(1)
          .maybeSingle();

        if (sErr) {
          console.warn('[leads] Could not load admin_settings:', sErr);
        } else if (settings?.notify_new_lead && settings?.email_to) {
          const html = `
            <div style="font-family:Arial,sans-serif;font-size:14px;color:#111;line-height:1.45">
              <h2 style="margin:0 0 8px">New Website Lead</h2>
              <p><b>Name:</b> ${escapeHtml(name)}</p>
              <p><b>Email:</b> ${escapeHtml(email)}</p>
              <p><b>Phone:</b> ${escapeHtml(phone)}</p>
              ${message ? `<p><b>Message:</b><br/>${escapeHtml(message)}</p>` : ''}
              ${page_path ? `<p><b>Page:</b> ${escapeHtml(page_path)}</p>` : ''}
            </div>
          `;

          await resend.emails.send({
            from: EMAIL_FROM,
            to: settings.email_to,
            subject: 'New Lead from Website',
            html
          });
        }
      }
    } catch (notifyErr) {
      console.error('[leads] Notification send failed:', notifyErr);
      // continue — do not fail the request
    }

    // 3) Done
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[leads] Unexpected error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
};