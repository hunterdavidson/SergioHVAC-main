// /api/leads.js
// Vercel API: validate + rate-limit, then forward to Supabase Edge Function
module.exports = handler;
module.exports.config = { runtime: 'nodejs20.x' };

// No direct email fallback here; notifications handled by Edge Function

// ---- Env
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
// Use a safe default so you can test without a custom domain (unused)
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';
// Optional: Supabase Edge Function URL to send notifications
// Example: https://<project-ref>.supabase.co/functions/v1/send-email
const SEND_EMAIL_FUNCTION_URL = process.env.SEND_EMAIL_FUNCTION_URL || '';

const resend = null;

// ---- Helpers
const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).trim());
const clean = (v) => (typeof v === 'string' ? v.trim() : v);
const isValidPhone = (p) => /^[0-9()+\-.\s]{7,20}$/.test(String(p || ''));
const toTitleCase = (s) => String(s || '')
  .toLowerCase()
  .replace(/\b([a-z])/g, (_, c) => c.toUpperCase())
  .replace(/\b(Ac)\b/g, 'AC');

// ---- Very small in-memory rate limit (per server instance)
const RATE = { windowMs: 10 * 60 * 1000, max: 5 }; // 5 requests / 10 minutes per IP
const buckets = new Map(); // ip -> [timestamps]

function getIp(req) {
  const xf = (req.headers['x-forwarded-for'] || '').toString();
  if (xf) return xf.split(',')[0].trim();
  return (req.headers['x-real-ip'] || req.connection?.remoteAddress || '').toString();
}

function isRateLimited(ip) {
  if (!ip) return false;
  const now = Date.now();
  const list = buckets.get(ip) || [];
  const recent = list.filter((t) => now - t < RATE.windowMs);
  if (recent.length >= RATE.max) return true;
  recent.push(now);
  buckets.set(ip, recent);
  return false;
}

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

  // Require Edge Function URL; no service key needed on Vercel
  if (!SEND_EMAIL_FUNCTION_URL) {
    console.error('[leads] Missing SEND_EMAIL_FUNCTION_URL');
    return res.status(500).json({ error: 'Server not configured' });
  }

  // Simple per-IP rate-limit
  const ip = getIp(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
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
  const plan = clean(body.plan || body.plan_tier);
  const zip_code = clean(body.zip || body.zip_code);
  const service_type = toTitleCase(clean(body.serviceType || body.service_type));
  const contact_time = clean(body.contactTime || body.contact_time);
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
    /* DB insert handled by Supabase Edge Function */

    

    // 2) Email notification (prefer Edge Function, fallback to Resend if not configured)
    try {
      if (SEND_EMAIL_FUNCTION_URL) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort('edge function timeout'), 9000);
        try {
      const payload = {
        lead: {
          name,
          email,
          phone,
          message,
          page_path: page_path || null,
          plan: plan || null,
          zip_code: zip_code || null,
          service_type: service_type || null,
          contact_time: contact_time || null,
          utm: {
            source: clean(utm.source) || null,
            medium: clean(utm.medium) || null,
            campaign: clean(utm.campaign) || null,
          },
        },
      };
          const authKey = SUPABASE_ANON_KEY || '';
          const edgeResp = await fetch(SEND_EMAIL_FUNCTION_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authKey}`,
              'apikey': authKey,
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          }).catch((e) => ({ ok: false, status: 0, text: async () => String(e?.message || e) }));
          clearTimeout(timer);
          if (!edgeResp?.ok) {
            const t = edgeResp?.text ? await edgeResp.text() : 'no response';
            console.warn('[leads] send-email edge function failed:', edgeResp?.status, t?.slice?.(0, 300));
            return res.status(502).json({ error: 'Notification function failed' });
          }
        } finally {
          clearTimeout(timer);
        }
      }

      // No direct fallback here; rely on Edge Function only
      if (!SEND_EMAIL_FUNCTION_URL) {
        console.warn('[leads] SEND_EMAIL_FUNCTION_URL not set; skipping notification.');
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
