// functions/api/upload-image.js
// Cloudflare Pages Function — reemplaza netlify/functions/upload-image.js

import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const BUCKET = 'portadas';
const MAX_SIZE_MB = 5;

export async function onRequestPost(ctx) {
  const supabase = createClient(ctx.env.SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);

  try {
    const { imageBase64, fileName, mimeType } = await ctx.request.json();

    if (!imageBase64 || !fileName || !mimeType) {
      return new Response(JSON.stringify({ error: 'Faltan campos: imageBase64, fileName, mimeType' }), { status: 400, headers: CORS });
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(mimeType)) {
      return new Response(JSON.stringify({ error: 'Tipo no permitido. Usa JPG, PNG o WebP.' }), { status: 400, headers: CORS });
    }

    // Convertir base64 a Uint8Array (Cloudflare Workers no tiene Buffer)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

    if (bytes.length / (1024 * 1024) > MAX_SIZE_MB) {
      return new Response(JSON.stringify({ error: `Imagen supera los ${MAX_SIZE_MB}MB.` }), { status: 400, headers: CORS });
    }

    const ext = fileName.split('.').pop().toLowerCase();
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `proveedores/${uniqueName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, bytes, { contentType: mimeType, upsert: false });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    return new Response(JSON.stringify({ ok: true, url: urlData.publicUrl }), { headers: CORS });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
