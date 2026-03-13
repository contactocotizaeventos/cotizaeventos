// functions/api/submit-form.js
// Cloudflare Pages Function — reemplaza netlify/functions/submit-form.js

import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

export async function onRequestPost(ctx) {
  const supabase = createClient(ctx.env.SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);

  try {
    const body = await ctx.request.json();

    if (!body.nombre || !body.whatsapp || !body.email) {
      return new Response(JSON.stringify({ error: 'Faltan campos obligatorios: nombre, whatsapp, email' }), { status: 400, headers: CORS });
    }

    const { data, error } = await supabase.from('solicitudes').insert([{
      nombre:           body.nombre,
      responsable:      body.responsable || '',
      rut:              body.rut || '',
      descripcion:      body.descripcion || '',
      diferenciador:    body.diferenciador || '',
      experiencia:      body.experiencia || '',
      capacidad:        body.capacidad || '',
      categorias:       body.categorias || [],
      comunas:          body.comunas || '',
      precio_minimo:    body.precio_minimo || '',
      precio_maximo:    body.precio_maximo || '',
      incluye:          body.incluye || '',
      no_incluye:       body.no_incluye || '',
      anticipacion:     body.anticipacion || '',
      anticipo:         body.anticipo || '',
      whatsapp:         body.whatsapp,
      telefono:         body.telefono || '',
      email:            body.email,
      web:              body.web || '',
      instagram:        body.instagram || '',
      facebook:         body.facebook || '',
      tiktok:           body.tiktok || '',
      youtube:          body.youtube || '',
      direccion:        body.direccion || '',
      posicion_deseada: body.posicion_deseada || '',
      logo_url:         body.logo_url || '',
      cover_url:        body.cover_url || '',
      logo_emoji:       body.logo_emoji || '🍽️',
      comentarios:      body.comentarios || '',
      estado:           'pendiente',
      fecha_registro:   new Date().toISOString(),
    }]).select().single();

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, id: data.id }), { headers: CORS });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
