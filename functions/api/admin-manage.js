/**
 * functions/api/admin-manage.js
 * Cloudflare Pages Function — /api/admin-manage
 *
 * Panel de administración: CRUD completo para solicitudes, proveedores,
 * categorías y etiquetas. Todas las rutas requieren un token de sesión
 * válido en el header `Authorization: Bearer <token>`.
 *
 * Métodos soportados:
 *   GET    ?action=solicitudes  → lista solicitudes pendientes
 *   GET    ?action=proveedores  → lista todos los proveedores
 *   GET    ?action=categorias   → lista grupos con etiquetas y conteos
 *   POST   { action: 'aprobar' | 'rechazar' | 'create_categoria' | ... }
 *   PUT    { id, fields }        → actualiza campos de un proveedor
 *   DELETE { id }                → elimina un proveedor
 *
 * Variables de entorno requeridas:
 *   SUPABASE_URL        — URL del proyecto Supabase
 *   SUPABASE_SERVICE_KEY — Service-role key (bypasea RLS)
 *   ADMIN_SECRET        — String usado para verificar la firma del token
 */

import { createClient } from '@supabase/supabase-js';

// ── Cabeceras CORS ────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

// ── Handler principal ─────────────────────────────────────────────────────────
/**
 * Punto de entrada único. Verifica el token, luego enruta al handler
 * correspondiente según el método HTTP.
 *
 * @param {EventContext} ctx — Contexto de Cloudflare Pages
 * @returns {Response}
 */
export async function onRequest(ctx) {
  // Preflight CORS
  if (ctx.request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  // ── Verificación de token de sesión ───────────────────────────────────────
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

// ── GET: Consultas de lectura ─────────────────────────────────────────────────
/**
 * Maneja las consultas GET según el parámetro `action`:
 * - `solicitudes`: lista todas las solicitudes ordenadas por fecha descendente.
 * - `proveedores`: lista todos los proveedores ordenados por categoría y posición.
 * - `categorias`:  lista grupos con sus etiquetas, incluyendo cantidad de proveedores por etiqueta.
 *
 * @param {SupabaseClient} supabase
 * @param {URL} url — URL con el parámetro `action`
 * @returns {Response}
 */
async function handleGet(supabase, url) {
  const action = url.searchParams.get('action');

  // ── Listar solicitudes ────────────────────────────────────────────────────
  if (action === 'solicitudes') {
    const { data, error } = await supabase.from('solicitudes').select('*').order('fecha_registro', { ascending: false });
    if (error) throw error;
    return new Response(JSON.stringify({ solicitudes: data }), { headers: CORS });
  }

  // ── Listar proveedores ────────────────────────────────────────────────────
  if (action === 'proveedores') {
    const { data, error } = await supabase.from('proveedores').select('*').order('categoria').order('posicion');
    if (error) throw error;
    return new Response(JSON.stringify({ proveedores: data }), { headers: CORS });
  }

  // ── Listar categorías con etiquetas y conteos ────────────────────────────
  if (action === 'categorias') {
    const { data: cats, error: catErr } = await supabase.from('categorias').select('*').order('orden', { ascending: true });
    if (catErr) throw catErr;

    const { data: tags, error: tagErr } = await supabase.from('etiquetas').select('*').order('categoria_id').order('orden', { ascending: true });
    if (tagErr) throw tagErr;

    // Construir mapa etiqueta_id → cantidad de proveedores activos
    const { data: provs } = await supabase.from('proveedores').select('etiqueta_id').eq('activo', true);
    const countMap = {};
    (provs || []).forEach(p => { if (p.etiqueta_id) countMap[p.etiqueta_id] = (countMap[p.etiqueta_id] || 0) + 1; });

    // Anidar etiquetas dentro de su categoría con el conteo incluido
    const categorias = (cats || []).map(cat => ({
      ...cat,
      etiquetas: (tags || []).filter(t => t.categoria_id === cat.id).map(t => ({ ...t, proveedores_count: countMap[t.id] || 0 })),
    }));
    return new Response(JSON.stringify({ categorias }), { headers: CORS });
  }

  return new Response(JSON.stringify({ error: 'Acción no reconocida' }), { status: 400, headers: CORS });
}

// ── POST: Acciones de escritura ───────────────────────────────────────────────
/**
 * Maneja todas las acciones POST según el campo `action` del body:
 *
 * - `aprobar`:          convierte una solicitud en proveedor activo.
 * - `rechazar`:         elimina una solicitud sin aprobarla.
 * - `create_categoria`: crea un nuevo grupo de categorías.
 * - `update_categoria`: edita nombre, ícono y descripción de un grupo.
 * - `delete_categoria`: elimina el grupo y sus etiquetas (cascade).
 * - `create_etiqueta`:  crea una nueva etiqueta dentro de un grupo.
 * - `update_etiqueta`:  edita nombre, ícono y descripción de una etiqueta.
 * - `delete_etiqueta`:  elimina una etiqueta.
 *
 * @param {SupabaseClient} supabase
 * @param {Request} request
 * @returns {Response}
 */
async function handlePost(supabase, request) {
  const body = await request.json();
  const { action } = body;

  // ── Aprobar solicitud → crear proveedor ───────────────────────────────────
  if (action === 'aprobar') {
    // 1. Leer la solicitud original
    const { data: sol, error: solErr } = await supabase.from('solicitudes').select('*').eq('id', body.id).single();
    if (solErr) throw solErr;

    // 2. Obtener la categoría primaria de la solicitud
    const rawCat = Array.isArray(sol.categorias) ? sol.categorias[0] : sol.categorias;

    // 3. Resolver el slug correcto buscando en etiquetas por nombre o id
    let primaryCat = rawCat || '';
    if (rawCat) {
      const { data: etiquetas } = await supabase.from('etiquetas').select('id, nombre');
      if (etiquetas?.length) {
        const match = etiquetas.find(e =>
          e.nombre.toLowerCase() === rawCat.toLowerCase() ||
          e.id.toLowerCase() === rawCat.toLowerCase()
        );
        if (match) {
          primaryCat = match.id;  // usar siempre el slug/id correcto
        } else {
          // Fallback: convertir nombre a slug eliminando tildes y caracteres especiales
          primaryCat = rawCat.toLowerCase()
            .replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i').replace(/ó/g,'o').replace(/ú/g,'u')
            .replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
        }
      }
    }

    // 4. Calcular la posición: usar la indicada por el admin o autoasignar la siguiente
    const { data: existing } = await supabase.from('proveedores').select('posicion').eq('categoria', primaryCat).order('posicion', { ascending: false }).limit(1);
    // posicion: 0=Básico, 1=Destacado
    const nextPos = (body.posicion !== undefined && body.posicion !== null)
      ? body.posicion
      : (existing?.[0]?.posicion ? existing[0].posicion + 1 : 0);

    // 5. Insertar el nuevo proveedor
    const { data: prov, error: provErr } = await supabase.from('proveedores').insert([{
      nombre: sol.nombre, responsable: sol.responsable, descripcion: sol.descripcion,
      diferenciador: sol.diferenciador, tagline: sol.diferenciador,
      experiencia: sol.experiencia, capacidad: sol.capacidad,
      categoria: primaryCat, comunas: sol.comunas,
      precio_minimo: sol.precio_minimo, precio_maximo: sol.precio_maximo,
      incluye: sol.incluye, no_incluye: sol.no_incluye,
      whatsapp: sol.whatsapp, telefono: sol.telefono, email: sol.email,
      web: sol.web, instagram: sol.instagram, facebook: sol.facebook,
      tiktok: sol.tiktok, youtube: sol.youtube,
      logo_emoji: sol.logo_emoji || '🍽️', logo_url: sol.logo_url || '',
      cover_url: sol.cover_url || '', posicion: nextPos, activo: true,
      solicitud_id: sol.id, fecha_aprobacion: new Date().toISOString(),
    }]).select().single();
    if (provErr) throw provErr;

    // 6. Marcar la solicitud como aprobada y vincularla al proveedor creado
    await supabase.from('solicitudes').update({ estado: 'aprobada', proveedor_id: prov.id }).eq('id', body.id);
    return new Response(JSON.stringify({ ok: true, proveedor: prov }), { headers: CORS });
  }

  // ── Rechazar solicitud (eliminar registro) ────────────────────────────────
  if (action === 'rechazar') {
    const { error } = await supabase.from('solicitudes').delete().eq('id', body.id);
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true }), { headers: CORS });
  }

  // ── Crear categoría ───────────────────────────────────────────────────────
  if (action === 'create_categoria') {
    // Generar slug automáticamente si no se provee uno explícito
    const slug = (body.id_slug || body.nombre.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
    // El orden es el siguiente al último en la tabla
    const { data: maxOrd } = await supabase.from('categorias').select('orden').order('orden', { ascending: false }).limit(1);
    const orden = (maxOrd?.[0]?.orden || 0) + 1;
    const { data, error } = await supabase.from('categorias').insert([{ id: slug, nombre: body.nombre, ico: body.ico || '🍽️', descripcion: body.desc || '', orden }]).select().single();
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true, categoria: data }), { headers: CORS });
  }

  // ── Actualizar categoría ──────────────────────────────────────────────────
  if (action === 'update_categoria') {
    const { error } = await supabase.from('categorias').update({ nombre: body.nombre, ico: body.ico, descripcion: body.desc }).eq('id', body.id);
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true }), { headers: CORS });
  }

  // ── Eliminar categoría (y sus etiquetas en cascada) ───────────────────────
  if (action === 'delete_categoria') {
    // Primero eliminamos las etiquetas manualmente (la FK tiene ON DELETE CASCADE,
    // pero lo hacemos explícito para mayor claridad)
    await supabase.from('etiquetas').delete().eq('categoria_id', body.id);
    const { error } = await supabase.from('categorias').delete().eq('id', body.id);
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true }), { headers: CORS });
  }

  // ── Crear etiqueta ────────────────────────────────────────────────────────
  if (action === 'create_etiqueta') {
    const slug = (body.id_slug || body.nombre.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
    // El orden es relativo dentro de la misma categoría
    const { data: maxOrd } = await supabase.from('etiquetas').select('orden').eq('categoria_id', body.cat_id).order('orden', { ascending: false }).limit(1);
    const orden = (maxOrd?.[0]?.orden || 0) + 1;
    const { data, error } = await supabase.from('etiquetas').insert([{ id: slug, nombre: body.nombre, ico: body.ico || '🏷️', descripcion: body.desc || '', categoria_id: body.cat_id, orden }]).select().single();
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true, etiqueta: data }), { headers: CORS });
  }

  // ── Actualizar etiqueta ───────────────────────────────────────────────────
  if (action === 'update_etiqueta') {
    const { error } = await supabase.from('etiquetas').update({ nombre: body.nombre, ico: body.ico, descripcion: body.desc }).eq('id', body.id).eq('categoria_id', body.cat_id);
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true }), { headers: CORS });
  }

  // ── Eliminar etiqueta ─────────────────────────────────────────────────────
  if (action === 'delete_etiqueta') {
    const { error } = await supabase.from('etiquetas').delete().eq('id', body.id).eq('categoria_id', body.cat_id);
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true }), { headers: CORS });
  }

  return new Response(JSON.stringify({ error: 'Acción no reconocida' }), { status: 400, headers: CORS });
}

// ── PUT: Actualizar campos de un proveedor ────────────────────────────────────
/**
 * Actualiza campos específicos de un proveedor existente.
 * Solo permite modificar los campos definidos en la lista `ALLOWED` para
 * evitar que el cliente modifique columnas sensibles como `id` o `solicitud_id`.
 *
 * Body esperado: { id: string, fields: { campo: valor, ... } }
 *
 * @param {SupabaseClient} supabase
 * @param {Request} request
 * @returns {Response}
 */
async function handlePut(supabase, request) {
  const { id, fields } = await request.json();
  if (!id || !fields) return new Response(JSON.stringify({ error: 'Faltan id o fields' }), { status: 400, headers: CORS });

  // Lista blanca de campos editables desde el admin
  const ALLOWED = ['nombre','tagline','descripcion','diferenciador','experiencia','capacidad','categoria','etiqueta_id','comunas','precio_minimo','precio_maximo','incluye','no_incluye','whatsapp','telefono','email','web','instagram','facebook','tiktok','youtube','logo_emoji','logo_url','cover_url','posicion','activo'];

  // Filtrar solo los campos que están en la lista blanca
  const sanitized = {};
  ALLOWED.forEach(k => { if (fields[k] !== undefined) sanitized[k] = fields[k]; });

  const { data, error } = await supabase.from('proveedores').update(sanitized).eq('id', id).select().single();
  if (error) throw error;
  return new Response(JSON.stringify({ ok: true, proveedor: data }), { headers: CORS });
}

// ── DELETE: Eliminar un proveedor ─────────────────────────────────────────────
/**
 * Elimina permanentemente un proveedor de la base de datos.
 * No elimina la solicitud original ni las imágenes en Storage.
 *
 * Body esperado: { id: string }
 *
 * @param {SupabaseClient} supabase
 * @param {Request} request
 * @returns {Response}
 */
async function handleDelete(supabase, request) {
  const { id } = await request.json();
  if (!id) return new Response(JSON.stringify({ error: 'Falta id' }), { status: 400, headers: CORS });
  const { error } = await supabase.from('proveedores').delete().eq('id', id);
  if (error) throw error;
  return new Response(JSON.stringify({ ok: true }), { headers: CORS });
}

// ── Verificación de token ─────────────────────────────────────────────────────
/**
 * Verifica que el header de autorización contenga un token válido, no expirado
 * y firmado con el secreto correcto.
 *
 * Formato esperado del token: `<payloadBase64>.<firmaHex>`
 *
 * @param {string|null} authHeader — Valor del header Authorization
 * @param {string}      secret     — ADMIN_SECRET para verificar la firma
 * @returns {Promise<string|null>} — Mensaje de error o null si el token es válido
 */
async function verifyToken(authHeader, secret) {
  if (!authHeader?.startsWith('Bearer ')) return 'Token requerido';
  const token = authHeader.slice(7);
  const parts = token.split('.');
  if (parts.length !== 2) return 'Token inválido';

  const [payloadB64, sig] = parts;

  // Verificar firma HMAC
  const expectedSig = await hmacSign(secret, payloadB64);
  if (sig !== expectedSig) return 'Firma inválida';

  // Verificar expiración del payload
  try {
    const payload = JSON.parse(atob(payloadB64));
    if (payload.exp < Date.now()) return 'Token expirado';
  } catch { return 'Token malformado'; }

  return null; // Token válido
}

// ── Helper criptográfico ──────────────────────────────────────────────────────
/**
 * Firma una cadena con HMAC-SHA256 y retorna el resultado en hexadecimal.
 * Duplicado aquí desde admin-login.js para que cada Worker sea autónomo.
 *
 * @param {string} secret — Clave secreta
 * @param {string} data   — Datos a firmar
 * @returns {Promise<string>} — Firma hex
 */
async function hmacSign(secret, data) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}