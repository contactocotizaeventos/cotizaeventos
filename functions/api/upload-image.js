// functions/api/upload-image.js
// Acepta tanto JSON (base64) como FormData (móvil nativo)

import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BUCKET   = 'portadas';
const MAX_MB   = 50;
const ALLOWED  = ['jpeg','jpg','png','webp','heic','heif'];

function jsonRes(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(ctx) {
  const supabase = createClient(ctx.env.SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);

  try {
    const ct = (ctx.request.headers.get('content-type') || '').toLowerCase();
    let bytes, mimeType, fileName;

    if (ct.includes('multipart/form-data')) {
      // ── FormData (móvil nativo) ──
      const form = await ctx.request.formData();
      const file = form.get('file');
      if (!file || !file.name) return jsonRes({ error: 'No se recibió archivo.' }, 400);
      mimeType = file.type || 'image/jpeg';
      fileName = file.name;
      bytes    = new Uint8Array(await file.arrayBuffer());
    } else {
      // ── JSON con base64 (desktop) ──
      let body;
      try { body = await ctx.request.json(); }
      catch { return jsonRes({ error: 'Cuerpo no válido.' }, 400); }

      const { imageBase64, fileName: fn, mimeType: mt } = body;
      if (!imageBase64 || !fn || !mt) return jsonRes({ error: 'Faltan campos.' }, 400);

      mimeType = mt;
      fileName = fn;
      const b64 = imageBase64.replace(/^data:image\/[^;]+;base64,/, '');
      try {
        const s = atob(b64);
        bytes = new Uint8Array(s.length);
        for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
      } catch { return jsonRes({ error: 'Error decodificando base64.' }, 400); }
    }

    const rawExt = (fileName.split('.').pop() || 'jpg').toLowerCase();
    if (!ALLOWED.includes(rawExt) && !ALLOWED.includes(mimeType.split('/')[1])) {
      return jsonRes({ error: 'Tipo no permitido. Usa JPG, PNG o WebP.' }, 400);
    }
    if (bytes.length / (1024 * 1024) > MAX_MB) {
      return jsonRes({ error: `La imagen supera los ${MAX_MB}MB.` }, 400);
    }

    const extMap = { jpeg:'jpg', jpg:'jpg', png:'png', webp:'webp', heic:'jpg', heif:'jpg' };
    const ext      = extMap[rawExt] || 'jpg';
    const saveMime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    const path     = `proveedores/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: saveMime, upsert: false });
    if (upErr) throw upErr;

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return jsonRes({ ok: true, url: urlData.publicUrl });

  } catch (err) {
    console.error('upload-image:', err);
    return jsonRes({ error: err.message || 'Error interno.' }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
