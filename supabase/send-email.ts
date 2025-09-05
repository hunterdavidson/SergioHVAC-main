// @ts-nocheck
// Updated Supabase Edge Function: send-email (captures plan, zip, service_type, contact_time)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------- CORS ----------
const ORIGIN_ALLOWLIST = new Set([
  "https://www.svhvac.com",
  "https://svhvac.com",
  "http://localhost:4200",
  "http://localhost:3000",
]);
function makeCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowOrigin = ORIGIN_ALLOWLIST.has(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
    "Content-Type": "application/json",
    Connection: "keep-alive",
  } as Record<string, string>;
}

// ---------- Env ----------
const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") ?? "").trim();
const SERVICE_ROLE_KEY = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
const RESEND_API_KEY = (Deno.env.get("RESEND_API_KEY") ?? "").trim();
const RESEND_EMAIL = (Deno.env.get("RESEND_EMAIL") ?? "").trim(); // e.g. `"S.V. HVAC" <leads@svhvac.com>`
const FROM_EMAIL = RESEND_EMAIL;
// Optional behavior toggles (defaults favor delivering the email)
const ALLOW_EMAIL_ON_INSERT_FAIL = ((Deno.env.get("ALLOW_EMAIL_ON_INSERT_FAIL") ?? "true").trim().toLowerCase() !== "false");
const FALLBACK_SEND_TO_FROM_EMAIL = ((Deno.env.get("FALLBACK_SEND_TO_FROM_EMAIL") ?? "true").trim().toLowerCase() !== "false");

// ---------- tiny helpers ----------
function now() { return new Date().toISOString(); }
function log(...a: any[]) { console.log("[send-email]", now(), ...a); }
async function withTimeout(promise: Promise<any>, ms: number, label = "op") {
  let t: number | undefined;
  const timeout = new Promise((_, rej) => {
    // deno-lint-ignore no-explicit-any
    t = setTimeout(() => rej(new Error(`${label} timeout after ${ms}ms`)), ms) as any;
  });
  try { return await Promise.race([promise, timeout]); }
  finally { if (t !== undefined) clearTimeout(t); }
}
async function fetchWithTimeout(input: RequestInfo, init: any = {}) {
  const { timeoutMs = 8000, ...rest } = init || {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(`fetch timeout after ${timeoutMs}ms`), timeoutMs);
  try { return await fetch(input, { ...rest, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}
function escapeHtml(v: string) {
  return (v ?? "").replace(/[<>&"]/g, (s) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" } as any)[s]);
}
function renderLeadHTML(lead: any) {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;color:#1a1a1a;line-height:1.5;max-width:600px;margin:auto;">
      <div style="background:#6C91C2;padding:16px;border-radius:6px 6px 0 0;text-align:center;color:#fff;">
        <h2 style="margin:0;font-size:20px;">📩 New Website Lead</h2>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 6px 6px;padding:20px;">
        <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
          <tr><td style="font-weight:600;width:140px;">Name:</td><td>${escapeHtml(lead?.name)}</td></tr>
          <tr><td style="font-weight:600;">Email:</td><td><a href="mailto:${escapeHtml(lead?.email)}" style="color:#6C91C2;text-decoration:none;">${escapeHtml(lead?.email)}</a></td></tr>
          <tr><td style="font-weight:600;">Phone:</td><td><a href="tel:${escapeHtml(lead?.phone)}" style="color:#6C91C2;text-decoration:none;">${escapeHtml(lead?.phone)}</a></td></tr>
          ${lead?.plan ? `<tr><td style="font-weight:600;">Plan:</td><td>${escapeHtml(lead.plan)}</td></tr>` : ''}
          ${lead?.zip_code ? `<tr><td style="font-weight:600;">ZIP:</td><td>${escapeHtml(lead.zip_code)}</td></tr>` : ''}
          ${lead?.service_type ? `<tr><td style="font-weight:600;">Service Type:</td><td>${escapeHtml(lead.service_type)}</td></tr>` : ''}
          ${lead?.contact_time ? `<tr><td style="font-weight:600;">Best Time:</td><td>${escapeHtml(lead.contact_time)}</td></tr>` : ''}
          <tr><td style="font-weight:600;vertical-align:top;">Message:</td><td style="white-space:pre-wrap;">${escapeHtml(lead?.message || '')}</td></tr>
        </table>
      </div>
      <p style="color:#667085;font-size:13px;margin-top:16px;text-align:center;">This email was sent automatically from your website.<br/>Please reply directly to contact the lead.</p>
    </div>
  `;
}

async function sendWithResend(to: string[], subject: string, html: string) {
  if (!RESEND_API_KEY || !FROM_EMAIL) {
    return { ok: false, status: 500, details: "Missing RESEND_API_KEY or RESEND_EMAIL" };
  }
  log("sendWithResend start");
  const resp = await fetchWithTimeout("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    timeoutMs: 8000,
  });
  const text = await resp.text();
  if (!resp.ok) {
    log("Resend non-2xx", resp.status, text.slice(0, 400));
    return { ok: false, status: resp.status, details: text };
  }
  log("sendWithResend ok");
  return { ok: true, status: 200, data: JSON.parse(text) };
}

Deno.serve(async (req) => {
  const corsHeaders = makeCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  try {
    log("env present", { hasUrl: !!SUPABASE_URL, hasService: !!SERVICE_ROLE_KEY, hasResendKey: !!RESEND_API_KEY, hasFrom: !!FROM_EMAIL, resendKeyLen: RESEND_API_KEY.length });
    const missing = [] as string[];
    if (!SUPABASE_URL) missing.push("SUPABASE_URL");
    if (!SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    if (!RESEND_API_KEY) missing.push("RESEND_API_KEY");
    if (!FROM_EMAIL) missing.push("RESEND_EMAIL");
    if (missing.length) {
      log("missing env", missing);
      return new Response(JSON.stringify({ ok: false, error: `Missing env: ${missing.join(", ")}` }), { status: 500, headers: corsHeaders });
    }
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
    }
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));
    log("body parsed");
    if (!body?.lead || typeof body.lead !== "object") {
      return new Response(JSON.stringify({ ok: false, error: "Missing or invalid 'lead' in body" }), { status: 400, headers: corsHeaders });
    }
    const lead = body.lead || {};
    const clean = (v: any) => (typeof v === 'string' ? v.trim() : v);
    const record: any = {
      name: String(lead?.name ?? "").trim(),
      email: String(lead?.email ?? "").trim().toLowerCase(),
      phone: String(lead?.phone ?? "").trim(),
      message: String(lead?.message ?? "").trim() || null,
      page_path: typeof lead?.page_path === "string" ? String(lead.page_path).trim() : null,
      utm_source: lead?.utm?.source ? String(lead.utm.source).trim() : null,
      utm_medium: lead?.utm?.medium ? String(lead.utm.medium).trim() : null,
      utm_campaign: lead?.utm?.campaign ? String(lead.utm.campaign).trim() : null,
      source: "website",
      plan: clean(lead?.plan) || null,
      plan_tier: clean(lead?.plan) || null,
      zip_code: clean(lead?.zip_code) || null,
      service_type: clean(lead?.service_type) || null,
      contact_time: clean(lead?.contact_time) || null,
    };

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRe = /^[0-9()+\-.\s]{7,20}$/;
    const zipRe = /^\d{5}(?:-\d{4})?$/;
    if (!record.name || !record.email || !record.phone) {
      return new Response(JSON.stringify({ ok: false, error: "Missing required fields" }), { status: 400, headers: corsHeaders });
    }
    if (!emailRe.test(record.email)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid email" }), { status: 400, headers: corsHeaders });
    }
    if (!phoneRe.test(record.phone)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid phone" }), { status: 400, headers: corsHeaders });
    }
    if (record.zip_code && !zipRe.test(record.zip_code)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid zip" }), { status: 400, headers: corsHeaders });
    }
    if (record.message && record.message.length > 4000) {
      return new Response(JSON.stringify({ ok: false, error: "Message too long" }), { status: 400, headers: corsHeaders });
    }

    // Insert
    log("insertLead start");
    const { error: insertError } = await withTimeout(sb.from("leads").insert(record), 4000, "insertLead");
    if (insertError) {
      // Include details to help debug schema/column mismatches or missing tables
      const details = (insertError as any)?.message || String(insertError);
      log("insertLead error", details);
      if (!ALLOW_EMAIL_ON_INSERT_FAIL) {
        return new Response(JSON.stringify({ ok: false, error: "Lead insert failed", details }), { status: 500, headers: corsHeaders });
      }
      // Proceed to email even if insert fails (to avoid losing the lead)
      log("insert failed; proceeding to email fallback");
    } else {
      log("insertLead ok");
    }

    // Recipients
    log("getRecipients start");
    const { data, error } = await withTimeout(
      sb.from("admin_settings").select("email_to").eq("notify_new_lead", true),
      4000,
      "getRecipients",
    );
    if (error) {
      log("getRecipients error", error?.message || String(error));
      return new Response(JSON.stringify({ ok: false, error: "Recipient query failed" }), { status: 500, headers: corsHeaders });
    }
    const to = Array.from(new Set((data ?? []).map((r: any) => (r?.email_to ?? "").trim()).filter(Boolean)));
    log("getRecipients ok", to.length);
    if (!to.length) {
      if (FALLBACK_SEND_TO_FROM_EMAIL && FROM_EMAIL) {
        log("no recipients in admin_settings; falling back to FROM_EMAIL");
        to.push(FROM_EMAIL);
      } else {
        return new Response(JSON.stringify({ ok: true, info: "No recipients opted-in" }), { status: 200, headers: corsHeaders });
      }
    }

    const subject = `New lead${record.plan ? ` (${record.plan})` : ''}: ${record.name || record.email || record.phone || "Website"}`;
    const html = renderLeadHTML(record);
    const sendResult = await withTimeout(sendWithResend(to, subject, html), 10000, "sendWithResend");
    if (!sendResult.ok) {
      const status = sendResult.status >= 400 && sendResult.status < 600 ? sendResult.status : 502;
      return new Response(JSON.stringify({ ok: false, provider: "resend", status, details: sendResult.details }), { status, headers: corsHeaders });
    }
    const result = sendResult.data;
    log("email sent");
    (async () => {
      try { await sb.from("email_logs").insert(to.map((sent_to: string) => ({ sent_to, subject }))); }
      catch (e) { log("email_logs insert error", e?.message || String(e)); }
    })();

    return new Response(JSON.stringify({ ok: true, result }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    log("handler error", err?.message || String(err));
    return new Response(JSON.stringify({ ok: false, error: String(err?.message || err) }), { status: 500, headers: makeCorsHeaders(req) });
  }
});
