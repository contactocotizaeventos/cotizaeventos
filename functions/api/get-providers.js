// functions/api/get-providers.js
// Cloudflare Pages Function — reemplaza netlify/functions/get-providers.js

import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

export async function onRequest(ctx) {
  if (ctx.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  const supabase = createClient(
    ctx.env.SUPABASE_URL,
    ctx.env.SUPABASE_SERVICE_KEY
  );

  try {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .eq('activo', true)
      .order('categoria', { ascending: true })
      .order('posicion', { ascending: true });

    if (error) throw error;

    const grupos = groupByCategoria(data);
    return new Response(JSON.stringify({ providers: data, grupos }), { headers: CORS });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
}

function groupByCategoria(providers) {
  const CATEGORIAS = {
    banqueteria:  { ico: '🍽️', nombre: 'Banquetería',         desc: 'Servicio completo de banquetes y gastronomía de alto nivel' },
    pizzas:       { ico: '🍕', nombre: 'Catering Pizzas',      desc: 'Pizzas al horno de leña para todo tipo de eventos' },
    hamburguesas: { ico: '🍔', nombre: 'Catering Hamburguesas', desc: 'Hamburguesas gourmet para eventos' },
    churrascos:   { ico: '🥩', nombre: 'Catering Churrascos',  desc: 'Parrilla y carnes asadas para eventos' },
    completos:    { ico: '🌭', nombre: 'Catering Completos',   desc: 'Completos y hot dogs para todo tipo de eventos' },
    torta:        { ico: '🎂', nombre: 'Torta y Postres',      desc: 'Tortas personalizadas y mesas de postres' },
    barra:        { ico: '🍹', nombre: 'Barra de Tragos',      desc: 'Coctelería profesional y bar móvil' },
  };

  const map = {};
  providers.forEach(p => {
    if (!map[p.categoria]) {
      map[p.categoria] = {
        id: p.categoria,
        ico: CATEGORIAS[p.categoria]?.ico || '🍽️',
        nombre: CATEGORIAS[p.categoria]?.nombre || p.categoria,
        desc: CATEGORIAS[p.categoria]?.desc || '',
        proveedores: [],
      };
    }
    map[p.categoria].proveedores.push({
      id:          p.id,
      pos:         p.posicion,
      logo:        p.logo_emoji || '🍽️',
      logo_url:    p.logo_url || '',
      cover_url:   p.cover_url || '',
      nombre:      p.nombre,
      tagline:     p.tagline || p.diferenciador || '',
      desc:        p.descripcion,
      diff:        p.diferenciador,
      minimo:      p.precio_minimo,
      maximo:      p.precio_maximo,
      comunas:     p.comunas,
      wa:          p.whatsapp,
      instagram:   p.instagram || '',
      facebook:    p.facebook || '',
      web:         p.web || '',
      experiencia: p.experiencia || '',
      capacidad:   p.capacidad || '',
      incluye:     p.incluye || '',
    });
  });

  return [{ id: 'catering', ico: '🍽️', nombre: 'Catering', categorias: Object.values(map) }];
}
