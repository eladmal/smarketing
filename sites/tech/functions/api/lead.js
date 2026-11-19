// Cloudflare Pages Function: POST /api/lead
// Validates the audit form and forwards the lead to LEAD_WEBHOOK_URL
// (a Make scenario that routes to Crm2Lead + Google Sheets + instant email).
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

const clip = (v, n = 200) => String(v ?? "").trim().slice(0, n);

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  // Honeypot: bots fill the hidden "website" field. Pretend success.
  if (clip(body.website)) return json({ ok: true });

  const lead = {
    name: clip(body.name, 100),
    phone: clip(body.phone, 20),
    email: clip(body.email, 120),
    company: clip(body.company, 120),
    has_marketing_manager: clip(body.has_marketing_manager, 60),
    utm_source: clip(body.utm_source, 100),
    utm_medium: clip(body.utm_medium, 100),
    utm_campaign: clip(body.utm_campaign, 150),
    utm_content: clip(body.utm_content, 150),
    gclid: clip(body.gclid, 200),
    fbclid: clip(body.fbclid, 200),
    page: clip(body.page, 500),
    source: "tech.smarkethink.co.il",
    submitted_at: new Date().toISOString(),
  };

  if (!lead.name || !/^[0-9+\-\s()]{9,15}$/.test(lead.phone)) {
    return json({ ok: false, error: "invalid" }, 422);
  }
  if (!env.LEAD_WEBHOOK_URL) {
    return json({ ok: false, error: "not_configured" }, 503);
  }

  const r = await fetch(env.LEAD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead),
  });
  if (!r.ok) return json({ ok: false, error: "upstream" }, 502);
  return json({ ok: true });
}

export const onRequest = () => json({ ok: false, error: "method_not_allowed" }, 405);
