// functions/api/get-providers.js — categorías dinámicas desde Supabase

import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

export async function onRequest(ctx) {
  if (ctx.request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const supabase = createClient(ctx.env.SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);

  try {
    // Load providers
    const { data: providers, error: provErr } = await supabase
      .from('proveedores').select('*').eq('activo', true)
      .order('categoria', { ascending: true })
      .order('posicion', { ascending: true });
    if (provErr) throw provErr;

    // Try to load dynamic categories from DB; fall back to hardcoded if table doesn't exist
    let grupos = [];
    try {
      const { data: cats, error: catErr } = await supabase
        .from('categorias').select('*').order('orden', { ascending: true });
      const { data: tags } = await supabase
        .from('etiquetas').select('*').order('categoria_id').order('orden', { ascending: true });

      if (!catErr && cats?.length) {
        grupos = buildGruposDynamic(providers, cats, tags || []);
      } else {
        grupos = buildGruposStatic(providers);
      }
    } catch {
      grupos = buildGruposStatic(providers);
    }

    return new Response(JSON.stringify({ providers, grupos }), { headers: CORS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
}

function buildGruposDynamic(providers, cats, tags) {
  return cats.map(cat => {
    const catTags = tags.filter(t => t.categoria_id === cat.id);
    const categorias = catTags.map(tag => {
      const tagProviders = providers.filter(p =>
        p.etiqueta_id === tag.id || p.categoria === tag.id
      );
      return {
        id:     tag.id,
        ico:    tag.ico || '🏷️',
        nombre: tag.nombre,
        desc:   tag.descripcion || '',
        proveedores: tagProviders.map(mapProvider),
      };
    });

    // Also include providers whose categoria matches cat.id but no etiqueta_id
    const orphanProviders = providers.filter(p =>
      p.categoria === cat.id && !p.etiqueta_id &&
      !catTags.some(t => t.id === p.categoria)
    );

    if (orphanProviders.length && !categorias.some(c => c.id === cat.id)) {
      categorias.push({
        id:     cat.id,
        ico:    cat.ico || '🍽️',
        nombre: cat.nombre,
        desc:   cat.descripcion || '',
        proveedores: orphanProviders.map(mapProvider),
      });
    }

    return {
      id:         cat.id,
      ico:        cat.ico || '🍽️',
      nombre:     cat.nombre,
      categorias: categorias.filter(c => c.proveedores.length > 0 || catTags.length > 0),
    };
  }).filter(g => g.categorias.length > 0);
}

// Fallback: hardcoded categories (backward compatibility)
function buildGruposStatic(providers) {
  const CATEGORIAS = {
    banqueteria:  { ico: '🍽️', nombre: 'Banquetería',          desc: 'Servicio completo de banquetes y gastronomía' },
    pizzas:       { ico: '🍕', nombre: 'Catering Pizzas',       desc: 'Pizzas al horno de leña para eventos' },
    hamburguesas: { ico: '🍔', nombre: 'Catering Hamburguesas', desc: 'Hamburguesas gourmet para eventos' },
    churrascos:   { ico: '🥩', nombre: 'Catering Churrascos',   desc: 'Parrilla y carnes asadas para eventos' },
    completos:    { ico: '🌭', nombre: 'Catering Completos',    desc: 'Completos y hot dogs para eventos' },
    torta:        { ico: '🎂', nombre: 'Torta y Postres',       desc: 'Tortas personalizadas y mesas de postres' },
    barra:        { ico: '🍹', nombre: 'Barra de Tragos',       desc: 'Coctelería profesional y bar móvil' },
  };
  const map = {};
  providers.forEach(p => {
    if (!map[p.categoria]) {
      map[p.categoria] = {
        id:         p.categoria,
        ico:        CATEGORIAS[p.categoria]?.ico || '🍽️',
        nombre:     CATEGORIAS[p.categoria]?.nombre || p.categoria,
        desc:       CATEGORIAS[p.categoria]?.desc || '',
        proveedores: [],
      };
    }
    map[p.categoria].proveedores.push(mapProvider(p));
  });
  return [{ id: 'catering', ico: '🍽️', nombre: 'Catering', categorias: Object.values(map) }];
}

function mapProvider(p) {
  return {
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
  };
}
