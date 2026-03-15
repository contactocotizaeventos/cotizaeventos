/**
 * functions/api/get-providers.js
 * Cloudflare Pages Function — GET /api/get-providers
 *
 * Retorna todos los proveedores activos agrupados por categoría.
 * Intenta cargar las categorías dinámicamente desde Supabase (tablas
 * `categorias` y `etiquetas`). Si las tablas no existen, usa la jerarquía
 * estática como respaldo.
 *
 * Respuesta exitosa (200):
 *   { providers: Proveedor[], grupos: Grupo[] }
 *
 * Variables de entorno requeridas:
 *   SUPABASE_URL        — URL del proyecto Supabase
 *   SUPABASE_SERVICE_KEY — Service-role key (bypasea RLS)
 */

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
    // 1. Proveedores activos
    const { data: providers, error: provErr } = await supabase
      .from('proveedores').select('*').eq('activo', true)
      .order('categoria', { ascending: true })
      .order('posicion',  { ascending: true });
    if (provErr) throw provErr;

    // 2. Categorías y etiquetas desde la DB
    const { data: cats, error: catErr } = await supabase
      .from('categorias').select('*').order('orden', { ascending: true });
    if (catErr) throw catErr;

    const { data: tags, error: tagErr } = await supabase
      .from('etiquetas').select('*').order('categoria_id').order('orden', { ascending: true });
    if (tagErr) throw tagErr;

    const grupos = buildGrupos(providers, cats, tags);

    return new Response(JSON.stringify({ providers, grupos }), { headers: CORS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
}

/**
 * Construye la jerarquía Grupo → Categoría → Proveedores
 * usando exclusivamente los datos de la base de datos.
 */
function buildGrupos(providers, cats, tags) {
  return cats.map(cat => {
    const catTags = tags.filter(t => t.categoria_id === cat.id);

    const categorias = catTags.map(tag => {
      const tagProviders = providers.filter(p =>
        p.etiqueta_id === tag.id || p.categoria === tag.id
      );
      return {
        id:          tag.id,
        ico:         tag.ico || '',
        nombre:      tag.nombre,
        desc:        tag.descripcion || '',
        proveedores: tagProviders.map(mapProvider),
      };
    });

    // Proveedores cuya categoria coincide con el grupo pero sin etiqueta_id
    const orphans = providers.filter(p =>
      p.categoria === cat.id && !p.etiqueta_id &&
      !catTags.some(t => t.id === p.categoria)
    );
    if (orphans.length && !categorias.some(c => c.id === cat.id)) {
      categorias.push({
        id:          cat.id,
        ico:         cat.ico || '',
        nombre:      cat.nombre,
        desc:        cat.descripcion || '',
        proveedores: orphans.map(mapProvider),
      });
    }

    return {
      id:         cat.id,
      ico:        cat.ico || '',
      nombre:     cat.nombre,
      categorias,
    };
  }).filter(g => g.categorias.length > 0);
}

/**
 * Mapea una fila de la tabla `proveedores` al objeto que consume el frontend.
 * pos: 0 = Básico, 1 = Destacado
 */
function mapProvider(p) {
  return {
    id:          p.id,
    pos:         p.posicion,
    logo:        p.logo_emoji || '',
    logo_url:    p.logo_url   || '',
    cover_url:   p.cover_url  || '',
    nombre:      p.nombre,
    tagline:     p.tagline || p.diferenciador || '',
    desc:        p.descripcion || '',
    diff:        p.diferenciador || '',
    minimo:      p.precio_minimo  || '',
    maximo:      p.precio_maximo  || '',
    comunas:     p.comunas        || '',
    wa:          p.whatsapp       || '',
    instagram:   p.instagram      || '',
    facebook:    p.facebook       || '',
    web:         p.web            || '',
    experiencia: p.experiencia    || '',
    capacidad:   p.capacidad      || '',
    incluye:     p.incluye        || '',
  };
}