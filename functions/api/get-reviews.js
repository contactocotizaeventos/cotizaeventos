/**
 * /functions/api/get-reviews.js
 * Cloudflare Pages Function — wraps Google Places API
 *
 * Variables de entorno requeridas en Cloudflare Pages:
 *   GOOGLE_PLACES_KEY  →  tu API key de Google (restricción: Places API)
 *
 * Uso:  GET /api/get-reviews?place_id=ChIJN1t_tDeuEmsRUsoyG83frY4
 */

export async function onRequestGet({ request, env }) {
  const url    = new URL(request.url);
  const placeId = url.searchParams.get('place_id');

  /* ── CORS ── */
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=3600',   // cachear 1h para no quemar cuota
  };

  if (!placeId) {
    return new Response(JSON.stringify({ error: 'place_id requerido' }), { status: 400, headers });
  }

  const apiKey = env.GOOGLE_PLACES_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key no configurada' }), { status: 500, headers });
  }

  try {
    /* Google Places Details API — pedimos solo los campos que necesitamos */
    const fields  = 'name,rating,user_ratings_total,reviews,url';
    const apiUrl  = `https://maps.googleapis.com/maps/api/place/details/json`
                  + `?place_id=${encodeURIComponent(placeId)}`
                  + `&fields=${fields}`
                  + `&language=es`           // reseñas en español si están disponibles
                  + `&reviews_sort=newest`   // más recientes primero
                  + `&key=${apiKey}`;

    const res  = await fetch(apiUrl);
    const data = await res.json();

    if (data.status !== 'OK') {
      return new Response(
        JSON.stringify({ error: data.status, message: data.error_message || '' }),
        { status: 422, headers }
      );
    }

    const result = data.result || {};

    /* Devolvemos solo lo que el front necesita */
    return new Response(JSON.stringify({
      name:               result.name || '',
      rating:             result.rating || 0,
      user_ratings_total: result.user_ratings_total || 0,
      maps_url:           result.url || '',
      reviews: (result.reviews || []).slice(0, 5).map(r => ({
        author_name:              r.author_name,
        author_url:               r.author_url,
        rating:                   r.rating,
        text:                     r.text,
        relative_time_description: r.relative_time_description,
        profile_photo_url:        r.profile_photo_url,
      })),
    }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
