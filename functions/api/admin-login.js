/**
 * functions/api/admin-login.js
 * Cloudflare Pages Function — POST /api/admin-login
 *
 * Autentica al administrador del sitio verificando usuario y contraseña
 * con comparación en tiempo constante (para evitar ataques de tiempo).
 * Si las credenciales son válidas, emite un token firmado con HMAC-SHA256
 * con expiración de 8 horas.
 *
 * Body esperado (JSON):
 *   { usuario: string, password: string }
 *
 * Respuesta exitosa (200):
 *   { ok: true, token: string, expiresIn: 28800 }
 *
 * Variables de entorno requeridas:
 *   ADMIN_USER   — Nombre de usuario del administrador
 *   ADMIN_PASS   — Contraseña del administrador
 *   ADMIN_SECRET — String aleatorio (32+ chars) para firmar los tokens
 */

// ── Cabeceras CORS ────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

// ── Handler POST ──────────────────────────────────────────────────────────────
/**
 * Verifica las credenciales y emite un token de sesión.
 *
 * El token tiene la forma: `<payloadBase64>.<firmaHex>`
 * El payload contiene: { sub: 'admin', iat: <ms>, exp: <ms> }
 *
 * @param {EventContext} ctx — Contexto de Cloudflare Pages
 * @returns {Response}
 */
export async function onRequestPost(ctx) {
  try {
    const { usuario, password } = await ctx.request.json();

    const ADMIN_USER   = ctx.env.ADMIN_USER;
    const ADMIN_PASS   = ctx.env.ADMIN_PASS;
    const ADMIN_SECRET = ctx.env.ADMIN_SECRET;

    // ── Verificar que las variables de entorno estén configuradas ─────────────
    if (!ADMIN_USER || !ADMIN_PASS || !ADMIN_SECRET) {
      return new Response(JSON.stringify({ error: 'Variables de entorno no configuradas' }), { status: 500, headers: CORS });
    }

    // ── Comparación segura en tiempo constante ────────────────────────────────
    // Evita ataques de timing que permiten deducir la contraseña midiendo
    // cuánto tarda en responder el servidor según cuántos caracteres coinciden.
    const enc = new TextEncoder();
    const userMatch = await safeCompare(enc.encode(usuario || ''), enc.encode(ADMIN_USER));
    const passMatch = await safeCompare(enc.encode(password || ''), enc.encode(ADMIN_PASS));

    if (!userMatch || !passMatch) {
      return new Response(JSON.stringify({ error: 'Credenciales incorrectas' }), { status: 401, headers: CORS });
    }

    // ── Crear token firmado con HMAC-SHA256 (válido 8 horas) ──────────────────
    // Estructura: base64(payload) + "." + hmac_hex(base64(payload))
    const payload = { sub: 'admin', iat: Date.now(), exp: Date.now() + 8 * 60 * 60 * 1000 };
    const payloadB64 = btoa(JSON.stringify(payload));
    const sig = await hmacSign(ADMIN_SECRET, payloadB64);
    const token = `${payloadB64}.${sig}`;

    return new Response(JSON.stringify({ ok: true, token, expiresIn: 8 * 3600 }), { headers: CORS });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
}

// ── Handler OPTIONS (preflight CORS) ─────────────────────────────────────────
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

// ── Helpers criptográficos (Web Crypto API, disponible en Cloudflare Workers) ──

/**
 * Firma una cadena de texto con HMAC-SHA256 y retorna la firma en hex.
 *
 * @param {string} secret — Clave secreta para la firma
 * @param {string} data   — Datos a firmar
 * @returns {Promise<string>} — Firma en formato hexadecimal lowercase
 */
async function hmacSign(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  // Convertir ArrayBuffer a string hexadecimal
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compara dos Uint8Array en tiempo constante para evitar ataques de timing.
 * Rellena ambos al mismo largo máximo y aplica XOR bit a bit.
 *
 * @param {Uint8Array} a — Primer valor (ej: input del usuario)
 * @param {Uint8Array} b — Segundo valor (ej: valor secreto almacenado)
 * @returns {Promise<boolean>} — true solo si ambos son idénticos
 */
async function safeCompare(a, b) {
  const len = Math.max(a.length, b.length);
  // Rellenar con ceros para igualar largo (oculta diferencia de longitud)
  const pa = new Uint8Array(len); pa.set(a);
  const pb = new Uint8Array(len); pb.set(b);
  // XOR acumulativo: si algún bit difiere, diff != 0
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= pa[i] ^ pb[i];
  return diff === 0;
}
