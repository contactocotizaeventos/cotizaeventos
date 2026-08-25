function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders() });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestPost({ request, env }) {
  if (!env.RECAPTCHA_SECRET_KEY) return json({ ok: false, error: "reCAPTCHA no configurado" }, 503);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Solicitud inválida" }, 400);
  }

  const token = typeof body.token === "string" ? body.token : "";
  const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
  const text = typeof body.text === "string" ? body.text : "";
  if (!token || !/^\d{8,15}$/.test(phone)) return json({ ok: false, error: "Datos de contacto inválidos" }, 400);

  const params = new URLSearchParams({ secret: env.RECAPTCHA_SECRET_KEY, response: token });
  const captchaResponse = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const captcha = await captchaResponse.json();
  if (!captcha.success) return json({ ok: false, error: "No se pudo verificar reCAPTCHA" }, 403);

  const query = text ? `?text=${encodeURIComponent(text.slice(0, 500))}` : "";
  return json({ ok: true, url: `https://wa.me/${phone}${query}` });
}
