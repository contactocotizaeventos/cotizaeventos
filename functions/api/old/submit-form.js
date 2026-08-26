/**
 * POST /api/submit-form
 *
 * Public endpoint — no authentication required.
 * Receives a provider registration request, validates required fields,
 * inserts into the `solicitudes` table, and sends a confirmation email (Email 1).
 *
 * Supabase tables used (existing, do NOT modify):
 *   - solicitudes
 */

import { createClient } from "@supabase/supabase-js";

// ── Helpers ──────────────────────────────────────────────────────────

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(),
  });
}

function errorResponse(message, status = 500) {
  return jsonResponse({ ok: false, error: message }, status);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
/* sendEmail — utility to send transactional emails via Resend API.
 * Never blocks the main operation if it fails.
 */
async function sendEmail(to, subject, html, env) {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`Resend error (${res.status}):`, body);
    }
  } catch (err) {
    console.error("sendEmail failed:", err);
  }
}

/**
 * buildConfirmationEmail — Email 1: Confirmation that the request was received.
 */
function buildConfirmationEmail(nombre) {
  const safeNombre = escapeHtml(nombre);

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#FAFAF8;padding:32px 16px;color:#1A1714;">
  <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:14px;padding:40px 32px;border:1px solid #E8E4DF;">
    <h1 style="font-size:22px;margin:0 0 8px 0;color:#E8542A;">CotizaEventos.cl</h1>
    <h2 style="font-size:18px;margin:0 0 24px 0;color:#1A1714;">Recibimos tu registro</h2>

    <p style="margin:0 0 16px;line-height:1.6;color:#3D3733;">
      Hola${safeNombre ? ` <strong>${safeNombre}</strong>` : ""},
    </p>

    <p style="margin:0 0 16px;line-height:1.6;color:#3D3733;">
      Recibimos correctamente tu solicitud para publicar tu negocio en <strong>CotizaEventos.cl</strong>.
    </p>

    <p style="margin:0 0 16px;line-height:1.6;color:#3D3733;">
      Tu cuenta está ahora en revisión. Nuestro objetivo es revisar las cuentas válidas en los próximos minutos.
    </p>

    <p style="margin:0 0 24px;line-height:1.6;color:#3D3733;">
      <strong>Cuando tu cuenta sea aprobada, recibirás un segundo correo con tus credenciales de acceso.</strong>
      Luego podrás iniciar sesión desde <strong>Mi Cuenta</strong>.
    </p>

    <a href="https://www.cotizaeventos.cl/suscripciones.html"
       style="display:inline-block;background:#E8542A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
      Ir a Mi Cuenta
    </a>

    <hr style="border:none;border-top:1px solid #E8E4DF;margin:32px 0 16px;">
    <p style="margin:0;font-size:12px;color:#8A8278;">
      Este correo confirma la recepción de tu solicitud. Las credenciales se envían después de la aprobación.
    </p>
  </div>
</body>
</html>`.trim();
}

// ── CORS preflight handler ────────────────────────────────────────

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

// ── Main POST handler ────────────────────────────────────────────

export async function onRequestPost(context) {
  const { request, env } = context;

  // Validate environment
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    return errorResponse("Error de configuración del servidor", 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("JSON inválido", 400);
  }

  // ── Validate required fields ───────────────────────────────────────
  const { nombre, whatsapp, email } = body;

  if (!nombre || !nombre.trim()) {
    return errorResponse("El nombre del negocio es obligatorio", 400);
  }
  if (!whatsapp || !whatsapp.trim()) {
    return errorResponse("El WhatsApp es obligatorio", 400);
  }
  if (!email || !email.trim()) {
    return errorResponse("El email es obligatorio", 400);
  }

  // ── Validate required profile content ──────────────────────────────
  const categorias = Array.isArray(body.categorias)
    ? body.categorias.filter(Boolean)
    : [];

  const logoUrl =
    typeof body.logo_url === "string"
      ? body.logo_url.trim()
      : "";

  const coverUrl =
    typeof body.cover_url === "string"
      ? body.cover_url.trim()
      : "";

  const galleryRaw =
    typeof body.comentarios === "string"
      ? body.comentarios.trim()
      : "";

  const galleryImages = galleryRaw
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  if (!categorias.length) {
    return errorResponse("Debes seleccionar una categoría", 400);
  }

  if (!logoUrl) {
    return errorResponse("Debes subir el logo de tu negocio", 400);
  }

  if (!coverUrl) {
    return errorResponse("Debes subir una foto de portada", 400);
  }

  if (!galleryImages.length) {
    return errorResponse("Debes subir al menos una imagen a la galería", 400);
  }
// ── Validate Google reCAPTCHA via dedicated Worker ──────────────────
  const recaptchaToken =
    typeof body.recaptcha_token === "string"
      ? body.recaptcha_token.trim()
      : "";

  if (!recaptchaToken) {
    return errorResponse("Completa la verificación de seguridad", 400);
  }

  try {
    const captchaWorkerUrl =
      env.CAPTCHA_WORKER_URL ||
      "https://cotizaeventos-captcha.contactocotizaeventos.workers.dev";

    const captchaResponse = await fetch(captchaWorkerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        purpose: "form",
        token: recaptchaToken,
      }),
    });

    let captchaResult;
    try {
      captchaResult = await captchaResponse.json();
    } catch {
      return errorResponse("El servicio CAPTCHA devolvió una respuesta inválida", 502);
    }

    if (!captchaResponse.ok || !captchaResult.ok || !captchaResult.verified) {
      console.warn("CAPTCHA rechazado:", captchaResult);

      const detail =
        Array.isArray(captchaResult.captcha_errors) && captchaResult.captcha_errors.length
          ? `: ${captchaResult.captcha_errors.join(", ")}`
          : "";

      return errorResponse(
        (captchaResult.error || "No se pudo verificar reCAPTCHA") + detail,
        403,
      );
    }
  } catch (err) {
    console.error("Error llamando al Worker CAPTCHA:", err);
    return errorResponse("Error verificando la seguridad del formulario", 502);
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  try {
    // ── Build solicitud record ─────────────────────────────────────────
    const solicitud = {
      nombre: (body.nombre || "").trim(),
      responsable: (body.responsable || "").trim(),
      rut: (body.rut || "").trim(),
      descripcion: (body.descripcion || "").trim(),
      diferenciador: (body.diferenciador || "").trim(),
      tagline: (body.tagline || "").trim(),
      experiencia: (body.experiencia || "").trim(),
      capacidad: (body.capacidad || "").trim(),
      categorias,
      comunas: (body.comunas || "").trim(),
      precio_minimo: (body.precio_minimo || "").trim(),
      precio_maximo: (body.precio_maximo || "").trim(),
      incluye: (body.incluye || "").trim(),
      no_incluye: (body.no_incluye || "").trim(),
      anticipacion: (body.anticipacion || "").trim(),
      anticipo: (body.anticipo || "").trim(),
      whatsapp: (body.whatsapp || "").trim(),
      telefono: (body.telefono || "").trim(),
      email: (body.email || "").trim().toLowerCase(),
      web: (body.web || "").trim(),
      instagram: (body.instagram || "").trim(),
      facebook: (body.facebook || "").trim(),
      tiktok: (body.tiktok || "").trim(),
      youtube: (body.youtube || "").trim(),
      direccion: (body.direccion || "").trim(),
      posicion_deseada: "1",
      logo_url: logoUrl,
      cover_url: coverUrl,
      logo_emoji: (body.logo_emoji || "").trim(),
      comentarios: galleryRaw,
      estado: "pendiente",
      fecha_registro: new Date().toISOString(),
    };

    // ── Insert into solicitudes ────────────────────────────────────────
    const { data, error } = await supabase
      .from("solicitudes")
      .insert([solicitud])
      .select("id")
      .single();

    if (error) {
      console.error("Error inserting solicitud:", error);
      return errorResponse("Error al guardar la solicitud", 500);
    }

    // ── Send Email 1 ──────────────────────────────────────────────────
    if (env.RESEND_API_KEY && env.EMAIL_FROM) {
      const emailHtml = buildConfirmationEmail(solicitud.nombre);
      await sendEmail(solicitud.email, "Recibimos tu registro en CotizaEventos.cl", emailHtml, env);
    }

    return jsonResponse({ ok: true, id: data.id });
  } catch (err) {
    console.error("Unexpected error in submit-form:", err);
    return errorResponse("Error interno del servidor", 500);
  }
}