// api/leads.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string // service role key — server ONLY
);

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Guard: ensure JSON
  const body = (req.body ?? {}) as any;
  const { name, email, phone, message, page_path, utm, hp } = body;

  // Honeypot (bot trap)
  if (typeof hp === 'string' && hp.trim() !== '') {
    return res.status(200).json({ ok: true });
  }

  // Validate
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing required fields' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email' });
  if (String(message).length > 4000) return res.status(400).json({ error: 'Message too long' });

  // Insert into Supabase
  const { error } = await supabase.from('leads').insert({
    name,
    email,
    phone: phone || null,
    message,
    page_path: page_path || null,
    utm_source: utm?.source || null,
    utm_medium: utm?.medium || null,
    utm_campaign: utm?.campaign || null,
    source: 'website'
  });

  if (error) {
    console.error('Supabase insert error:', error);
    return res.status(500).json({ error: 'Database insert failed' });
  }

  return res.status(200).json({ ok: true });
}