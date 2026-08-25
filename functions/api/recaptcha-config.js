function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json; charset=utf-8",
  };
}

export async function onRequestGet({ env }) {
  if (!env.RECAPTCHA_SITE_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "reCAPTCHA no configurado" }), {
      status: 503,
      headers: corsHeaders(),
    });
  }
  return new Response(JSON.stringify({ ok: true, siteKey: env.RECAPTCHA_SITE_KEY }), {
    headers: corsHeaders(),
  });
}
