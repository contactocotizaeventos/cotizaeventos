/**
 * /prov/:slug — Dynamic provider page
 */
import { createClient } from "@supabase/supabase-js";

export async function onRequest(context) {
  const { env, params } = context;
  const slugParts = params.slug;
  const slug = Array.isArray(slugParts) ? slugParts.join("/") : slugParts;
  if (!slug) return Response.redirect("https://www.cotizaeventos.cl/proveedores.html", 302);
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return new Response("Error de configuración", { status: 500 });
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  const { data: prov, error } = await supabase.from("proveedores").select("*").eq("slug", slug).eq("activo", true).limit(1);
  if (error || !prov || prov.length === 0) return new Response(build404(slug), { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
  const p = prov[0];
  const isDestacado = p.posicion && p.posicion > 0;
  const imagenes = p.imagenes || [];
  let catName = "";
  try { const { data: etiq } = await supabase.from("etiquetas").select("nombre").eq("id", p.categoria).limit(1); if (etiq && etiq.length > 0) catName = etiq[0].nombre; } catch (e) {}
  const html = isDestacado ? buildDestacado(p, catName, imagenes) : buildBasico(p, catName);
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300, s-maxage=600" } });
}

function esc(s) { if (!s) return ""; return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }

function build404(slug) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>No encontrado — CotizaEventos.cl</title><link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700&family=Outfit:wght@400;600&display=swap" rel="stylesheet"><style>body{font-family:'Outfit',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#FAFAF8;color:#1A1714;text-align:center;padding:20px;margin:0}h1{font-family:'Fraunces',serif;font-size:32px;margin-bottom:12px}p{color:#8A8278;font-size:16px;margin-bottom:24px}a{display:inline-block;padding:12px 28px;background:#E8542A;color:#fff;border-radius:14px;font-weight:600;text-decoration:none}a:hover{background:#FF7A54}</style></head><body><div><h1>Proveedor no encontrado</h1><p>No encontramos "${esc(slug)}".</p><a href="/proveedores.html">Ver proveedores →</a></div></body></html>`;
}

function headMeta(p) {
  const t = `${esc(p.nombre)} — Proveedor de Eventos | CotizaEventos.cl`;
  const d = esc((p.descripcion || p.tagline || p.diferenciador || "Proveedor de eventos en Santiago").substring(0, 160));
  const u = `https://www.cotizaeventos.cl/prov/${esc(p.slug)}`;
  const img = p.cover_url || p.logo_url || "";
  const s = JSON.stringify({"@context":"https://schema.org","@type":"LocalBusiness",name:p.nombre,description:p.descripcion||"",url:u,image:img,telephone:p.telefono||"",email:p.email||"",areaServed:p.comunas||"Santiago, Chile"});
  return `<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${t}</title><meta name="description" content="${d}"><meta name="robots" content="index,follow"><link rel="canonical" href="${u}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(p.nombre)} — CotizaEventos.cl"><meta property="og:description" content="${d}"><meta property="og:url" content="${u}">${img?`<meta property="og:image" content="${esc(img)}">`:""}
<meta property="og:site_name" content="CotizaEventos.cl"><meta property="og:locale" content="es_CL"><meta name="twitter:card" content="summary_large_image">${img?`<meta name="twitter:image" content="${esc(img)}">`:""}
<script type="application/ld+json">${s}</script><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@300;500;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">`;
}

function nav() {
  return `<nav class="nav"><div class="nav-inner"><a href="/index.html" class="nav-logo">Cotiza<span>Eventos</span>.cl</a><div class="nav-links"><a href="/index.html">Inicio</a><a href="/proveedores.html">Proveedores</a><a href="/nosotros.html">Nosotros</a><a href="/form.html" class="nav-cta">Publica tu negocio</a></div></div></nav>`;
}

function foot() {
  return `<footer class="footer"><div class="footer-inner"><div><div class="footer-logo">Cotiza<span>Eventos</span>.cl</div><p class="footer-copy">&copy; 2025 CotizaEventos.cl</p></div><div class="footer-links"><a href="/proveedores.html">Proveedores</a><a href="/nosotros.html">Nosotros</a><a href="/form.html">Publicar negocio</a><a href="/terminos.html">Términos</a></div></div></footer>`;
}

function socLinks(p) {
  const r = [];
  if (p.instagram) r.push(`<a href="https://instagram.com/${esc(p.instagram)}" target="_blank" rel="noopener" class="soc" title="Instagram"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5"/></svg> Instagram</a>`);
  if (p.facebook) r.push(`<a href="${esc(p.facebook)}" target="_blank" rel="noopener" class="soc" title="Facebook"><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg> Facebook</a>`);
  if (p.tiktok) r.push(`<a href="https://tiktok.com/@${esc(p.tiktok)}" target="_blank" rel="noopener" class="soc" title="TikTok"><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-.88-5.64V9.01a6.33 6.33 0 00-1 12.58 6.33 6.33 0 006.88-6.31V9.4a8.16 8.16 0 005.1 1.76V7.72a4.85 4.85 0 01-1-.58z"/></svg> TikTok</a>`);
  if (p.youtube) r.push(`<a href="${esc(p.youtube)}" target="_blank" rel="noopener" class="soc" title="YouTube"><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 00.5 6.19 31.76 31.76 0 000 12a31.76 31.76 0 00.5 5.81 3.02 3.02 0 002.12 2.14c1.84.55 9.38.55 9.38.55s7.54 0 9.38-.55a3.02 3.02 0 002.12-2.14A31.76 31.76 0 0024 12a31.76 31.76 0 00-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg> YouTube</a>`);
  if (p.web) r.push(`<a href="${esc(p.web)}" target="_blank" rel="noopener" class="soc" title="Web"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> Web</a>`);
  return r.join("");
}

function waSvg() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.04-.97-.27-.1-.47-.15-.66.15-.2.3-.76.97-.93 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.18-.3-.02-.46.13-.61.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.91-2.2-.24-.57-.49-.5-.67-.5h-.58c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.22 5.1 4.51.71.31 1.27.5 1.7.63.72.23 1.37.2 1.88.12.58-.08 1.76-.72 2.01-1.41.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35zM12.05 21.5c-1.8 0-3.55-.49-5.08-1.4l-.36-.22-3.78.99 1.01-3.69-.24-.37A9.43 9.43 0 012.5 12.05C2.5 6.79 6.79 2.5 12.05 2.5c2.56 0 4.96 1 6.77 2.81a9.5 9.5 0 012.8 6.74c0 5.26-4.28 9.54-9.54 9.54l-.03-.09zm8.14-17.62A11.4 11.4 0 0012.05.5C5.68.5.5 5.68.5 12.05c0 2.04.53 4.03 1.55 5.78L.5 23.5l5.83-1.53A11.4 11.4 0 0012.05 23.5c6.37 0 11.55-5.18 11.55-11.55a11.4 11.4 0 00-3.41-8.07z"/></svg>`;
}


/* ═══ DESTACADO ═══ */
function buildDestacado(p, catName, imagenes) {
  const wa = p.whatsapp ? `https://wa.me/${esc(p.whatsapp)}` : "";
  const soc = socLinks(p);

  // Gallery layout
  let galHtml = "";
  if (imagenes.length > 0) {
    galHtml = `<section class="gal-sec"><div class="container">
<h3 class="sl">Galería</h3>
<div class="gal gal-${Math.min(imagenes.length,5)}">
${imagenes.map((img,i)=>`<div class="gi" onclick="openLb(${i})"><img src="${esc(img)}" alt="${esc(p.nombre)}" loading="lazy"><div class="gi-ov"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg></div></div>`).join("")}
</div></div></section>`;
  }

  // Info cards
  const cards = [];
  if (p.incluye) cards.push(`<div class="ic"><div class="ic-i">✓</div><div><div class="ic-l">Incluye</div><p>${esc(p.incluye)}</p></div></div>`);
  if (p.no_incluye) cards.push(`<div class="ic"><div class="ic-i" style="background:#FEE2E2;color:#DC2626">✕</div><div><div class="ic-l">No incluye</div><p>${esc(p.no_incluye)}</p></div></div>`);
  if (p.experiencia) cards.push(`<div class="ic"><div class="ic-i" style="background:#DBEAFE;color:#2563EB">★</div><div><div class="ic-l">Experiencia</div><p>${esc(p.experiencia)}</p></div></div>`);
  if (p.capacidad) cards.push(`<div class="ic"><div class="ic-i" style="background:#F3E8FF;color:#7C3AED">◉</div><div><div class="ic-l">Capacidad</div><p>${esc(p.capacidad)}</p></div></div>`);
  if (p.comunas) cards.push(`<div class="ic" style="grid-column:1/-1"><div class="ic-i" style="background:#ECFDF5;color:#059669">◎</div><div><div class="ic-l">Comunas</div><p>${esc(p.comunas)}</p></div></div>`);

  return `<!DOCTYPE html><html lang="es"><head>${headMeta(p)}
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--c:#E8542A;--c2:#FF7A54;--cl:#FFF0EB;--t:#06C7A5;--bg:#FAFAF8;--bg2:#F5F3EF;--w:#FFF;--k:#1A1714;--k2:#3D3733;--m:#8A8278;--b:#E8E4DF;--r:16px;--e:cubic-bezier(.4,0,.2,1);--ft:'Fraunces',serif;--fb:'Outfit',sans-serif}
html{scroll-behavior:smooth}body{font-family:var(--fb);color:var(--k);background:var(--bg);line-height:1.6;-webkit-font-smoothing:antialiased}
img{display:block;max-width:100%}a{color:inherit;text-decoration:none}::selection{background:var(--c);color:#fff}
.container{max-width:960px;margin:0 auto;padding:0 20px}

.nav{position:sticky;top:0;z-index:100;height:56px;background:rgba(255,255,255,.97);backdrop-filter:blur(14px);border-bottom:1px solid var(--b)}
.nav-inner{display:flex;align-items:center;justify-content:space-between;height:56px;max-width:1140px;margin:0 auto;padding:0 20px}
.nav-logo{font-family:var(--ft);font-weight:700;font-size:20px;color:var(--k)}.nav-logo span{color:var(--c)}
.nav-links{display:flex;align-items:center;gap:24px}.nav-links a{font-size:14px;font-weight:500;color:var(--k2);transition:color .2s}.nav-links a:hover{color:var(--c)}
.nav-cta{padding:8px 18px;background:var(--c);color:#fff!important;border-radius:var(--r);font-weight:600;font-size:13px}
@media(max-width:680px){.nav-links{display:none}}

/* Hero */
.hero{position:relative;height:440px;background:#1A1410;overflow:hidden}
.hero>img{width:100%;height:100%;object-fit:cover}
.hero-ov{position:absolute;inset:0;background:linear-gradient(0deg,rgba(26,20,16,.88) 0%,rgba(26,20,16,.2) 60%,transparent 100%)}
.hero-bd{position:absolute;top:20px;left:20px;background:linear-gradient(135deg,var(--c),var(--c2));color:#fff;font-size:12px;font-weight:700;padding:6px 16px;border-radius:100px;letter-spacing:.3px;box-shadow:0 4px 12px rgba(232,84,42,.35)}
.hero-ct{position:absolute;bottom:0;left:0;right:0;padding:0 0 40px}
.hero-in{display:flex;align-items:flex-end;gap:20px}
.hero-lg{width:84px;height:84px;border-radius:20px;background:var(--w);border:3px solid rgba(255,255,255,.9);box-shadow:0 4px 24px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:36px;flex-shrink:0;overflow:hidden}
.hero-lg img{width:100%;height:100%;object-fit:cover}
.hero-tx h1{font-family:var(--ft);font-weight:700;font-size:clamp(26px,4.5vw,38px);color:#fff;line-height:1.12;margin-bottom:4px;text-shadow:0 2px 16px rgba(0,0,0,.35)}
.hero-cat{font-size:14px;color:rgba(255,255,255,.6);margin-bottom:4px}
.hero-tl{font-size:16px;color:rgba(255,255,255,.78);max-width:520px;line-height:1.5}
@media(max-width:600px){.hero{height:340px}.hero-lg{width:64px;height:64px;border-radius:16px}}

/* Quick bar */
.qb{background:var(--w);border-bottom:1px solid var(--b);padding:16px 0}
.qb-in{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.qp{display:flex;align-items:baseline;gap:6px}
.qp .fr{font-size:13px;color:var(--m)}.qp .am{font-size:26px;font-weight:700;color:var(--c);font-family:var(--ft)}.qp .to{font-size:14px;color:var(--k2);margin-left:6px}
.qa{margin-left:auto;display:flex;gap:8px}
.bw{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;background:#25D366;color:#fff;border-radius:12px;font-weight:600;font-size:14px;transition:all .2s var(--e);box-shadow:0 3px 12px rgba(37,211,102,.25)}
.bw:hover{background:#1da851;transform:translateY(-1px);box-shadow:0 6px 20px rgba(37,211,102,.3)}
.bs{display:inline-flex;align-items:center;gap:6px;padding:12px 20px;border:1px solid var(--b);border-radius:12px;font-weight:500;font-size:14px;color:var(--k2);transition:all .2s;background:var(--w)}.bs:hover{border-color:var(--c);color:var(--c)}
@media(max-width:640px){.qa{margin-left:0;width:100%}.bw,.bs{flex:1;justify-content:center}}

/* Body */
.bd{padding:40px 0 60px}
.bg{display:grid;grid-template-columns:1fr 300px;gap:40px;align-items:start}
@media(max-width:768px){.bg{grid-template-columns:1fr}}
.sl{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:var(--c);font-weight:700;margin-bottom:10px}
.bt{font-size:15px;color:var(--k2);line-height:1.8;white-space:pre-wrap;margin-bottom:28px}
.bk{display:inline-flex;align-items:center;gap:6px;font-size:14px;color:var(--m);margin-bottom:20px;transition:color .2s}.bk:hover{color:var(--c)}

/* Info cards */
.ig{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:28px}
@media(max-width:500px){.ig{grid-template-columns:1fr}}
.ic{display:flex;gap:12px;align-items:flex-start;padding:16px;background:var(--w);border:1px solid var(--b);border-radius:var(--r);transition:border-color .2s}.ic:hover{border-color:var(--c)}
.ic-i{width:36px;height:36px;border-radius:10px;background:var(--cl);color:var(--c);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;flex-shrink:0}
.ic-l{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--m);font-weight:600;margin-bottom:2px}
.ic p{font-size:14px;color:var(--k2);line-height:1.6;margin:0}

/* Sidebar */
.sb{position:sticky;top:76px}
.sc{background:var(--w);border:1px solid var(--b);border-radius:var(--r);padding:24px;margin-bottom:16px}
.sc h4{font-family:var(--ft);font-size:16px;font-weight:600;margin-bottom:14px}
.sr{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--b);font-size:13px}.sr:last-child{border-bottom:none}
.sr .l{color:var(--m)}.sr .v{font-weight:500;color:var(--k);text-align:right;max-width:60%}

/* Social */
.socr{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:28px}
.soc{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border:1px solid var(--b);border-radius:10px;font-size:13px;font-weight:500;color:var(--k2);transition:all .2s}
.soc:hover{border-color:var(--c);color:var(--c);background:var(--cl)}

/* Gallery */
.gal-sec{padding:0 0 40px}
.gal{display:grid;gap:8px;border-radius:var(--r);overflow:hidden}
.gal-1{grid-template-columns:1fr}
.gal-2{grid-template-columns:1fr 1fr}
.gal-3{grid-template-columns:2fr 1fr;grid-template-rows:1fr 1fr}.gal-3 .gi:first-child{grid-row:1/3}
.gal-4{grid-template-columns:2fr 1fr 1fr;grid-template-rows:1fr 1fr}.gal-4 .gi:first-child{grid-row:1/3}
.gal-5{grid-template-columns:2fr 1fr 1fr;grid-template-rows:1fr 1fr}.gal-5 .gi:first-child{grid-row:1/3}
.gi{position:relative;overflow:hidden;cursor:pointer;aspect-ratio:4/3;background:var(--bg2)}
.gi img{width:100%;height:100%;object-fit:cover;transition:transform .5s var(--e)}
.gi:hover img{transform:scale(1.06)}
.gi-ov{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;transition:all .3s}
.gi:hover .gi-ov{background:rgba(0,0,0,.25);opacity:1}
@media(max-width:600px){.gal-3,.gal-4,.gal-5{grid-template-columns:1fr 1fr;grid-template-rows:auto}.gal-3 .gi:first-child,.gal-4 .gi:first-child,.gal-5 .gi:first-child{grid-row:auto;grid-column:1/-1}}

/* Lightbox */
.lb{display:none;position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:500;align-items:center;justify-content:center;padding:20px}
.lb.open{display:flex}
.lb img{max-width:90vw;max-height:85vh;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.5);object-fit:contain}
.lb-x{position:absolute;top:20px;right:20px;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.15);color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;border:none;transition:background .2s}.lb-x:hover{background:rgba(255,255,255,.3)}
.lb-n{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.15);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;border:none;transition:background .2s}.lb-n:hover{background:rgba(255,255,255,.3)}
.lb-p{left:16px}.lb-nx{right:16px}
.lb-c{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,.6);font-size:14px}

/* Sticky mobile CTA */
.stk{display:none;position:fixed;bottom:0;left:0;right:0;padding:12px 16px;background:rgba(255,255,255,.97);backdrop-filter:blur(14px);border-top:1px solid var(--b);z-index:90;gap:8px}
.stk .bw{flex:1;justify-content:center;padding:14px}
@media(max-width:768px){.stk{display:flex}body{padding-bottom:70px}}

/* Footer */
.footer{background:var(--bg2);border-top:1px solid var(--b);padding:40px 0 28px}
.footer-inner{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:24px;max-width:1140px;margin:0 auto;padding:0 20px}
.footer-logo{font-family:var(--ft);font-weight:700;font-size:18px;margin-bottom:6px}.footer-logo span{color:var(--c)}
.footer-copy{font-size:13px;color:var(--m)}.footer-links{display:flex;gap:20px;flex-wrap:wrap}.footer-links a{font-size:13px;color:var(--k2)}.footer-links a:hover{color:var(--c)}
</style></head><body>
${nav()}
<section class="hero">
${p.cover_url?`<img src="${esc(p.cover_url)}" alt="${esc(p.nombre)}">`:""}<div class="hero-ov"></div>
<div class="hero-bd">Destacado</div>
<div class="hero-ct"><div class="container"><div class="hero-in">
<div class="hero-lg">${p.logo_url?`<img src="${esc(p.logo_url)}" alt="">`:esc(p.logo_emoji||"✦")}</div>
<div class="hero-tx">${catName?`<div class="hero-cat">${esc(catName)}</div>`:""}<h1>${esc(p.nombre)}</h1>${p.tagline?`<div class="hero-tl">${esc(p.tagline)}</div>`:""}</div>
</div></div></div></section>

<div class="qb"><div class="container"><div class="qb-in">
${p.precio_minimo?`<div class="qp"><span class="fr">Desde</span><span class="am">$${esc(p.precio_minimo)}</span>${p.precio_maximo?`<span class="to">hasta $${esc(p.precio_maximo)}</span>`:""}</div>`:""}
<div class="qa">
${wa?`<a href="${wa}" class="bw" target="_blank" rel="noopener">${waSvg()} WhatsApp</a>`:""}
${p.telefono?`<a href="tel:${esc(p.telefono)}" class="bs">Llamar</a>`:""}
${p.email?`<a href="mailto:${esc(p.email)}" class="bs">Email</a>`:""}
</div></div></div></div>

<section class="bd"><div class="container">
<a href="/proveedores.html" class="bk">← Volver al directorio</a>
<div class="bg"><div>
${p.descripcion?`<div class="sl">Sobre nosotros</div><p class="bt">${esc(p.descripcion)}</p>`:""}
${p.diferenciador?`<div class="sl">Qué nos diferencia</div><p class="bt">${esc(p.diferenciador)}</p>`:""}
${cards.length?`<div class="sl">Detalles</div><div class="ig">${cards.join("")}</div>`:""}
${soc?`<div class="sl">Encuéntranos</div><div class="socr">${soc}</div>`:""}
</div>
<div class="sb"><div class="sc"><h4>Información</h4>
${p.responsable?`<div class="sr"><span class="l">Responsable</span><span class="v">${esc(p.responsable)}</span></div>`:""}
${catName?`<div class="sr"><span class="l">Categoría</span><span class="v">${esc(catName)}</span></div>`:""}
${p.experiencia?`<div class="sr"><span class="l">Experiencia</span><span class="v">${esc(p.experiencia)}</span></div>`:""}
${p.capacidad?`<div class="sr"><span class="l">Capacidad</span><span class="v">${esc(p.capacidad)}</span></div>`:""}
${p.comunas?`<div class="sr"><span class="l">Comunas</span><span class="v">${esc(p.comunas)}</span></div>`:""}
</div>
${wa?`<a href="${wa}" class="bw" target="_blank" rel="noopener" style="width:100%;justify-content:center;margin-bottom:12px">${waSvg()} Contactar por WhatsApp</a>`:""}
${p.email?`<a href="mailto:${esc(p.email)}" class="bs" style="width:100%;justify-content:center">Enviar email</a>`:""}
</div></div></div></section>

${galHtml}
${foot()}

${wa?`<div class="stk"><a href="${wa}" class="bw" target="_blank" rel="noopener">${waSvg()} WhatsApp</a></div>`:""}

<div class="lb" id="lb" onclick="if(event.target===this)closeLb()">
<button class="lb-x" onclick="closeLb()">✕</button>
<button class="lb-n lb-p" onclick="lbN(-1)">‹</button>
<img id="lbi" src="" alt="">
<button class="lb-n lb-nx" onclick="lbN(1)">›</button>
<div class="lb-c" id="lbc"></div></div>
<script>
const im=[${imagenes.map(i=>`"${esc(i)}"`).join(",")}];let li=0;
function openLb(i){li=i;document.getElementById('lbi').src=im[i];document.getElementById('lbc').textContent=(i+1)+' / '+im.length;document.getElementById('lb').classList.add('open');document.body.style.overflow='hidden'}
function closeLb(){document.getElementById('lb').classList.remove('open');document.body.style.overflow=''}
function lbN(d){li=(li+d+im.length)%im.length;document.getElementById('lbi').src=im[li];document.getElementById('lbc').textContent=(li+1)+' / '+im.length}
document.addEventListener('keydown',e=>{if(!document.getElementById('lb').classList.contains('open'))return;if(e.key==='Escape')closeLb();if(e.key==='ArrowLeft')lbN(-1);if(e.key==='ArrowRight')lbN(1)});
</script></body></html>`;
}

/* ═══ BÁSICO ═══ */
function buildBasico(p, catName) {
  const soc = socLinks(p);
  return `<!DOCTYPE html><html lang="es"><head>${headMeta(p)}
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--c:#E8542A;--c2:#FF7A54;--cl:#FFF0EB;--bg:#FAFAF8;--bg2:#F5F3EF;--w:#FFF;--k:#1A1714;--k2:#3D3733;--m:#8A8278;--b:#E8E4DF;--r:16px;--e:cubic-bezier(.4,0,.2,1);--ft:'Fraunces',serif;--fb:'Outfit',sans-serif}
html{scroll-behavior:smooth}body{font-family:var(--fb);color:var(--k);background:var(--bg);line-height:1.6;-webkit-font-smoothing:antialiased}
img{display:block;max-width:100%}a{color:inherit;text-decoration:none}::selection{background:var(--c);color:#fff}
.container{max-width:640px;margin:0 auto;padding:0 20px}

.nav{position:sticky;top:0;z-index:100;height:56px;background:rgba(255,255,255,.97);backdrop-filter:blur(14px);border-bottom:1px solid var(--b)}
.nav-inner{display:flex;align-items:center;justify-content:space-between;height:56px;max-width:1140px;margin:0 auto;padding:0 20px}
.nav-logo{font-family:var(--ft);font-weight:700;font-size:20px;color:var(--k)}.nav-logo span{color:var(--c)}
.nav-links{display:flex;align-items:center;gap:24px}.nav-links a{font-size:14px;font-weight:500;color:var(--k2);transition:color .2s}.nav-links a:hover{color:var(--c)}
.nav-cta{padding:8px 18px;background:var(--c);color:#fff!important;border-radius:var(--r);font-weight:600;font-size:13px}
@media(max-width:680px){.nav-links{display:none}}

.bh{background:var(--w);border-bottom:1px solid var(--b);padding:40px 0 32px}
.bh-in{display:flex;align-items:center;gap:20px}
.bh-lg{width:72px;height:72px;border-radius:16px;background:var(--bg2);border:2px solid var(--b);display:flex;align-items:center;justify-content:center;font-size:32px;flex-shrink:0;overflow:hidden}.bh-lg img{width:100%;height:100%;object-fit:cover}
.bh-tx h1{font-family:var(--ft);font-weight:700;font-size:clamp(22px,4vw,28px);line-height:1.2;margin-bottom:2px}
.bh-cat{font-size:14px;color:var(--m)}.bh-tl{font-size:15px;color:var(--k2);margin-top:4px}

.bc{padding:32px 0 60px}
.bk{display:inline-flex;align-items:center;gap:6px;font-size:14px;color:var(--m);margin-bottom:24px;transition:color .2s}.bk:hover{color:var(--c)}
.sl{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:var(--c);font-weight:700;margin-bottom:8px}
.bt{font-size:15px;color:var(--k2);line-height:1.8;white-space:pre-wrap;margin-bottom:24px}

.bp{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:24px;padding:20px;background:var(--w);border:1px solid var(--b);border-radius:var(--r)}
.bp-i{font-size:14px;color:var(--k2)}.bp-i strong{color:var(--c);font-size:20px;font-weight:700}

.bd{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}
@media(max-width:500px){.bd{grid-template-columns:1fr}}
.bdi{padding:14px;background:var(--w);border:1px solid var(--b);border-radius:12px;font-size:14px;color:var(--k2)}
.bdi strong{display:block;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--m);font-weight:600;margin-bottom:2px}

.socr{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px}
.soc{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border:1px solid var(--b);border-radius:10px;font-size:13px;font-weight:500;color:var(--k2);transition:all .2s}
.soc:hover{border-color:var(--c);color:var(--c);background:var(--cl)}

.bct{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px}
.bs{display:inline-flex;align-items:center;gap:6px;padding:14px 24px;border:1px solid var(--b);border-radius:12px;font-weight:500;font-size:15px;color:var(--k2);transition:all .2s;background:var(--w)}.bs:hover{border-color:var(--c);color:var(--c)}

.up{background:linear-gradient(135deg,#FFF9F7,#fff);border:2px solid var(--c);border-radius:var(--r);padding:32px;text-align:center;margin-bottom:24px}
.up-i{font-size:36px;margin-bottom:10px}
.up h3{font-family:var(--ft);font-size:22px;font-weight:600;color:var(--c);margin-bottom:10px}
.up p{font-size:14px;color:var(--k2);line-height:1.7;margin-bottom:18px;max-width:440px;margin-left:auto;margin-right:auto}
.up-ft{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:18px}
.up-f{padding:6px 14px;background:var(--cl);border-radius:100px;font-size:12px;font-weight:600;color:var(--c)}
.up-btn{display:inline-flex;align-items:center;gap:6px;padding:14px 32px;background:var(--c);color:#fff;border-radius:12px;font-weight:600;font-size:15px;transition:all .2s}.up-btn:hover{background:var(--c2);transform:translateY(-1px)}

.footer{background:var(--bg2);border-top:1px solid var(--b);padding:40px 0 28px}
.footer-inner{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:24px;max-width:1140px;margin:0 auto;padding:0 20px}
.footer-logo{font-family:var(--ft);font-weight:700;font-size:18px;margin-bottom:6px}.footer-logo span{color:var(--c)}
.footer-copy{font-size:13px;color:var(--m)}.footer-links{display:flex;gap:20px;flex-wrap:wrap}.footer-links a{font-size:13px;color:var(--k2)}.footer-links a:hover{color:var(--c)}
</style></head><body>
${nav()}
<section class="bh"><div class="container"><div class="bh-in">
<div class="bh-lg">${p.logo_url?`<img src="${esc(p.logo_url)}" alt="">`:esc(p.logo_emoji||"📋")}</div>
<div class="bh-tx"><h1>${esc(p.nombre)}</h1>${catName?`<div class="bh-cat">${esc(catName)}</div>`:""} ${p.tagline?`<div class="bh-tl">${esc(p.tagline)}</div>`:""}</div>
</div></div></section>

<section class="bc"><div class="container">
<a href="/proveedores.html" class="bk">← Volver al directorio</a>
${p.diferenciador?`<div class="sl">Qué nos diferencia</div><p class="bt">${esc(p.diferenciador)}</p>`:""}
${p.precio_minimo||p.precio_maximo?`<div class="bp">${p.precio_minimo?`<div class="bp-i">Desde <strong>$${esc(p.precio_minimo)}</strong></div>`:""}${p.precio_maximo?`<div class="bp-i">Hasta <strong>$${esc(p.precio_maximo)}</strong></div>`:""}</div>`:""}
<div class="bd">
${p.experiencia?`<div class="bdi"><strong>Experiencia</strong>${esc(p.experiencia)}</div>`:""}
${p.comunas?`<div class="bdi"><strong>Comunas</strong>${esc(p.comunas)}</div>`:""}
</div>
${soc?`<div class="socr">${soc}</div>`:""}
<div class="bct">
${p.email?`<a href="mailto:${esc(p.email)}" class="bs">✉️ Enviar email</a>`:""}
${p.telefono?`<a href="tel:${esc(p.telefono)}" class="bs">📞 Llamar</a>`:""}
</div>
<div class="up"><div class="up-i">✦</div><h3>Desbloquea tu perfil completo</h3>
<p>Con el plan Destacado tu negocio obtiene máxima visibilidad y los clientes te contactan directo por WhatsApp.</p>
<div class="up-ft"><span class="up-f">Foto de portada</span><span class="up-f">Galería de fotos</span><span class="up-f">WhatsApp directo</span><span class="up-f">Descripción completa</span><span class="up-f">Posición prioritaria</span></div>
<a href="/form.html" class="up-btn">Activar Destacado →</a></div>
</div></section>
${foot()}
</body></html>`;
}
