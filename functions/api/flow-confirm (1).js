/**
 * POST /api/flow-confirm
 *
 * Webhook called by Flow.cl when payment status changes.
 * Receives: token (in POST body, form-urlencoded)
 * Queries Flow getStatus to verify payment.
 * On success: creates/updates subscription, sets provider to Destacado, sends email.
 *
 * Must return HTTP 200 for Flow to consider the webhook received.
 */

import { createClient } from "@supabase/supabase-js";

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

async function sendEmail(to, subject, html, env) {
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, html }),
    });
  } catch (e) { console.error("sendEmail failed:", e); }
}

// Flow calls this with POST form-urlencoded: token=xxx
export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }});
  }

  if (request.method !== "POST") {
    return new Response("OK", { status: 200 });
  }

  if (!env.FLOW_API_KEY || !env.FLOW_SECRET_KEY) {
    console.error("Missing Flow env vars");
    return new Response("OK", { status: 200 }); // must return 200
  }

  // Parse form body
  let flowToken = "";
  try {
    const formData = await request.formData();
    flowToken = formData.get("token") || "";
  } catch {
    try {
      const text = await request.text();
      const params = new URLSearchParams(text);
      flowToken = params.get("token") || "";
    } catch (e) {
      console.error("Failed to parse Flow webhook body:", e);
      return new Response("OK", { status: 200 });
    }
  }

  if (!flowToken) {
    console.error("No token in Flow webhook");
    return new Response("OK", { status: 200 });
  }

  // Query Flow for payment status
  const flowBase = env.FLOW_ENV === "production"
    ? "https://www.flow.cl/api"
    : "https://sandbox.flow.cl/api";

  const statusParams = {
    apiKey: env.FLOW_API_KEY,
    token: flowToken,
  };
  statusParams.s = await signFlow(statusParams, env.FLOW_SECRET_KEY);

  let paymentData;
  try {
    const qs = Object.keys(statusParams)
      .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(statusParams[k]))
      .join("&");

    const res = await fetch(`${flowBase}/payment/getStatus?${qs}`, { method: "GET" });
    paymentData = await res.json();
  } catch (e) {
    console.error("Flow getStatus error:", e);
    return new Response("OK", { status: 200 });
  }

  console.log("Flow payment data:", JSON.stringify(paymentData));

  // Status 2 = paid, 1 = pending, 3 = rejected, 4 = cancelled
  if (!paymentData || paymentData.status !== 2) {
    // Update payment record if exists
    if (paymentData && paymentData.commerceOrder) {
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
      const estado = paymentData.status === 3 ? "rechazado" : paymentData.status === 4 ? "cancelado" : "pendiente";
      await supabase.from("pagos_flow").update({ estado, flow_status: paymentData.status })
        .eq("commerce_order", paymentData.commerceOrder);
    }
    return new Response("OK", { status: 200 });
  }

  // ── Payment confirmed (status 2) ──────────────────────────────

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  // Find our payment record
  const { data: pago } = await supabase
    .from("pagos_flow")
    .select("*")
    .eq("commerce_order", paymentData.commerceOrder)
    .single();

  if (!pago) {
    console.error("Payment record not found:", paymentData.commerceOrder);
    return new Response("OK", { status: 200 });
  }

  // Prevent duplicate processing
  if (pago.estado === "pagado") {
    return new Response("OK", { status: 200 });
  }

  // Update payment record
  await supabase.from("pagos_flow").update({
    estado: "pagado",
    flow_status: 2,
    flow_order: paymentData.flowOrder || null,
    fecha_pago: new Date().toISOString(),
    medio_pago: paymentData.paymentData?.media || "",
  }).eq("id", pago.id);

  // Parse optional data
  let optData = {};
  try { optData = JSON.parse(paymentData.optional || "{}"); } catch {}

  const suscriptorId = pago.suscriptor_id || optData.suscriptor_id;
  const proveedorId = pago.proveedor_id || optData.proveedor_id;
  const months = pago.meses || optData.months || 1;
  const planType = pago.tipo || optData.type || "pack";
  const planKey = pago.plan || optData.plan || "1mes";

  if (!suscriptorId) {
    console.error("No suscriptor_id in payment");
    return new Response("OK", { status: 200 });
  }

  // Cancel any existing active subscription
  await supabase.from("suscripciones")
    .update({ estado: "cancelada", fecha_cancelacion: new Date().toISOString() })
    .eq("suscriptor_id", suscriptorId)
    .eq("estado", "activa");

  // Calculate dates
  const now = new Date();
  const venc = new Date(now);
  venc.setMonth(venc.getMonth() + months);

  // Create new subscription
  const planLabel = planType === "recurrente"
    ? (months >= 12 ? "anual" : "mensual")
    : `${months}meses`;

  await supabase.from("suscripciones").insert([{
    suscriptor_id: suscriptorId,
    plan: planLabel,
    estado: "activa",
    fecha_inicio: now.toISOString(),
    fecha_vencimiento: venc.toISOString(),
    monto: pago.monto,
    pago_automatico: planType === "recurrente",
  }]);

  // Update provider to Destacado
  if (proveedorId) {
    await supabase.from("proveedores")
      .update({ posicion: 1 })
      .eq("id", proveedorId);
  }

  // Send confirmation email
  const { data: sub } = await supabase
    .from("suscriptores")
    .select("email, nombre")
    .eq("id", suscriptorId)
    .single();

  if (sub && sub.email && env.RESEND_API_KEY && env.EMAIL_FROM) {
    const fmtDate = (d) => new Date(d).toLocaleDateString("es-CL");
    const fmtMoney = (n) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

    const emailHtml = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#FAFAF8;padding:32px 16px;color:#1A1714;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;padding:40px 32px;border:1px solid #E8E4DF;">
<h1 style="font-size:22px;margin:0 0 8px;color:#E8542A;">CotizaEventos.cl</h1>
<h2 style="font-size:18px;margin:0 0 24px;color:#1A1714;">Pago confirmado</h2>
<p style="margin:0 0 16px;line-height:1.6;color:#3D3733;">Hola <strong>${sub.nombre || "Proveedor"}</strong>, tu pago fue procesado exitosamente.</p>
<div style="background:#F5F3EF;border-radius:8px;padding:16px;margin:0 0 20px;">
<p style="margin:0 0 4px;font-size:13px;color:#8A8278;">Plan</p>
<p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#1A1714;">Destacado — ${months} ${months === 1 ? "mes" : "meses"}</p>
<p style="margin:0 0 4px;font-size:13px;color:#8A8278;">Monto</p>
<p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#1A1714;">${fmtMoney(pago.monto)}</p>
<p style="margin:0 0 4px;font-size:13px;color:#8A8278;">Vigencia</p>
<p style="margin:0;font-size:15px;font-weight:600;color:#1A1714;">${fmtDate(now)} — ${fmtDate(venc)}</p>
</div>
<p style="margin:0 0 16px;line-height:1.6;color:#3D3733;">Tu perfil Destacado ya está activo. Los clientes pueden encontrarte con máxima visibilidad en el directorio.</p>
<a href="https://www.cotizaeventos.cl/suscripciones.html" style="display:inline-block;background:#E8542A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">Ver mi suscripción</a>
<hr style="border:none;border-top:1px solid #E8E4DF;margin:24px 0 16px;">
<p style="margin:0;font-size:12px;color:#8A8278;">Enviado automáticamente por CotizaEventos.cl</p>
</div></body></html>`;

    await sendEmail(sub.email, "Pago confirmado — Plan Destacado CotizaEventos.cl", emailHtml, env);
  }

  return new Response("OK", { status: 200 });
}

