// functions/api/admin-manage.js
// Cloudflare Pages Function — reemplaza netlify/functions/admin-manage.js

import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

export async function onRequest(ctx) {
  if (ctx.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  // Verificar token
  const authError = await verifyToken(ctx.request.headers.get('authorization'), ctx.env.ADMIN_SECRET);
  if (authError) return new Response(JSON.stringify({ error: authError }), { status: 401, headers: CORS });

  const supabase = createClient(ctx.env.SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);
  const method = ctx.request.method;
  const url = new URL(ctx.request.url);

  try {
    if (method === 'GET')    return await handleGet(supabase, url);
    if (method === 'POST')   return await handlePost(supabase, ctx.request);
    if (method === 'PUT')    return await handlePut(supabase, ctx.request);
    if (method === 'DELETE') return await handleDelete(supabase, ctx.request);
    return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405, headers: CORS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
}

async function handleGet(supabase, url) {
  const action = url.searchParams.get('action');

  if (action === 'solicitudes') {
    const { data, error } = await supabase.from('solicitudes').select('*').order('fecha_registro', { ascending: false });
    if (error) throw error;
    return new Response(JSON.stringify({ solicitudes: data }), { headers: CORS });
  }

  if (action === 'proveedores') {
    const { data, error } = await supabase.from('proveedores').select('*').order('categoria').order('posicion');
    if (error) throw error;
    return new Response(JSON.stringify({ proveedores: data }), { headers: CORS });
  }

  return new Response(JSON.stringify({ error: 'Acción no reconocida' }), { status: 400, headers: CORS });
}

async function handlePost(supabase, request) {
  const body = await request.json();
  const { action, id } = body;

  if (action === 'aprobar') {
    const { data: sol, error: solErr } = await supabase.from('solicitudes').select('*').eq('id', id).single();
    if (solErr) throw solErr;

    const primaryCat = Array.isArray(sol.categorias) ? sol.categorias[0] : sol.categorias;
    const { data: existing } = await supabase.from('proveedores').select('posicion').eq('categoria', primaryCat).order('posicion', { ascending: false }).limit(1);
    const nextPos = body.posicion || (existing?.[0]?.posicion ? existing[0].posicion + 1 : 4);

    const { data: prov, error: provErr } = await supabase.from('proveedores').insert([{
      nombre:           sol.nombre,
      responsable:      sol.responsable,
      descripcion:      sol.descripcion,
      diferenciador:    sol.diferenciador,
      tagline:          sol.diferenciador,
      experiencia:      sol.experiencia,
      capacidad:        sol.capacidad,
      categoria:        primaryCat,
      comunas:          sol.comunas,
      precio_minimo:    sol.precio_minimo,
      precio_maximo:    sol.precio_maximo,
      incluye:          sol.incluye,
      no_incluye:       sol.no_incluye,
      whatsapp:         sol.whatsapp,
      telefono:         sol.telefono,
      email:            sol.email,
      web:              sol.web,
      instagram:        sol.instagram,
      facebook:         sol.facebook,
      tiktok:           sol.tiktok,
      youtube:          sol.youtube,
      logo_emoji:       sol.logo_emoji || '🍽️',
      logo_url:         sol.logo_url || '',
      cover_url:        sol.cover_url || '',
      posicion:         nextPos,
      activo:           true,
      solicitud_id:     sol.id,
      fecha_aprobacion: new Date().toISOString(),
    }]).select().single();
    if (provErr) throw provErr;

    await supabase.from('solicitudes').update({ estado: 'aprobada', proveedor_id: prov.id }).eq('id', id);
    return new Response(JSON.stringify({ ok: true, proveedor: prov }), { headers: CORS });
  }

  if (action === 'rechazar') {
    const { error } = await supabase.from('solicitudes').delete().eq('id', id);
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true }), { headers: CORS });
  }

  return new Response(JSON.stringify({ error: 'Acción no reconocida' }), { status: 400, headers: CORS });
}

async function handlePut(supabase, request) {
  const { id, fields } = await request.json();
  if (!id || !fields) return new Response(JSON.stringify({ error: 'Faltan id o fields' }), { status: 400, headers: CORS });

  const ALLOWED = [
    'nombre','tagline','descripcion','diferenciador','experiencia','capacidad',
    'categoria','comunas','precio_minimo','precio_maximo','incluye','no_incluye',
    'whatsapp','telefono','email','web','instagram','facebook','tiktok','youtube',
    'logo_emoji','logo_url','cover_url','posicion','activo',
  ];

  const sanitized = {};
  ALLOWED.forEach(k => { if (fields[k] !== undefined) sanitized[k] = fields[k]; });

  const { data, error } = await supabase.from('proveedores').update(sanitized).eq('id', id).select().single();
  if (error) throw error;

  return new Response(JSON.stringify({ ok: true, proveedor: data }), { headers: CORS });
}

async function handleDelete(supabase, request) {
  const { id } = await request.json();
  if (!id) return new Response(JSON.stringify({ error: 'Falta id' }), { status: 400, headers: CORS });

  const { error } = await supabase.from('proveedores').delete().eq('id', id);
  if (error) throw error;

  return new Response(JSON.stringify({ ok: true }), { headers: CORS });
}

// ── Token verification (Web Crypto) ──
async function verifyToken(authHeader, secret) {
  if (!authHeader?.startsWith('Bearer ')) return 'Token requerido';
  const token = authHeader.slice(7);
  const parts = token.split('.');
  if (parts.length !== 2) return 'Token inválido';

  const [payloadB64, sig] = parts;
  const expectedSig = await hmacSign(secret, payloadB64);
  if (sig !== expectedSig) return 'Firma inválida';

  try {
    const payload = JSON.parse(atob(payloadB64));
    if (payload.exp < Date.now()) return 'Token expirado';
  } catch { return 'Token malformado'; }

  return null;
}

async function hmacSign(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}
