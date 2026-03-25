/**
 * /prov/:slug
 *
 * Dynamic provider page. Renders a full HTML page for each provider
 * from Supabase data. Includes SEO meta tags, Open Graph, schema.org.
 *
 * Example: /prov/roble-pizzas-9301
 */

import { createClient } from "@supabase/supabase-js";

export async function onRequest(context) {
  const { env, params } = context;

  // Extract slug from catch-all params
  const slugParts = params.slug;
  const slug = Array.isArray(slugParts) ? slugParts.join("/") : slugParts;

  if (!slug) {
    return Response.redirect("https://www.cotizaeventos.cl/proveedores.html", 302);
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return new Response("Error de configuración", { status: 500 });
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  // Lookup provider by slug
  const { data: prov, error } = await supabase
    .from("proveedores")
    .select("*")
    .eq("slug", slug)
    .eq("activo", true)
    .limit(1);

  if (error || !prov || prov.length === 0) {
    // 404 — redirect to directory
    return new Response(build404(slug), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const p = prov[0];
  const isDestacado = p.posicion && p.posicion > 0;
  const imagenes = p.imagenes || [];

  // Find category name
  let catName = "";
  try {
    const { data: etiq } = await supabase
      .from("etiquetas")
      .select("nombre")
      .eq("id", p.categoria)
      .limit(1);
    if (etiq && etiq.length > 0) catName = etiq[0].nombre;
  } catch (e) {}

  const html = buildPage(p, isDestacado, catName, imagenes);

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600",
    },
  });
}

function esc(s) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function build404(slug) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Proveedor no encontrado — CotizaEventos.cl</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700&family=Outfit:wght@400;600&display=swap" rel="stylesheet">
<style>
body{font-family:'Outfit',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#FAFAF8;color:#1A1714;text-align:center;padding:20px}
h1{font-family:'Fraunces',serif;font-size:32px;margin-bottom:12px}
p{color:#8A8278;font-size:16px;margin-bottom:24px}
a{display:inline-block;padding:12px 28px;background:#E8542A;color:#fff;border-radius:14px;font-weight:600;text-decoration:none}
a:hover{background:#FF7A54}
</style>
</head>
<body>
<div>
<h1>Proveedor no encontrado</h1>
<p>No encontramos un proveedor con la dirección "${esc(slug)}".</p>
<a href="/proveedores.html">Ver todos los proveedores →</a>
</div>
</body>
</html>`;
}

function buildPage(p, isDestacado, catName, imagenes) {
  const title = `${esc(p.nombre)} — Proveedor de Eventos en Santiago | CotizaEventos.cl`;
  const desc = esc((p.descripcion || p.tagline || p.diferenciador || "Proveedor de eventos en Santiago").substring(0, 160));
  const url = `https://www.cotizaeventos.cl/prov/${esc(p.slug)}`;
  const ogImage = p.cover_url || p.logo_url || "";
  const waLink = p.whatsapp ? `https://wa.me/${esc(p.whatsapp)}` : "";
  const precio = p.precio_minimo ? `Desde $${esc(p.precio_minimo)}` : "";

  const schemaJSON = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: p.nombre,
    description: p.descripcion || "",
    url: url,
    image: ogImage,
    telephone: p.telefono || "",
    email: p.email || "",
    areaServed: p.comunas || "Santiago, Chile",
    priceRange: p.precio_minimo ? `$${p.precio_minimo} - $${p.precio_maximo || ""}` : "",
  });

  // Gallery HTML
  let galleryHtml = "";
  if (isDestacado && imagenes.length > 0) {
    galleryHtml = `<div class="gallery"><div class="gallery-grid">${imagenes
      .map((img) => `<div class="gal-item"><img src="${esc(img)}" alt="${esc(p.nombre)}" loading="lazy"></div>`)
      .join("")}</div></div>`;
  }

  // Social links
  let socialHtml = "";
  const socials = [];
  if (p.instagram) socials.push(`<a href="https://instagram.com/${esc(p.instagram)}" target="_blank" rel="noopener">Instagram</a>`);
  if (p.facebook) socials.push(`<a href="${esc(p.facebook)}" target="_blank" rel="noopener">Facebook</a>`);
  if (p.tiktok) socials.push(`<a href="https://tiktok.com/@${esc(p.tiktok)}" target="_blank" rel="noopener">TikTok</a>`);
  if (p.youtube) socials.push(`<a href="${esc(p.youtube)}" target="_blank" rel="noopener">YouTube</a>`);
  if (p.web) socials.push(`<a href="${esc(p.web)}" target="_blank" rel="noopener">Sitio web</a>`);
  if (socials.length) socialHtml = `<div class="social">${socials.join("")}</div>`;

  // Contact buttons
  let contactHtml = "";
  if (isDestacado && waLink) {
    contactHtml += `<a href="${waLink}" class="btn-wa" target="_blank" rel="noopener">Contactar por WhatsApp</a>`;
  }
  if (p.telefono) contactHtml += `<a href="tel:${esc(p.telefono)}" class="btn-sec">Llamar</a>`;
  if (p.email) contactHtml += `<a href="mailto:${esc(p.email)}" class="btn-sec">Enviar email</a>`;

  // Básico upgrade CTA
  const upgradeCta = !isDestacado
    ? `<div class="upgrade"><p>Este proveedor tiene un perfil <strong>Básico</strong>. Para ver fotos, descripción completa y contactar por WhatsApp, el proveedor debe activar su plan Destacado.</p></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="index, follow">
<meta name="author" content="CotizaEventos.cl">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(p.nombre)} — CotizaEventos.cl">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ""}
<meta property="og:site_name" content="CotizaEventos.cl">
<meta property="og:locale" content="es_CL">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.nombre)} — CotizaEventos.cl">
<meta name="twitter:description" content="${desc}">
${ogImage ? `<meta name="twitter:image" content="${esc(ogImage)}">` : ""}
<script type="application/ld+json">${schemaJSON}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@300;500;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--coral:#E8542A;--coral2:#FF7A54;--coral-lt:#FFF0EB;--teal:#06C7A5;--bg:#FAFAF8;--bg2:#F5F3EF;--white:#FFFFFF;--ink:#1A1714;--ink2:#3D3733;--muted:#8A8278;--border:#E8E4DF;--r:14px;--ease:cubic-bezier(.4,0,.2,1);--shadow:0 2px 12px rgba(0,0,0,.07);--font-title:'Fraunces',serif;--font-body:'Outfit',sans-serif}
html{scroll-behavior:smooth}
body{font-family:var(--font-body);color:var(--ink);background:var(--bg);line-height:1.6;-webkit-font-smoothing:antialiased}
img{display:block;max-width:100%}
a{color:inherit;text-decoration:none}

/* Nav */
.nav{position:sticky;top:0;z-index:100;height:56px;background:rgba(255,255,255,.97);backdrop-filter:blur(14px);border-bottom:1px solid var(--border)}
.nav-inner{display:flex;align-items:center;justify-content:space-between;height:56px;max-width:1140px;margin:0 auto;padding:0 20px}
.nav-logo{font-family:var(--font-title);font-weight:700;font-size:20px;color:var(--ink)}
.nav-logo span{color:var(--coral)}
.nav-links{display:flex;align-items:center;gap:24px}
.nav-links a{font-size:14px;font-weight:500;color:var(--ink2);transition:color .2s}
.nav-links a:hover{color:var(--coral)}
.nav-cta{padding:8px 18px;background:var(--coral);color:#fff!important;border-radius:var(--r);font-weight:600;font-size:13px}
@media(max-width:680px){.nav-links{display:none}}

/* Cover */
.cover{height:320px;background:#1A1410;position:relative;overflow:hidden}
.cover img{width:100%;height:100%;object-fit:cover}
.cover .no-img{display:flex;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,.06);font-size:40px}
.cover-badge{position:absolute;top:16px;left:16px;background:linear-gradient(135deg,var(--coral),var(--coral2));color:#fff;font-size:12px;font-weight:600;padding:6px 16px;border-radius:100px}
@media(max-width:600px){.cover{height:200px}}

/* Main */
.main{max-width:800px;margin:0 auto;padding:0 20px 80px;position:relative}

/* Logo */
.logo-wrap{margin-top:-44px;margin-bottom:16px;display:flex;align-items:flex-end;gap:20px}
.logo{width:88px;height:88px;border-radius:18px;background:var(--white);border:4px solid var(--white);box-shadow:var(--shadow);display:flex;align-items:center;justify-content:center;font-size:36px;overflow:hidden;flex-shrink:0}
.logo img{width:100%;height:100%;object-fit:cover}
.logo-info{padding-bottom:8px}
.logo-info h1{font-family:var(--font-title);font-weight:700;font-size:clamp(24px,4vw,32px);line-height:1.2}
.logo-info .cat{font-size:14px;color:var(--muted);margin-top:2px}

/* Tagline */
.tagline{font-size:18px;color:var(--ink2);margin-bottom:24px;line-height:1.6}

/* Sections */
.section{margin-bottom:28px}
.section-title{font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);font-weight:600;margin-bottom:8px}
.section p{font-size:15px;color:var(--ink2);line-height:1.7;white-space:pre-wrap}

/* Prices */
.prices{display:flex;gap:20px;flex-wrap:wrap;margin-bottom:28px}
.price-item{font-size:15px;color:var(--ink2)}
.price-item strong{color:var(--coral);font-size:20px;font-weight:700}

/* Details grid */
.details{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px}
@media(max-width:500px){.details{grid-template-columns:1fr}}
.detail{font-size:14px;color:var(--ink2)}
.detail strong{display:block;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);font-weight:600;margin-bottom:2px}

/* Gallery */
.gallery{margin-bottom:28px}
.gallery-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
@media(max-width:500px){.gallery-grid{grid-template-columns:repeat(2,1fr)}}
.gal-item{border-radius:var(--r);overflow:hidden;aspect-ratio:4/3;background:var(--bg2)}
.gal-item img{width:100%;height:100%;object-fit:cover;transition:transform .4s var(--ease)}
.gal-item:hover img{transform:scale(1.05)}

/* Social */
.social{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:28px}
.social a{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border:1px solid var(--border);border-radius:8px;font-size:13px;color:var(--ink2);transition:all .2s}
.social a:hover{border-color:var(--coral);color:var(--coral)}

/* Contact */
.contact{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:28px}
.btn-wa{display:inline-flex;align-items:center;gap:6px;padding:14px 28px;background:#25D366;color:#fff;border-radius:var(--r);font-weight:600;font-size:15px;transition:all .2s}
.btn-wa:hover{background:#1da851;transform:translateY(-1px)}
.btn-sec{display:inline-flex;align-items:center;gap:6px;padding:14px 28px;border:1px solid var(--border);border-radius:var(--r);font-weight:500;font-size:15px;color:var(--ink2);transition:all .2s}
.btn-sec:hover{border-color:var(--coral);color:var(--coral)}

/* Upgrade CTA */
.upgrade{background:var(--coral-lt);border:1px solid #FFCFC2;border-radius:var(--r);padding:20px;text-align:center;margin-bottom:28px;font-size:14px;color:var(--ink2);line-height:1.7}
.upgrade strong{color:var(--coral)}

/* Back link */
.back{display:inline-flex;align-items:center;gap:6px;font-size:14px;color:var(--muted);margin-bottom:20px;margin-top:24px;transition:color .2s}
.back:hover{color:var(--coral)}

/* Footer */
.footer{background:var(--bg2);border-top:1px solid var(--border);padding:40px 0 28px;text-align:center}
.footer-logo{font-family:var(--font-title);font-weight:700;font-size:18px;margin-bottom:6px}
.footer-logo span{color:var(--coral)}
.footer p{font-size:13px;color:var(--muted)}
.footer-links{display:flex;gap:20px;justify-content:center;margin-top:12px}
.footer-links a{font-size:13px;color:var(--ink2)}
.footer-links a:hover{color:var(--coral)}
</style>
</head>
<body>

<nav class="nav">
  <div class="nav-inner">
    <a href="/index.html" class="nav-logo">Cotiza<span>Eventos</span>.cl</a>
    <div class="nav-links">
      <a href="/index.html">Inicio</a>
      <a href="/proveedores.html">Proveedores</a>
      <a href="/nosotros.html">Nosotros</a>
      <a href="/form.html" class="nav-cta">Publica tu negocio</a>
    </div>
  </div>
</nav>

${isDestacado && p.cover_url ? `<div class="cover"><img src="${esc(p.cover_url)}" alt="${esc(p.nombre)}"><div class="cover-badge">Destacado</div></div>` : isDestacado ? `<div class="cover"><div class="no-img"></div><div class="cover-badge">Destacado</div></div>` : ""}

<div class="main">
  <a href="/proveedores.html" class="back">&larr; Volver al directorio</a>

  <div class="logo-wrap">
    <div class="logo">
      ${p.logo_url ? `<img src="${esc(p.logo_url)}" alt="${esc(p.nombre)}">` : esc(p.logo_emoji || "✦")}
    </div>
    <div class="logo-info">
      <h1>${esc(p.nombre)}</h1>
      ${catName ? `<div class="cat">${esc(catName)}</div>` : ""}
    </div>
  </div>

  ${p.tagline ? `<div class="tagline">${esc(p.tagline)}</div>` : ""}

  ${isDestacado && p.descripcion ? `<div class="section"><div class="section-title">Descripción</div><p>${esc(p.descripcion)}</p></div>` : ""}

  ${p.diferenciador ? `<div class="section"><div class="section-title">¿Qué nos diferencia?</div><p>${esc(p.diferenciador)}</p></div>` : ""}

  ${p.precio_minimo || p.precio_maximo ? `<div class="prices">${p.precio_minimo ? `<div class="price-item">Desde <strong>$${esc(p.precio_minimo)}</strong></div>` : ""}${p.precio_maximo ? `<div class="price-item">Hasta <strong>$${esc(p.precio_maximo)}</strong></div>` : ""}</div>` : ""}

  ${galleryHtml}

  <div class="details">
    ${p.incluye ? `<div class="detail"><strong>Incluye</strong>${esc(p.incluye)}</div>` : ""}
    ${p.no_incluye ? `<div class="detail"><strong>No incluye</strong>${esc(p.no_incluye)}</div>` : ""}
    ${p.experiencia ? `<div class="detail"><strong>Experiencia</strong>${esc(p.experiencia)}</div>` : ""}
    ${p.capacidad ? `<div class="detail"><strong>Capacidad</strong>${esc(p.capacidad)}</div>` : ""}
    ${p.comunas ? `<div class="detail"><strong>Comunas</strong>${esc(p.comunas)}</div>` : ""}
    ${p.responsable ? `<div class="detail"><strong>Responsable</strong>${esc(p.responsable)}</div>` : ""}
  </div>

  ${socialHtml}

  ${upgradeCta}

  <div class="contact">
    ${contactHtml}
  </div>
</div>

<footer class="footer">
  <div class="footer-logo">Cotiza<span>Eventos</span>.cl</div>
  <p>&copy; 2025 CotizaEventos.cl</p>
  <div class="footer-links">
    <a href="/proveedores.html">Proveedores</a>
    <a href="/nosotros.html">Nosotros</a>
    <a href="/form.html">Publicar negocio</a>
    <a href="/terminos.html">Términos</a>
  </div>
</footer>
</body>
</html>`;
}
