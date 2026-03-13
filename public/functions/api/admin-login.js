// functions/api/admin-login.js
// Cloudflare Pages Function — reemplaza netlify/functions/admin-login.js

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

export async function onRequestPost(ctx) {
  try {
    const { usuario, password } = await ctx.request.json();

    const ADMIN_USER   = ctx.env.ADMIN_USER;
    const ADMIN_PASS   = ctx.env.ADMIN_PASS;
    const ADMIN_SECRET = ctx.env.ADMIN_SECRET;

    if (!ADMIN_USER || !ADMIN_PASS || !ADMIN_SECRET) {
      return new Response(JSON.stringify({ error: 'Variables de entorno no configuradas' }), { status: 500, headers: CORS });
    }

    // Comparación segura en tiempo constante
    const enc = new TextEncoder();
    const userMatch = await safeCompare(enc.encode(usuario || ''), enc.encode(ADMIN_USER));
    const passMatch = await safeCompare(enc.encode(password || ''), enc.encode(ADMIN_PASS));

    if (!userMatch || !passMatch) {
      return new Response(JSON.stringify({ error: 'Credenciales incorrectas' }), { status: 401, headers: CORS });
    }

    // Crear token firmado con HMAC-SHA256 (válido 8 horas)
    const payload = { sub: 'admin', iat: Date.now(), exp: Date.now() + 8 * 60 * 60 * 1000 };
    const payloadB64 = btoa(JSON.stringify(payload));
    const sig = await hmacSign(ADMIN_SECRET, payloadB64);
    const token = `${payloadB64}.${sig}`;

    return new Response(JSON.stringify({ ok: true, token, expiresIn: 8 * 3600 }), { headers: CORS });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

// ── Helpers criptográficos (Web Crypto API, disponible en Cloudflare Workers) ──

async function hmacSign(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function safeCompare(a, b) {
  // Pad to same length to avoid length leaks, then XOR
  const len = Math.max(a.length, b.length);
  const pa = new Uint8Array(len); pa.set(a);
  const pb = new Uint8Array(len); pb.set(b);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= pa[i] ^ pb[i];
  return diff === 0;
}
