/**
 * /api/suscriptor
 *
 * Provider (suscriptor) authentication and subscription management.
 * Uses SUSCRIPTOR_SECRET for HMAC-SHA256 tokens (distinct from ADMIN_SECRET).
 * Passwords hashed with bcryptjs (cost 12).
 *
 * ── POST routes (via body { action, ... }) ──
 *   register                → create suscriptor account (requires approved provider)
 *   login                   → authenticate, return token (24h)
 *   toggle_pago_automatico  → update auto-pay flag on active subscription
 *   cancelar                → cancel active subscription (provider stays Destacado until expiry)
 *
 * ── GET routes (via ?action=...) ──
 *   estado                  → current suscriptor + provider + subscription info
 *
 * Tables used:
 *   - suscriptores (new — see CREATE TABLE in admin-manage.js)
 *   - suscripciones (new — see CREATE TABLE in admin-manage.js)
 *   - proveedores (existing)
 */

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

// ══════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders() });
}

function err(message, status = 500) {
  return json({ ok: false, error: message }, status);
}

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
  } catch (e) {
    console.error("sendEmail failed:", e);
  }
}

// ── HMAC Token creation ──────────────────────────────────────────────

async function createToken(payload, secret) {
  const encoder = new TextEncoder();
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = btoa(payloadStr)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadB64)
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${payloadB64}.${sigB64}`;
}

// ── HMAC Token verification ──────────────────────────────────────────

async function verifyToken(token, secret) {
  if (!token) return null;

  const dotIdx = token.indexOf(".");
  if (dotIdx === -1) return null;

  const payloadB64 = token.slice(0, dotIdx);
  const sigB64 = token.slice(dotIdx + 1);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  // Decode signature from base64url
  const sigStr = atob(sigB64.replace(/-/g, "+").replace(/_/g, "/"));
  const sigBuf = new Uint8Array(sigStr.length);
  for (let i = 0; i < sigStr.length; i++) sigBuf[i] = sigStr.charCodeAt(i);

  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBuf,
    encoder.encode(payloadB64)
  );

  if (!valid) return null;

  const payloadStr = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
  const payload = JSON.parse(payloadStr);

  // Check expiration
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

  return payload;
}

/**
 * Extract token from Authorization header or query param.
 * Supports: "Bearer <token>" header or ?token=<token> query string.
 */
function extractToken(request) {
  // Try Authorization header first
  const auth = request.headers.get("Authorization") || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);

  // Fallback to query param (used by GET requests)
  const url = new URL(request.url);
  return url.searchParams.get("token") || null;
}

// ══════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ══════════════════════════════════════════════════════════════════════

export async function onRequest(context) {
  const { request, env } = context;

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  // Validate env
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY || !env.SUSCRIPTOR_SECRET) {
    console.error("Missing required env vars for suscriptor");
    return err("Error de configuración del servidor", 500);
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  const url = new URL(request.url);

  // ══════════════════════════════════════════════════════════════════
  // GET ROUTES
  // ══════════════════════════════════════════════════════════════════

  if (request.method === "GET") {
    const action = url.searchParams.get("action");

    // ── GET estado ───────────────────────────────────────────────────
    if (action === "estado") {
      const token = extractToken(request);
      const payload = await verifyToken(token, env.SUSCRIPTOR_SECRET);
      if (!payload) return err("Token inválido o expirado", 401);

      // Load suscriptor
      const { data: sub, error: e1 } = await supabase
        .from("suscriptores")
        .select("id, email, nombre, proveedor_id")
        .eq("id", payload.sub)
        .single();
      if (e1 || !sub) return err("Suscriptor no encontrado", 404);

      // Load linked provider
      let proveedor = null;
      if (sub.proveedor_id) {
        const { data: prov } = await supabase
          .from("proveedores")
          .select("id, nombre, posicion, activo, categoria, etiqueta_id, cover_url, logo_url, logo_emoji, descripcion, diferenciador, tagline, experiencia, capacidad, comunas, precio_minimo, precio_maximo, incluye, no_incluye, whatsapp, telefono, email, web, instagram, facebook, tiktok, youtube, responsable")
          .eq("id", sub.proveedor_id)
          .single();
        proveedor = prov || null;
      }

      // Load active subscription
      let suscripcion = null;
      const { data: subs } = await supabase
        .from("suscripciones")
        .select("*")
        .eq("suscriptor_id", sub.id)
        .eq("estado", "activa")
        .order("fecha_inicio", { ascending: false })
        .limit(1);
      if (subs && subs.length > 0) {
        suscripcion = subs[0];
      }

      return json({
        ok: true,
        suscriptor: { id: sub.id, email: sub.email, nombre: sub.nombre },
        proveedor,
        suscripcion,
      });
    }

    return err("Acción GET no reconocida", 400);
  }

  // ══════════════════════════════════════════════════════════════════
  // POST ROUTES
  // ══════════════════════════════════════════════════════════════════

  if (request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return err("JSON inválido", 400);
    }

    const { action } = body;

    // ── REGISTER ─────────────────────────────────────────────────────
    if (action === "register") {
      const { nombre, email, password } = body;

      if (!nombre || !nombre.trim()) return err("El nombre es obligatorio", 400);
      if (!email || !email.trim()) return err("El email es obligatorio", 400);
      if (!password || password.length < 6) {
        return err("La contraseña debe tener al menos 6 caracteres", 400);
      }

      const emailNorm = email.trim().toLowerCase();

      // 1. Verify approved provider exists with this email
      const { data: provRows, error: eProv } = await supabase
        .from("proveedores")
        .select("id, nombre")
        .eq("email", emailNorm)
        .eq("activo", true)
        .limit(1);

      const prov = (provRows && provRows.length > 0) ? provRows[0] : null;

      if (eProv || !prov) {
        return err(
          "No encontramos un negocio aprobado con ese email. Primero debes registrar tu negocio.",
          400
        );
      }

      // 2. Verify suscriptor doesn't already exist
      const { data: existingRows } = await supabase
        .from("suscriptores")
        .select("id")
        .eq("email", emailNorm)
        .limit(1);

      if (existingRows && existingRows.length > 0) {
        return err("Ya tienes una cuenta. Inicia sesión.", 400);
      }

      // 3. Hash password (bcrypt cost 12)
      const passwordHash = await bcrypt.hash(password, 12);

      // 4. Insert suscriptor
      const { data: newSub, error: eInsert } = await supabase.from("suscriptores").insert([{
        email: emailNorm,
        password_hash: passwordHash,
        nombre: nombre.trim(),
        proveedor_id: prov.id,
      }]).select("id").single();

      if (eInsert || !newSub) {
        console.error("Error inserting suscriptor:", eInsert);
        return err("Error al crear la cuenta", 500);
      }

      // 5. Send welcome email with password
      if (env.RESEND_API_KEY && env.EMAIL_FROM) {
        const welcomeHtml = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#FAFAF8;padding:32px 16px;color:#1A1714;">
  <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:14px;padding:40px 32px;border:1px solid #E8E4DF;">
    <h1 style="font-size:22px;margin:0 0 8px 0;color:#E8542A;">CotizaEventos.cl</h1>
    <h2 style="font-size:18px;margin:0 0 24px 0;color:#1A1714;">¡Tu cuenta fue creada!</h2>
    <p style="margin:0 0 16px 0;line-height:1.6;color:#3D3733;">
      Hola <strong>${nombre.trim()}</strong>, tu cuenta para gestionar <strong>${prov.nombre || "tu negocio"}</strong> en CotizaEventos.cl fue creada exitosamente.
    </p>
    <p style="margin:0 0 8px 0;line-height:1.6;color:#3D3733;">Guarda tus datos de acceso:</p>
    <div style="background:#F5F3EF;border-radius:8px;padding:16px;margin:0 0 20px 0;">
      <p style="margin:0 0 6px 0;font-size:14px;color:#8A8278;">Email</p>
      <p style="margin:0 0 14px 0;font-size:16px;font-weight:600;color:#1A1714;">${emailNorm}</p>
      <p style="margin:0 0 6px 0;font-size:14px;color:#8A8278;">Contraseña</p>
      <p style="margin:0;font-size:16px;font-weight:600;color:#1A1714;">${password}</p>
    </div>
    <a href="https://www.cotizaeventos.cl/suscripciones.html" style="display:inline-block;background:#E8542A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
      Gestionar mi suscripción
    </a>
    <hr style="border:none;border-top:1px solid #E8E4DF;margin:32px 0 16px 0;">
    <p style="margin:0;font-size:12px;color:#8A8278;">
      Este correo fue enviado automáticamente por CotizaEventos.cl. Te recomendamos no compartir tu contraseña.
    </p>
  </div>
</body>
</html>`.trim();
        await sendEmail(emailNorm, "Tu cuenta en CotizaEventos.cl fue creada", welcomeHtml, env);
      }

      // 6. Auto-login: create token
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = 86400;
      const tokenPayload = {
        sub: newSub.id,
        email: emailNorm,
        exp: now + expiresIn,
      };
      const token = await createToken(tokenPayload, env.SUSCRIPTOR_SECRET);

      return json({
        ok: true,
        token,
        expiresIn,
        suscriptor: {
          id: newSub.id,
          nombre: nombre.trim(),
          email: emailNorm,
          proveedor_id: prov.id,
        },
      });
    }

    // ── LOGIN ────────────────────────────────────────────────────────
    if (action === "login") {
      const { email, password } = body;

      if (!email || !password) {
        return err("Email y contraseña son obligatorios", 400);
      }

      const emailNorm = email.trim().toLowerCase();

      // 1. Find suscriptor by email
      const { data: sub, error: eSub } = await supabase
        .from("suscriptores")
        .select("id, email, nombre, password_hash, proveedor_id")
        .eq("email", emailNorm)
        .single();

      if (eSub || !sub) {
        return err("Email o contraseña incorrectos", 401);
      }

      // 2. Compare password
      const match = await bcrypt.compare(password, sub.password_hash);
      if (!match) {
        return err("Email o contraseña incorrectos", 401);
      }

      // 3. Create token (24h expiry)
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = 86400; // 24 hours

      const tokenPayload = {
        sub: sub.id,
        email: sub.email,
        exp: now + expiresIn,
      };

      const token = await createToken(tokenPayload, env.SUSCRIPTOR_SECRET);

      return json({
        ok: true,
        token,
        expiresIn,
        suscriptor: {
          id: sub.id,
          nombre: sub.nombre,
          email: sub.email,
          proveedor_id: sub.proveedor_id,
        },
      });
    }

    // ── TOGGLE PAGO AUTOMÁTICO ───────────────────────────────────────
    if (action === "toggle_pago_automatico") {
      const token = extractToken(request) || body.token;
      const payload = await verifyToken(token, env.SUSCRIPTOR_SECRET);
      if (!payload) return err("Token inválido o expirado", 401);

      const { valor } = body;
      if (typeof valor !== "boolean") {
        return err("Se requiere 'valor' como booleano", 400);
      }

      const { error } = await supabase
        .from("suscripciones")
        .update({ pago_automatico: valor })
        .eq("suscriptor_id", payload.sub)
        .eq("estado", "activa");

      if (error) {
        console.error("Error toggling pago_automatico:", error);
        return err("Error al actualizar pago automático", 500);
      }

      return json({ ok: true });
    }

    // ── CANCELAR SUSCRIPCIÓN ─────────────────────────────────────────
    if (action === "cancelar") {
      const token = extractToken(request) || body.token;
      const payload = await verifyToken(token, env.SUSCRIPTOR_SECRET);
      if (!payload) return err("Token inválido o expirado", 401);

      // Cancel active subscription — do NOT change provider posicion.
      // Provider stays Destacado until fecha_vencimiento.
      const { error } = await supabase
        .from("suscripciones")
        .update({
          estado: "cancelada",
          fecha_cancelacion: new Date().toISOString(),
        })
        .eq("suscriptor_id", payload.sub)
        .eq("estado", "activa");

      if (error) {
        console.error("Error cancelling subscription:", error);
        return err("Error al cancelar suscripción", 500);
      }

      return json({ ok: true });
    }

    // ── UPDATE PROFILE ───────────────────────────────────────────────
    if (action === "update_profile") {
      const token = extractToken(request) || body.token;
      const payload = await verifyToken(token, env.SUSCRIPTOR_SECRET);
      if (!payload) return err("Token inválido o expirado", 401);

      // Get suscriptor to find proveedor_id
      const { data: sub } = await supabase
        .from("suscriptores")
        .select("proveedor_id")
        .eq("id", payload.sub)
        .single();
      if (!sub || !sub.proveedor_id) return err("No se encontró proveedor vinculado", 400);

      // Whitelist of editable fields (nombre and etiqueta_id NOT allowed)
      const allowed = [
        "responsable","descripcion","diferenciador","tagline",
        "experiencia","capacidad","comunas",
        "precio_minimo","precio_maximo","incluye","no_incluye",
        "whatsapp","telefono","email","web",
        "instagram","facebook","tiktok","youtube",
        "logo_url","cover_url","logo_emoji"
      ];

      const fields = body.fields || {};
      const safeFields = {};
      for (const key of Object.keys(fields)) {
        if (allowed.includes(key)) safeFields[key] = fields[key];
      }

      if (Object.keys(safeFields).length === 0) {
        return err("No se proporcionaron campos válidos", 400);
      }

      const { error } = await supabase
        .from("proveedores")
        .update(safeFields)
        .eq("id", sub.proveedor_id);

      if (error) {
        console.error("Error updating profile:", error);
        return err("Error al actualizar perfil", 500);
      }

      return json({ ok: true });
    }

    return err("Acción POST no reconocida", 400);
  }

  return err("Método no permitido", 405);
}
