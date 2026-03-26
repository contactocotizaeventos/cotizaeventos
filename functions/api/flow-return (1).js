/**
 * GET /api/flow-return?token=xxx
 *
 * User returns here after paying in Flow.
 * Queries Flow for payment status and shows result page.
 */

import { createClient } from "@supabase/supabase-js";

function sortParams(params) {
  return Object.keys(params).sort().map(k => `${k}${params[k]}`).join("");
}

async function signFlow(params, secretKey) {
  const toSign = sortParams(params);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secretKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(toSign));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const flowToken = url.searchParams.get("token") || "";

  if (!flowToken || !env.FLOW_API_KEY || !env.FLOW_SECRET_KEY) {
    return Response.redirect("https://www.cotizaeventos.cl/suscripciones.html", 302);
  }

  const flowBase = env.FLOW_ENV === "production"
    ? "https://www.flow.cl/api"
    : "https://sandbox.flow.cl/api";

  // Query Flow for status
  const statusParams = { apiKey: env.FLOW_API_KEY, token: flowToken };
  statusParams.s = await signFlow(statusParams, env.FLOW_SECRET_KEY);
  const qs = Object.keys(statusParams).map(k => encodeURIComponent(k) + "=" + encodeURIComponent(statusParams[k])).join("&");

  let paymentData;
  try {
    const res = await fetch(`${flowBase}/payment/getStatus?${qs}`, { method: "GET" });
    paymentData = await res.json();
  } catch (e) {
    console.error("Flow getStatus error:", e);
  }

  const status = paymentData ? paymentData.status : 0;
  // 2=paid, 1=pending, 3=rejected, 4=cancelled

  let title, message, color, icon;
  if (status === 2) {
    title = "¡Pago exitoso!";
    message = "Tu pago fue procesado correctamente. Tu plan Destacado ya está activo.";
    color = "#06C7A5";
    icon = "✓";
  } else if (status === 1) {
    title = "Pago pendiente";
    message = "Tu pago está siendo procesado. En unos minutos se activará tu plan automáticamente.";
    color = "#F0A500";
    icon = "⏳";
  } else {
    title = "Pago no completado";
    message = "El pago no fue procesado. Puedes intentar nuevamente desde tu perfil.";
    color = "#e53e3e";
    icon = "✕";
  }

  const html = `<!DOCTYPE html><html lang="es"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — CotizaEventos.cl</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700&family=Outfit:wght@400;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Outfit',sans-serif;background:#FAFAF8;color:#1A1714;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:20px}
.card{background:#fff;border:1px solid #E8E4DF;border-radius:16px;padding:48px 36px;max-width:480px;width:100%;text-align:center}
.icon{width:72px;height:72px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;margin:0 auto 20px}
h1{font-family:'Fraunces',serif;font-size:28px;margin-bottom:12px}
p{font-size:16px;color:#3D3733;line-height:1.7;margin-bottom:28px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;background:#E8542A;color:#fff;border-radius:14px;font-weight:600;font-size:15px;text-decoration:none;transition:all .2s}
.btn:hover{background:#FF7A54;transform:translateY(-1px)}
.btn-ghost{background:transparent;color:#8A8278;border:1px solid #E8E4DF;margin-left:8px}
.btn-ghost:hover{border-color:#E8542A;color:#E8542A;background:transparent}
.logo{font-family:'Fraunces',serif;font-weight:700;font-size:20px;color:#1A1714;margin-bottom:32px}
.logo span{color:#E8542A}
</style></head><body>
<div class="logo">Cotiza<span>Eventos</span>.cl</div>
<div class="card">
<div class="icon">${icon}</div>
<h1>${title}</h1>
<p>${message}</p>
<a href="/suscripciones.html" class="btn">Ir a mi cuenta</a>
<a href="/proveedores.html" class="btn btn-ghost">Ver directorio</a>
</div>
</body></html>`;

  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
