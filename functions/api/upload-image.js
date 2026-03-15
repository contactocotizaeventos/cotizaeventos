/**
 * functions/api/upload-image.js
 * Cloudflare Pages Function — POST /api/upload-image
 *
 * Sube imágenes al bucket "portadas" de Supabase Storage.
 * Acepta dos formatos según el origen de la petición:
 *   - FormData (multipart/form-data): usado desde apps móviles nativas.
 *   - JSON con base64:                usado desde el panel de administración web.
 *
 * Restricciones:
 *   - Tipos permitidos: JPG, PNG, WebP, HEIC, HEIF
 *   - Tamaño máximo:    50 MB
 *
 * Respuesta exitosa (200):
 *   { ok: true, url: "<URL pública de la imagen>" }
 *
 * Variables de entorno requeridas:
 *   SUPABASE_URL        — URL del proyecto Supabase
 *   SUPABASE_SERVICE_KEY — Service-role key (bypasea RLS)
 */

import { createClient } from '@supabase/supabase-js';

// ── Constantes de configuración ───────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BUCKET   = 'portadas';   // Nombre del bucket en Supabase Storage
const MAX_MB   = 50;           // Límite de tamaño en megabytes
const ALLOWED  = ['jpeg','jpg','png','webp','heic','heif'];  // Extensiones válidas

// ── Helper para respuestas JSON ───────────────────────────────────────────────
/**
 * Crea una Response con body JSON y las cabeceras CORS correctas.
 *
 * @param {object} body   — Objeto a serializar como JSON
 * @param {number} status — Código HTTP (default: 200)
 * @returns {Response}
 */
function jsonRes(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// ── Handler POST ──────────────────────────────────────────────────────────────
/**
 * Procesa la imagen recibida (FormData o JSON base64), valida tipo y tamaño,
 * y la sube al bucket de Supabase con una ruta única basada en timestamp.
 *
 * Ruta de almacenamiento: `proveedores/<timestamp>-<random>.<ext>`
 *
 * @param {EventContext} ctx — Contexto de Cloudflare Pages
 * @returns {Response}
 */
export async function onRequestPost(ctx) {
  const supabase = createClient(ctx.env.SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);

  try {
    const ct = (ctx.request.headers.get('content-type') || '').toLowerCase();
    let bytes, mimeType, fileName;

    // ── Rama 1: FormData (subida nativa desde móvil) ──────────────────────────
    if (ct.includes('multipart/form-data')) {
      const form = await ctx.request.formData();
      const file = form.get('file');
      if (!file || !file.name) return jsonRes({ error: 'No se recibió archivo.' }, 400);
      mimeType = file.type || 'image/jpeg';
      fileName = file.name;
      bytes    = new Uint8Array(await file.arrayBuffer());

    // ── Rama 2: JSON con imagen en base64 (panel de administración web) ───────
    } else {
      let body;
      try { body = await ctx.request.json(); }
      catch { return jsonRes({ error: 'Cuerpo no válido.' }, 400); }

      const { imageBase64, fileName: fn, mimeType: mt } = body;
      if (!imageBase64 || !fn || !mt) return jsonRes({ error: 'Faltan campos.' }, 400);

      mimeType = mt;
      fileName = fn;

      // Eliminar el prefijo "data:image/...;base64," si viene incluido
      const b64 = imageBase64.replace(/^data:image\/[^;]+;base64,/, '');
      try {
        const s = atob(b64);
        bytes = new Uint8Array(s.length);
        for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
      } catch { return jsonRes({ error: 'Error decodificando base64.' }, 400); }
    }

    // ── Validación de tipo de archivo ─────────────────────────────────────────
    const rawExt = (fileName.split('.').pop() || 'jpg').toLowerCase();
    if (!ALLOWED.includes(rawExt) && !ALLOWED.includes(mimeType.split('/')[1])) {
      return jsonRes({ error: 'Tipo no permitido. Usa JPG, PNG o WebP.' }, 400);
    }

    // ── Validación de tamaño ──────────────────────────────────────────────────
    if (bytes.length / (1024 * 1024) > MAX_MB) {
      return jsonRes({ error: `La imagen supera los ${MAX_MB}MB.` }, 400);
    }

    // ── Normalización de extensión ────────────────────────────────────────────
    // HEIC/HEIF se convierten a JPG para compatibilidad con navegadores web
    const extMap = { jpeg:'jpg', jpg:'jpg', png:'png', webp:'webp', heic:'jpg', heif:'jpg' };
    const ext      = extMap[rawExt] || 'jpg';
    const saveMime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

    // Ruta única para evitar colisiones entre subidas simultáneas
    const path = `proveedores/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // ── Subida a Supabase Storage ─────────────────────────────────────────────
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: saveMime, upsert: false });
    if (upErr) throw upErr;

    // Obtener la URL pública del archivo subido
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return jsonRes({ ok: true, url: urlData.publicUrl });

  } catch (err) {
    console.error('upload-image:', err);
    return jsonRes({ error: err.message || 'Error interno.' }, 500);
  }
}

// ── Handler OPTIONS (preflight CORS) ─────────────────────────────────────────
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
