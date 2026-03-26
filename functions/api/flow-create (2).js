/**
 * POST /api/flow-create
 *
 * Creates a payment order in Flow.cl and returns the redirect URL.
 * Requires suscriptor auth token.
 *
 * Body: { plan, token }
 *   plan: "1mes" | "3meses" | "6meses" | "12meses" | "mensual" | "anual"
 *
 * Environment variables:
 *   FLOW_API_KEY, FLOW_SECRET_KEY, FLOW_ENV (sandbox|production)
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY, SUSCRIPTOR_SECRET
 */

import { createClient } from "@supabase/supabase-js";

const PLANS = {
  "1mes":    { label: "1 mes Destacado",           amount: 25000,  months: 1,  type: "pack" },
  "3meses":  { label: "3 meses Destacado",          amount: 63000,  months: 3,  type: "pack" },
  "6meses":  { label: "6 meses Destacado",          amount: 108000, months: 6,  type: "pack" },
  "12meses": { label: "12 meses Destacado (paga 8)", amount: 200000, months: 12, type: "pack" },
  "mensual": { label: "Suscripción mensual",         amount: 22000,  months: 1,  type: "recurrente" },
  "anual":   { label: "Suscripción anual (paga 8)",  amount: 200000, months: 12, type: "recurrente" },
};

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json; charset=utf-8",
  };
}
function json(d, s = 200) { return new Response(JSON.stringify(d), { status: s, headers: cors() }); }
function err(m, s = 500) { return json({ ok: false, error: m }, s); }

// ── Flow.cl signing ──────────────────────────────────────────────

function sortParams(params) {
  return Object.keys(params).sort().map(k => `${k}${params[k]}`).join("");
}

async function signFlow(params, secretKey) {
  const toSign = sortParams(params);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(toSign));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ── Token verification ───────────────────────────────────────────

async function verifyToken(token, secret) {
  if (!token) return null;
  const dotIdx = token.indexOf(".");
  if (dotIdx === -1) return null;
  const payloadB64 = token.slice(0, dotIdx);
  const sigB64 = token.slice(dotIdx + 1);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const sigStr = atob(sigB64.replace(/-/g, "+").replace(/_/g, "/"));
  const sigBuf = new Uint8Array(sigStr.length);
  for (let i = 0; i < sigStr.length; i++) sigBuf[i] = sigStr.charCodeAt(i);
  const valid = await crypto.subtle.verify("HMAC", key, sigBuf, encoder.encode(payloadB64));
  if (!valid) return null;
  const payloadStr = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
  const payload = JSON.parse(payloadStr);
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

// ── Handler ──────────────────────────────────────────────────────

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors() });
  }

  if (request.method !== "POST") {
    return err("Método no permitido", 405);
  }

  if (!env.FLOW_API_KEY || !env.FLOW_SECRET_KEY || !env.SUSCRIPTOR_SECRET) {
    return err("Error de configuración del servidor", 500);
  }

  let body;
  try { body = await request.json(); } catch { return err("JSON inválido", 400); }

  const { plan, token } = body;
  if (!plan || !PLANS[plan]) return err("Plan inválido", 400);

  // Verify auth
  const payload = await verifyToken(token, env.SUSCRIPTOR_SECRET);
  if (!payload) return err("Token inválido o expirado", 401);

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  // Get suscriptor info
  const { data: sub } = await supabase
    .from("suscriptores")
    .select("id, email, nombre, proveedor_id")
    .eq("id", payload.sub)
    .single();
  if (!sub) return err("Suscriptor no encontrado", 404);

  const planInfo = PLANS[plan];
  const orderId = `CE-${sub.id.slice(0, 8)}-${Date.now()}`;
  const flowBase = env.FLOW_ENV === "production"
    ? "https://www.flow.cl/api"
    : "https://sandbox.flow.cl/api";
  const siteBase = env.FLOW_ENV === "production"
    ? "https://www.cotizaeventos.cl"
    : "https://www.cotizaeventos.cl"; // same domain for sandbox

  // Build Flow payment params
  const flowParams = {
    apiKey: env.FLOW_API_KEY,
    commerceOrder: orderId,
    subject: planInfo.label + " — CotizaEventos.cl",
    currency: "CLP",
    amount: planInfo.amount,
    email: sub.email,
    urlConfirmation: `${siteBase}/api/flow-confirm`,
    urlReturn: `${siteBase}/api/flow-return`,
    optional: JSON.stringify({
      suscriptor_id: sub.id,
      proveedor_id: sub.proveedor_id,
      plan: plan,
      months: planInfo.months,
      type: planInfo.type,
    }),
  };

  // Sign
  flowParams.s = await signFlow(flowParams, env.FLOW_SECRET_KEY);

  // Create payment in Flow
  try {
    const formBody = Object.keys(flowParams)
      .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(flowParams[k]))
      .join("&");

    const flowRes = await fetch(`${flowBase}/payment/create`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });

    const flowData = await flowRes.json();

    if (!flowData.url || !flowData.token) {
      console.error("Flow create error:", JSON.stringify(flowData));
      return err("Error al crear orden de pago en Flow", 500);
    }

    // Store pending payment in DB for tracking
    await supabase.from("pagos_flow").insert([{
      commerce_order: orderId,
      flow_token: flowData.token,
      suscriptor_id: sub.id,
      proveedor_id: sub.proveedor_id,
      plan: plan,
      monto: planInfo.amount,
      meses: planInfo.months,
      tipo: planInfo.type,
      estado: "pendiente",
    }]).select().single();

    // Return redirect URL
    return json({
      ok: true,
      redirectUrl: `${flowData.url}?token=${flowData.token}`,
    });

  } catch (e) {
    console.error("Flow API error:", e);
    return err("Error al conectar con Flow", 500);
  }
}
