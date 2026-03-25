/**
 * /prov/:slug — Dynamic provider page (v3)
 * Premium editorial design with advanced SEO
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
  const dest = p.posicion && p.posicion > 0;
  const imgs = p.imagenes || [];
  let catName = "";
  try { const { data: etiq } = await supabase.from("etiquetas").select("nombre").eq("id", p.categoria).limit(1); if (etiq && etiq.length > 0) catName = etiq[0].nombre; } catch (e) {}
  // Also try categoria table if etiqueta not found
  if (!catName) { try { const { data: cat } = await supabase.from("categorias").select("nombre").eq("id", p.categoria).limit(1); if (cat && cat.length > 0) catName = cat[0].nombre; } catch(e){} }
  const html = dest ? buildDest(p, catName, imgs) : buildBasic(p, catName);
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300, s-maxage=600" } });
}

function esc(s) { if (!s) return ""; return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
function fmtPrice(n) { if (!n) return ""; return "$" + Number(n).toLocaleString("es-CL"); }

function build404(slug) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>No encontrado — CotizaEventos.cl</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700&family=Outfit:wght@400;600&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0}body{font-family:'Outfit',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#FAFAF8;color:#1A1714;text-align:center;padding:20px}h1{font-family:'Fraunces',serif;font-size:32px;margin-bottom:12px}p{color:#8A8278;font-size:16px;margin-bottom:24px}a{display:inline-block;padding:14px 32px;background:#E8542A;color:#fff;border-radius:14px;font-weight:600;text-decoration:none;transition:all .2s}a:hover{background:#FF7A54;transform:translateY(-1px)}</style></head>
<body><div><h1>Proveedor no encontrado</h1><p>No encontramos un proveedor con la URL "${esc(slug)}".</p><a href="/proveedores.html">Explorar directorio →</a></div></body></html>`;
}

function meta(p, catName) {
  const name = esc(p.nombre);
  const cat = esc(catName);
  const t = `${name}${cat ? " — " + cat : ""} en Santiago | CotizaEventos.cl`;
  const rawDesc = p.descripcion || p.tagline || p.diferenciador || `${p.nombre} — proveedor de eventos en Santiago`;
  const d = esc(rawDesc.substring(0, 155) + (rawDesc.length > 155 ? "..." : ""));
  const u = `https://www.cotizaeventos.cl/prov/${esc(p.slug)}`;
  const img = p.cover_url || p.logo_url || "https://www.cotizaeventos.cl/favicon.png";

  // Rich schema.org
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": u,
    name: p.nombre,
    description: rawDesc.substring(0, 300),
    url: u,
    image: p.cover_url ? [p.cover_url, ...(p.imagenes || [])] : (p.logo_url ? [p.logo_url] : []),
    telephone: p.telefono || undefined,
    email: p.email || undefined,
    areaServed: { "@type": "City", name: p.comunas || "Santiago" },
    address: { "@type": "PostalAddress", addressLocality: "Santiago", addressRegion: "Región Metropolitana", addressCountry: "CL" },
    priceRange: p.precio_minimo ? `CLP ${p.precio_minimo}${p.precio_maximo ? " - " + p.precio_maximo : "+"}` : undefined,
    category: catName || undefined,
    sameAs: [p.instagram ? "https://instagram.com/" + p.instagram : null, p.facebook || null, p.tiktok ? "https://tiktok.com/@" + p.tiktok : null, p.youtube || null, p.web || null].filter(Boolean),
    isPartOf: { "@type": "WebSite", name: "CotizaEventos.cl", url: "https://www.cotizaeventos.cl" },
  };
  // Clean undefined
  Object.keys(schema).forEach(k => schema[k] === undefined && delete schema[k]);

  // Breadcrumb schema
  const bc = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: "https://www.cotizaeventos.cl/" },
    { "@type": "ListItem", position: 2, name: "Proveedores", item: "https://www.cotizaeventos.cl/proveedores.html" },
    { "@type": "ListItem", position: 3, name: p.nombre, item: u },
  ]};

  return `<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${t}</title>
<meta name="description" content="${d}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${u}">
<meta property="og:type" content="business.business">
<meta property="og:title" content="${name} — CotizaEventos.cl">
<meta property="og:description" content="${d}">
<meta property="og:url" content="${u}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:site_name" content="CotizaEventos.cl">
<meta property="og:locale" content="es_CL">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${name}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${esc(img)}">
<meta name="geo.region" content="CL-RM">
<meta name="geo.placename" content="Santiago">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<script type="application/ld+json">${JSON.stringify(bc)}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">`;
}

function navH() {
  return `<nav class="n" aria-label="Principal"><div class="ni">
<a href="/" class="nl" aria-label="CotizaEventos inicio">Cotiza<span>Eventos</span>.cl</a>
<div class="nk"><a href="/">Inicio</a><a href="/proveedores.html">Proveedores</a><a href="/nosotros.html">Nosotros</a><a href="/form.html" class="nc">Publica tu negocio</a></div>
<button class="nb" onclick="document.getElementById('nm').classList.toggle('open')" aria-label="Menú"><span></span><span></span><span></span></button>
</div></nav>
<div class="nm" id="nm"><button class="nm-x" onclick="this.parentElement.classList.remove('open')">✕</button>
<a href="/">Inicio</a><a href="/proveedores.html">Proveedores</a><a href="/nosotros.html">Nosotros</a><a href="/form.html">Publica tu negocio</a></div>`;
}

function footH() {
  return `<footer class="ft"><div class="fti"><div><div class="ftl">Cotiza<span>Eventos</span>.cl</div><p class="ftc">© 2025 CotizaEventos.cl — Directorio de proveedores de eventos en Santiago.</p></div>
<nav class="ftk" aria-label="Footer"><a href="/proveedores.html">Proveedores</a><a href="/nosotros.html">Nosotros</a><a href="/form.html">Publicar negocio</a><a href="/terminos.html">Términos</a></nav></div></footer>`;
}

function socH(p) {
  const s = [];
  if (p.instagram) s.push(["https://instagram.com/" + esc(p.instagram), "Instagram", '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5"/></svg>']);
  if (p.facebook) s.push([esc(p.facebook), "Facebook", '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>']);
  if (p.tiktok) s.push(["https://tiktok.com/@" + esc(p.tiktok), "TikTok", '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-.88-5.64V9.01a6.33 6.33 0 00-1 12.58 6.33 6.33 0 006.88-6.31V9.4a8.16 8.16 0 005.1 1.76V7.72a4.85 4.85 0 01-1-.58z"/></svg>']);
  if (p.youtube) s.push([esc(p.youtube), "YouTube", '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 00.5 6.19 31.76 31.76 0 000 12a31.76 31.76 0 00.5 5.81 3.02 3.02 0 002.12 2.14c1.84.55 9.38.55 9.38.55s7.54 0 9.38-.55a3.02 3.02 0 002.12-2.14A31.76 31.76 0 0024 12a31.76 31.76 0 00-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>']);
  if (p.web) s.push([esc(p.web), "Sitio web", '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>']);
  return s.map(([href, label, icon]) => `<a href="${href}" target="_blank" rel="noopener" class="sc">${icon}<span>${label}</span></a>`).join("");
}

const WA = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.04-.97-.27-.1-.47-.15-.66.15-.2.3-.76.97-.93 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.18-.3-.02-.46.13-.61.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.91-2.2-.24-.57-.49-.5-.67-.5h-.58c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.22 5.1 4.51.71.31 1.27.5 1.7.63.72.23 1.37.2 1.88.12.58-.08 1.76-.72 2.01-1.41.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35zM12.05 21.5c-1.8 0-3.55-.49-5.08-1.4l-.36-.22-3.78.99 1.01-3.69-.24-.37A9.43 9.43 0 012.5 12.05C2.5 6.79 6.79 2.5 12.05 2.5c2.56 0 4.96 1 6.77 2.81a9.5 9.5 0 012.8 6.74c0 5.26-4.28 9.54-9.54 9.54l-.03-.09zm8.14-17.62A11.4 11.4 0 0012.05.5C5.68.5.5 5.68.5 12.05c0 2.04.53 4.03 1.55 5.78L.5 23.5l5.83-1.53A11.4 11.4 0 0012.05 23.5c6.37 0 11.55-5.18 11.55-11.55a11.4 11.4 0 00-3.41-8.07z"/></svg>';


/* ═══ DESTACADO PAGE ═══ */
function buildDest(p, catName, imgs) {
  const wa = p.whatsapp ? `https://wa.me/${esc(p.whatsapp)}` : "";
  const soc = socH(p);
  const prMin = fmtPrice(p.precio_minimo);
  const prMax = fmtPrice(p.precio_maximo);

  // Gallery
  let galHtml = "";
  if (imgs.length > 0) {
    const cnt = Math.min(imgs.length, 5);
    galHtml = `<section class="gs" aria-label="Galería">
<div class="gl gl-${cnt}">
${imgs.slice(0, 5).map((img, i) => `<figure class="gf" onclick="openLb(${i})" role="button" tabindex="0" aria-label="Ver foto ${i+1}"><img src="${esc(img)}" alt="${esc(p.nombre)} — foto ${i+1}" loading="lazy"><div class="go"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div></figure>`).join("")}
${imgs.length > 5 ? `<div class="gm" onclick="openLb(5)">+${imgs.length - 5} más</div>` : ""}
</div></section>`;
  }

  // Detail items
  const dts = [];
  if (p.incluye) dts.push(["✓","Incluye",p.incluye,"#D1FAE5","#059669"]);
  if (p.no_incluye) dts.push(["✕","No incluye",p.no_incluye,"#FEE2E2","#DC2626"]);
  if (p.experiencia) dts.push(["★","Experiencia",p.experiencia,"#DBEAFE","#2563EB"]);
  if (p.capacidad) dts.push(["◉","Capacidad",p.capacidad,"#F3E8FF","#7C3AED"]);

  return `<!DOCTYPE html><html lang="es"><head>${meta(p, catName)}
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--c:#E8542A;--c2:#FF7A54;--cl:#FFF0EB;--cm:#FFCFC2;--t:#06C7A5;--bg:#FAFAF8;--bg2:#F5F3EF;--w:#FFF;--k:#1A1714;--k2:#3D3733;--m:#8A8278;--b:#E8E4DF;--b2:#D4CFC9;--r:14px;--e:cubic-bezier(.4,0,.2,1);--sh:0 2px 12px rgba(0,0,0,.06);--sh2:0 8px 30px rgba(0,0,0,.1);--ft:'Fraunces',serif;--fb:'Outfit',sans-serif}
html{scroll-behavior:smooth}
body{font-family:var(--fb);color:var(--k);background:var(--bg);line-height:1.65;-webkit-font-smoothing:antialiased;overflow-x:hidden}
img{display:block;max-width:100%}a{color:inherit;text-decoration:none}::selection{background:var(--c);color:#fff}
.cx{max-width:1080px;margin:0 auto;padding:0 24px}

/* Nav */
.n{position:sticky;top:0;z-index:100;height:56px;background:rgba(255,255,255,.97);backdrop-filter:blur(16px);border-bottom:1px solid var(--b)}
.ni{display:flex;align-items:center;justify-content:space-between;height:56px;max-width:1140px;margin:0 auto;padding:0 24px}
.nl{font-family:var(--ft);font-weight:700;font-size:20px;color:var(--k)}.nl span{color:var(--c)}
.nk{display:flex;align-items:center;gap:28px}.nk a{font-size:14px;font-weight:500;color:var(--k2);transition:color .2s}.nk a:hover{color:var(--c)}
.nc{padding:8px 20px;background:var(--c);color:#fff!important;border-radius:var(--r);font-weight:600;font-size:13px;transition:all .2s}.nc:hover{background:var(--c2)}
.nb{display:none;width:32px;height:32px;flex-direction:column;justify-content:center;gap:5px;cursor:pointer;background:none;border:none}.nb span{display:block;height:2px;background:var(--k);border-radius:2px}
.nm{display:none;position:fixed;inset:0;background:var(--w);z-index:200;flex-direction:column;padding:80px 32px}.nm.open{display:flex}
.nm a{font-size:20px;font-weight:500;padding:16px 0;border-bottom:1px solid var(--b);color:var(--k)}.nm a:hover{color:var(--c)}
.nm-x{position:absolute;top:16px;right:20px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:24px;color:var(--k);background:none;border:none;cursor:pointer}
@media(max-width:768px){.nk{display:none}.nb{display:flex}}

/* Breadcrumbs */
.bc{padding:14px 0;font-size:13px;color:var(--m)}
.bc a{color:var(--m);transition:color .15s}.bc a:hover{color:var(--c)}
.bc span{margin:0 6px;opacity:.5}

/* Hero */
.hero{position:relative;height:480px;background:#1A1410;overflow:hidden}
.hero>img{width:100%;height:100%;object-fit:cover;transition:transform 8s linear}
.hero:hover>img{transform:scale(1.03)}
.hero-ov{position:absolute;inset:0;background:linear-gradient(180deg,rgba(26,20,16,.1) 0%,rgba(26,20,16,.25) 40%,rgba(26,20,16,.92) 100%)}
.hero-bd{position:absolute;top:24px;left:24px;display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,var(--c),var(--c2));color:#fff;font-size:11px;font-weight:700;padding:7px 16px;border-radius:100px;letter-spacing:.5px;text-transform:uppercase;box-shadow:0 4px 16px rgba(232,84,42,.4)}
.hero-ct{position:absolute;bottom:0;left:0;right:0;padding:0 0 48px}
.hero-in{display:flex;align-items:flex-end;gap:24px}
.hero-lg{width:96px;height:96px;border-radius:22px;background:var(--w);border:4px solid rgba(255,255,255,.95);box-shadow:0 6px 30px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font-size:40px;flex-shrink:0;overflow:hidden}
.hero-lg img{width:100%;height:100%;object-fit:cover}
.hero-tx{min-width:0}
.hero-tx h1{font-family:var(--ft);font-weight:700;font-size:clamp(28px,5vw,42px);color:#fff;line-height:1.1;margin-bottom:6px;text-shadow:0 2px 20px rgba(0,0,0,.4)}
.hero-cat{display:inline-block;font-size:12px;font-weight:600;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px}
.hero-tl{font-size:17px;color:rgba(255,255,255,.8);max-width:560px;line-height:1.55;font-weight:300}
@media(max-width:640px){.hero{height:360px}.hero-lg{width:72px;height:72px;border-radius:18px}.hero-ct{padding-bottom:32px}}

/* Stat bar */
.sb{background:var(--w);border-bottom:1px solid var(--b);padding:18px 0}
.sb-in{display:flex;align-items:center;gap:24px;flex-wrap:wrap}
.sb-p{display:flex;align-items:baseline;gap:8px}
.sb-p .f{font-size:13px;color:var(--m);font-weight:500}
.sb-p .a{font-size:28px;font-weight:700;color:var(--c);font-family:var(--ft);letter-spacing:-.5px}
.sb-p .t{font-size:14px;color:var(--k2)}
.sb-d{width:1px;height:32px;background:var(--b);flex-shrink:0}
.sb-s{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--m)}
.sb-s svg{color:var(--c)}
.sb-a{margin-left:auto;display:flex;gap:10px}
.bw{display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:#25D366;color:#fff;border-radius:12px;font-weight:600;font-size:14px;transition:all .25s var(--e);box-shadow:0 3px 14px rgba(37,211,102,.25)}
.bw:hover{background:#1da851;transform:translateY(-2px);box-shadow:0 8px 24px rgba(37,211,102,.3)}
.bt{display:inline-flex;align-items:center;gap:6px;padding:12px 22px;border:1.5px solid var(--b);border-radius:12px;font-weight:500;font-size:14px;color:var(--k2);transition:all .2s;background:var(--w)}.bt:hover{border-color:var(--c);color:var(--c)}
@media(max-width:640px){.sb-a{margin-left:0;width:100%}.bw,.bt{flex:1;justify-content:center}.sb-d{display:none}}

/* Layout */
.ly{padding:48px 0 80px}
.lg{display:grid;grid-template-columns:1fr 340px;gap:48px;align-items:start}
@media(max-width:900px){.lg{grid-template-columns:1fr}}

/* Main content */
.sec{margin-bottom:40px}
.sec:last-child{margin-bottom:0}
.sl{font-size:11px;text-transform:uppercase;letter-spacing:2.5px;color:var(--c);font-weight:700;margin-bottom:12px}
.sh{font-family:var(--ft);font-size:22px;font-weight:600;color:var(--k);margin-bottom:14px;line-height:1.3}
.sp{font-size:15.5px;color:var(--k2);line-height:1.85;white-space:pre-wrap}

/* Detail cards */
.dg{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:500px){.dg{grid-template-columns:1fr}}
.dc{display:flex;gap:14px;align-items:flex-start;padding:18px;background:var(--w);border:1.5px solid var(--b);border-radius:var(--r);transition:all .25s var(--e)}
.dc:hover{border-color:var(--cm);box-shadow:var(--sh)}
.dc-i{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;flex-shrink:0}
.dc-l{font-size:10px;text-transform:uppercase;letter-spacing:1.2px;color:var(--m);font-weight:700;margin-bottom:3px}
.dc p{font-size:14px;color:var(--k2);line-height:1.6;margin:0}

/* Comunas */
.cm-wrap{display:flex;flex-wrap:wrap;gap:6px}
.cm-tag{padding:6px 14px;background:var(--bg2);border:1px solid var(--b);border-radius:100px;font-size:13px;color:var(--k2);font-weight:500}

/* Social */
.scr{display:flex;gap:8px;flex-wrap:wrap}
.sc{display:inline-flex;align-items:center;gap:7px;padding:10px 18px;background:var(--w);border:1.5px solid var(--b);border-radius:10px;font-size:13px;font-weight:500;color:var(--k2);transition:all .2s}
.sc:hover{border-color:var(--c);color:var(--c);background:var(--cl)}.sc span{display:inline}
@media(max-width:500px){.sc span{display:none}.sc{padding:10px 13px}}

/* Gallery */
.gs{margin-bottom:40px}
.gl{display:grid;gap:6px;border-radius:var(--r);overflow:hidden}
.gl-1{grid-template-columns:1fr}.gl-1 .gf{max-height:480px}
.gl-2{grid-template-columns:1fr 1fr}
.gl-3{grid-template-columns:3fr 2fr;grid-template-rows:1fr 1fr}.gl-3 .gf:first-child{grid-row:1/3}
.gl-4{grid-template-columns:3fr 1fr 1fr;grid-template-rows:1fr 1fr}.gl-4 .gf:first-child{grid-row:1/3}
.gl-5{grid-template-columns:3fr 1fr 1fr;grid-template-rows:1fr 1fr}.gl-5 .gf:first-child{grid-row:1/3}
.gf{position:relative;overflow:hidden;cursor:pointer;aspect-ratio:4/3;background:var(--bg2);margin:0}
.gf img{width:100%;height:100%;object-fit:cover;transition:transform .6s var(--e)}
.gf:hover img{transform:scale(1.06)}
.go{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;background:rgba(0,0,0,0);transition:all .3s}
.gf:hover .go{background:rgba(0,0,0,.3);opacity:1}
.gm{display:flex;align-items:center;justify-content:center;background:var(--bg2);font-size:18px;font-weight:600;color:var(--m);cursor:pointer;transition:all .2s}
.gm:hover{background:var(--cl);color:var(--c)}
@media(max-width:600px){.gl-3,.gl-4,.gl-5{grid-template-columns:1fr 1fr;grid-template-rows:auto}.gl-3 .gf:first-child,.gl-4 .gf:first-child,.gl-5 .gf:first-child{grid-row:auto;grid-column:1/-1}}

/* Sidebar */
.aside{position:sticky;top:80px}
@media(max-width:900px){.aside{position:static}}
.card{background:var(--w);border:1.5px solid var(--b);border-radius:var(--r);padding:28px;margin-bottom:16px;box-shadow:var(--sh)}
.card h4{font-family:var(--ft);font-size:17px;font-weight:600;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--b)}
.cr{display:flex;justify-content:space-between;align-items:flex-start;padding:10px 0;font-size:13.5px}
.cr:not(:last-child){border-bottom:1px solid var(--b)}
.cr .l{color:var(--m);flex-shrink:0;margin-right:12px}.cr .v{font-weight:500;color:var(--k);text-align:right;word-break:break-word}

/* CTA banner */
.ctab{background:linear-gradient(135deg,#1A1410 0%,#2D221A 100%);color:#fff;border-radius:var(--r);padding:36px;text-align:center;margin-top:48px}
.ctab h3{font-family:var(--ft);font-size:20px;font-weight:600;margin-bottom:8px}
.ctab p{font-size:14px;color:rgba(255,255,255,.6);margin-bottom:20px;max-width:400px;margin-left:auto;margin-right:auto;line-height:1.6}
.ctab a{display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:var(--c);color:#fff;border-radius:12px;font-weight:600;font-size:14px;transition:all .2s}
.ctab a:hover{background:var(--c2);transform:translateY(-1px)}

/* Lightbox */
.lb{display:none;position:fixed;inset:0;background:rgba(10,8,6,.95);z-index:500;align-items:center;justify-content:center;padding:20px}
.lb.open{display:flex}
.lb img{max-width:92vw;max-height:88vh;border-radius:10px;box-shadow:0 24px 80px rgba(0,0,0,.6);object-fit:contain}
.lb-x{position:absolute;top:20px;right:20px;width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.1);color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;border:none;transition:all .2s;backdrop-filter:blur(8px)}.lb-x:hover{background:rgba(255,255,255,.25)}
.lb-n{position:absolute;top:50%;transform:translateY(-50%);width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.1);color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;border:none;transition:all .2s;backdrop-filter:blur(8px)}.lb-n:hover{background:rgba(255,255,255,.25)}
.lb-p{left:16px}.lb-nx{right:16px}
.lb-c{position:absolute;bottom:24px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,.5);font-size:14px;font-weight:500}

/* Sticky mobile CTA */
.stk{display:none;position:fixed;bottom:0;left:0;right:0;padding:12px 16px;background:rgba(255,255,255,.97);backdrop-filter:blur(16px);border-top:1px solid var(--b);z-index:90;gap:10px}
.stk .bw{flex:1;justify-content:center;padding:14px;font-size:15px}
@media(max-width:900px){.stk{display:flex}body{padding-bottom:72px}}

/* Footer */
.ft{background:var(--bg2);border-top:1px solid var(--b);padding:48px 0 32px}
.fti{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:24px;max-width:1140px;margin:0 auto;padding:0 24px}
.ftl{font-family:var(--ft);font-weight:700;font-size:18px;margin-bottom:6px}.ftl span{color:var(--c)}
.ftc{font-size:13px;color:var(--m);line-height:1.5}
.ftk{display:flex;gap:24px;flex-wrap:wrap}.ftk a{font-size:14px;color:var(--k2);transition:color .2s}.ftk a:hover{color:var(--c)}

@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.anim{animation:fadeUp .5s var(--e) both}
.anim-d1{animation-delay:.1s}.anim-d2{animation-delay:.2s}.anim-d3{animation-delay:.3s}
</style></head><body>
${navH()}

<div class="cx"><nav class="bc" aria-label="Breadcrumb"><a href="/">Inicio</a><span>›</span><a href="/proveedores.html">Proveedores</a><span>›</span><strong>${esc(p.nombre)}</strong></nav></div>

<article>
<section class="hero" aria-label="Portada">
${p.cover_url ? `<img src="${esc(p.cover_url)}" alt="Portada de ${esc(p.nombre)}">` : ""}
<div class="hero-ov"></div>
<div class="hero-bd">✦ Destacado</div>
<div class="hero-ct"><div class="cx"><div class="hero-in anim">
<div class="hero-lg">${p.logo_url ? `<img src="${esc(p.logo_url)}" alt="Logo de ${esc(p.nombre)}">` : esc(p.logo_emoji || "✦")}</div>
<div class="hero-tx">
${catName ? `<div class="hero-cat">${esc(catName)}</div>` : ""}
<h1>${esc(p.nombre)}</h1>
${p.tagline ? `<p class="hero-tl">${esc(p.tagline)}</p>` : ""}
</div>
</div></div></div>
</section>

<div class="sb"><div class="cx"><div class="sb-in">
${prMin ? `<div class="sb-p"><span class="f">Desde</span><span class="a">${prMin}</span>${prMax ? `<span class="t">hasta ${prMax}</span>` : ""}</div>` : ""}
${p.experiencia ? `<div class="sb-d"></div><div class="sb-s"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> ${esc(p.experiencia)}</div>` : ""}
${p.comunas ? `<div class="sb-d"></div><div class="sb-s"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> ${esc(p.comunas.length > 40 ? p.comunas.substring(0, 40) + "..." : p.comunas)}</div>` : ""}
<div class="sb-a">
${wa ? `<a href="${wa}" class="bw" target="_blank" rel="noopener">${WA} WhatsApp</a>` : ""}
${p.telefono ? `<a href="tel:${esc(p.telefono)}" class="bt">📞 Llamar</a>` : ""}
${p.email ? `<a href="mailto:${esc(p.email)}" class="bt">✉️ Email</a>` : ""}
</div>
</div></div></div>

<div class="ly"><div class="cx"><div class="lg">
<main>
${p.descripcion ? `<section class="sec anim"><div class="sl">Sobre nosotros</div><h2 class="sh">Conoce ${esc(p.nombre)}</h2><p class="sp">${esc(p.descripcion)}</p></section>` : ""}

${p.diferenciador ? `<section class="sec anim anim-d1"><div class="sl">Qué nos diferencia</div><p class="sp">${esc(p.diferenciador)}</p></section>` : ""}

${galHtml}

${dts.length ? `<section class="sec anim anim-d2"><div class="sl">Detalles del servicio</div><div class="dg">${dts.map(([ico, label, val, bg, clr]) => `<div class="dc"><div class="dc-i" style="background:${bg};color:${clr}">${ico}</div><div><div class="dc-l">${label}</div><p>${esc(val)}</p></div></div>`).join("")}</div></section>` : ""}

${p.comunas ? `<section class="sec"><div class="sl">Zonas de cobertura</div><div class="cm-wrap">${p.comunas.split(",").map(c => `<span class="cm-tag">${esc(c.trim())}</span>`).join("")}</div></section>` : ""}

${soc ? `<section class="sec"><div class="sl">Encuéntranos en redes</div><div class="scr">${soc}</div></section>` : ""}

<div class="ctab"><h3>¿Organizas un evento?</h3><p>Contacta a ${esc(p.nombre)} directamente y solicita tu cotización sin compromiso.</p>
${wa ? `<a href="${wa}" target="_blank" rel="noopener">${WA} Pedir cotización</a>` : `<a href="mailto:${esc(p.email)}">✉️ Solicitar información</a>`}
</div>
</main>

<aside class="aside">
<div class="card">
<h4>Contacto</h4>
${wa ? `<a href="${wa}" class="bw" target="_blank" rel="noopener" style="width:100%;justify-content:center;margin-bottom:12px">${WA} WhatsApp</a>` : ""}
${p.email ? `<a href="mailto:${esc(p.email)}" class="bt" style="width:100%;justify-content:center;margin-bottom:12px">✉️ Enviar email</a>` : ""}
${p.telefono ? `<a href="tel:${esc(p.telefono)}" class="bt" style="width:100%;justify-content:center">📞 ${esc(p.telefono)}</a>` : ""}
</div>
<div class="card">
<h4>Información</h4>
${p.responsable ? `<div class="cr"><span class="l">Responsable</span><span class="v">${esc(p.responsable)}</span></div>` : ""}
${catName ? `<div class="cr"><span class="l">Categoría</span><span class="v">${esc(catName)}</span></div>` : ""}
${p.experiencia ? `<div class="cr"><span class="l">Experiencia</span><span class="v">${esc(p.experiencia)}</span></div>` : ""}
${p.capacidad ? `<div class="cr"><span class="l">Capacidad</span><span class="v">${esc(p.capacidad)}</span></div>` : ""}
${prMin ? `<div class="cr"><span class="l">Precio desde</span><span class="v" style="color:var(--c);font-weight:700">${prMin}</span></div>` : ""}
</div>
</aside>
</div></div></div>
</article>

${footH()}

${wa ? `<div class="stk"><a href="${wa}" class="bw" target="_blank" rel="noopener">${WA} Contactar por WhatsApp</a></div>` : ""}

<div class="lb" id="lb" onclick="if(event.target===this)closeLb()">
<button class="lb-x" onclick="closeLb()" aria-label="Cerrar">✕</button>
<button class="lb-n lb-p" onclick="lbN(-1)" aria-label="Anterior">‹</button>
<img id="lbi" src="" alt="${esc(p.nombre)}">
<button class="lb-n lb-nx" onclick="lbN(1)" aria-label="Siguiente">›</button>
<div class="lb-c" id="lbc"></div></div>
<script>
const im=[${imgs.map(i => `"${esc(i)}"`).join(",")}];let li=0;
function openLb(i){li=i;document.getElementById('lbi').src=im[i];document.getElementById('lbc').textContent=(i+1)+'/'+im.length;document.getElementById('lb').classList.add('open');document.body.style.overflow='hidden'}
function closeLb(){document.getElementById('lb').classList.remove('open');document.body.style.overflow=''}
function lbN(d){li=(li+d+im.length)%im.length;document.getElementById('lbi').src=im[li];document.getElementById('lbc').textContent=(li+1)+'/'+im.length}
document.addEventListener('keydown',e=>{const lb=document.getElementById('lb');if(!lb||!lb.classList.contains('open'))return;if(e.key==='Escape')closeLb();if(e.key==='ArrowLeft')lbN(-1);if(e.key==='ArrowRight')lbN(1)});
</script></body></html>`;
}

/* ═══ BÁSICO PAGE ═══ */
function buildBasic(p, catName) {
  const soc = socH(p);
  const prMin = fmtPrice(p.precio_minimo);
  const prMax = fmtPrice(p.precio_maximo);
  return `<!DOCTYPE html><html lang="es"><head>${meta(p, catName)}
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--c:#E8542A;--c2:#FF7A54;--cl:#FFF0EB;--cm:#FFCFC2;--bg:#FAFAF8;--bg2:#F5F3EF;--w:#FFF;--k:#1A1714;--k2:#3D3733;--m:#8A8278;--b:#E8E4DF;--r:14px;--e:cubic-bezier(.4,0,.2,1);--sh:0 2px 12px rgba(0,0,0,.06);--ft:'Fraunces',serif;--fb:'Outfit',sans-serif}
html{scroll-behavior:smooth}body{font-family:var(--fb);color:var(--k);background:var(--bg);line-height:1.65;-webkit-font-smoothing:antialiased}
img{display:block;max-width:100%}a{color:inherit;text-decoration:none}::selection{background:var(--c);color:#fff}
.cx{max-width:680px;margin:0 auto;padding:0 24px}

.n{position:sticky;top:0;z-index:100;height:56px;background:rgba(255,255,255,.97);backdrop-filter:blur(16px);border-bottom:1px solid var(--b)}
.ni{display:flex;align-items:center;justify-content:space-between;height:56px;max-width:1140px;margin:0 auto;padding:0 24px}
.nl{font-family:var(--ft);font-weight:700;font-size:20px;color:var(--k)}.nl span{color:var(--c)}
.nk{display:flex;align-items:center;gap:28px}.nk a{font-size:14px;font-weight:500;color:var(--k2);transition:color .2s}.nk a:hover{color:var(--c)}
.nc{padding:8px 20px;background:var(--c);color:#fff!important;border-radius:var(--r);font-weight:600;font-size:13px}
.nb{display:none;width:32px;height:32px;flex-direction:column;justify-content:center;gap:5px;cursor:pointer;background:none;border:none}.nb span{display:block;height:2px;background:var(--k);border-radius:2px}
.nm{display:none;position:fixed;inset:0;background:var(--w);z-index:200;flex-direction:column;padding:80px 32px}.nm.open{display:flex}
.nm a{font-size:20px;font-weight:500;padding:16px 0;border-bottom:1px solid var(--b);color:var(--k)}
.nm-x{position:absolute;top:16px;right:20px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:24px;color:var(--k);background:none;border:none;cursor:pointer}
@media(max-width:768px){.nk{display:none}.nb{display:flex}}

.bc{padding:14px 0;font-size:13px;color:var(--m)}.bc a{color:var(--m);transition:color .15s}.bc a:hover{color:var(--c)}.bc span{margin:0 6px;opacity:.5}

/* Header */
.hd{background:var(--w);border-bottom:1px solid var(--b);padding:40px 0 36px}
.hd-in{display:flex;align-items:center;gap:20px}
.hd-lg{width:76px;height:76px;border-radius:18px;background:var(--bg2);border:2px solid var(--b);display:flex;align-items:center;justify-content:center;font-size:34px;flex-shrink:0;overflow:hidden}.hd-lg img{width:100%;height:100%;object-fit:cover}
.hd-tx h1{font-family:var(--ft);font-weight:700;font-size:clamp(22px,4vw,30px);line-height:1.2;margin-bottom:4px}
.hd-cat{font-size:13px;color:var(--m);text-transform:uppercase;letter-spacing:1px;font-weight:600}
.hd-tl{font-size:15px;color:var(--k2);margin-top:6px;line-height:1.5}

/* Content */
.ct{padding:36px 0 72px}
.bk{display:inline-flex;align-items:center;gap:6px;font-size:14px;color:var(--m);margin-bottom:28px;transition:color .2s}.bk:hover{color:var(--c)}
.sl{font-size:11px;text-transform:uppercase;letter-spacing:2.5px;color:var(--c);font-weight:700;margin-bottom:10px}
.sp{font-size:15.5px;color:var(--k2);line-height:1.85;white-space:pre-wrap;margin-bottom:28px}

/* Price card */
.pc{display:flex;gap:24px;flex-wrap:wrap;margin-bottom:28px;padding:24px;background:var(--w);border:1.5px solid var(--b);border-radius:var(--r)}
.pc-i{font-size:14px;color:var(--k2)}.pc-i strong{color:var(--c);font-size:22px;font-weight:700}

/* Info grid */
.ig{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:28px}
@media(max-width:480px){.ig{grid-template-columns:1fr}}
.ii{padding:16px;background:var(--w);border:1.5px solid var(--b);border-radius:12px;font-size:14px;color:var(--k2)}
.ii strong{display:block;font-size:10px;text-transform:uppercase;letter-spacing:1.2px;color:var(--m);font-weight:700;margin-bottom:3px}

/* Social */
.scr{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:28px}
.sc{display:inline-flex;align-items:center;gap:7px;padding:10px 18px;background:var(--w);border:1.5px solid var(--b);border-radius:10px;font-size:13px;font-weight:500;color:var(--k2);transition:all .2s}
.sc:hover{border-color:var(--c);color:var(--c);background:var(--cl)}.sc span{display:inline}
@media(max-width:480px){.sc span{display:none}.sc{padding:10px 13px}}

/* Contact */
.cg{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:36px}
.bt{display:inline-flex;align-items:center;gap:6px;padding:14px 24px;border:1.5px solid var(--b);border-radius:12px;font-weight:500;font-size:15px;color:var(--k2);transition:all .2s;background:var(--w)}.bt:hover{border-color:var(--c);color:var(--c)}

/* Upgrade CTA */
.up{background:var(--w);border:2px solid var(--c);border-radius:20px;padding:40px 32px;text-align:center;margin-bottom:28px;position:relative;overflow:hidden}
.up::before{content:'';position:absolute;top:-60px;right:-60px;width:180px;height:180px;background:radial-gradient(circle,var(--cl) 0%,transparent 70%);pointer-events:none}
.up-ico{width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,var(--c),var(--c2));color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 16px;box-shadow:0 4px 16px rgba(232,84,42,.3)}
.up h3{font-family:var(--ft);font-size:24px;font-weight:700;color:var(--k);margin-bottom:10px}
.up p{font-size:15px;color:var(--k2);line-height:1.7;margin-bottom:20px;max-width:460px;margin-left:auto;margin-right:auto}
.up-ft{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:22px}
.up-f{padding:6px 16px;background:var(--cl);border-radius:100px;font-size:12px;font-weight:600;color:var(--c)}
.up-btn{display:inline-flex;align-items:center;gap:8px;padding:16px 36px;background:var(--c);color:#fff;border-radius:14px;font-weight:700;font-size:16px;transition:all .25s var(--e);box-shadow:0 4px 16px rgba(232,84,42,.25)}
.up-btn:hover{background:var(--c2);transform:translateY(-2px);box-shadow:0 8px 28px rgba(232,84,42,.3)}

.ft{background:var(--bg2);border-top:1px solid var(--b);padding:48px 0 32px}
.fti{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:24px;max-width:1140px;margin:0 auto;padding:0 24px}
.ftl{font-family:var(--ft);font-weight:700;font-size:18px;margin-bottom:6px}.ftl span{color:var(--c)}
.ftc{font-size:13px;color:var(--m)}.ftk{display:flex;gap:24px;flex-wrap:wrap}.ftk a{font-size:14px;color:var(--k2);transition:color .2s}.ftk a:hover{color:var(--c)}
</style></head><body>
${navH()}
<div class="cx"><nav class="bc" aria-label="Breadcrumb"><a href="/">Inicio</a><span>›</span><a href="/proveedores.html">Proveedores</a><span>›</span><strong>${esc(p.nombre)}</strong></nav></div>

<article>
<section class="hd"><div class="cx"><div class="hd-in">
<div class="hd-lg">${p.logo_url ? `<img src="${esc(p.logo_url)}" alt="Logo de ${esc(p.nombre)}">` : esc(p.logo_emoji || "📋")}</div>
<div class="hd-tx">
<h1>${esc(p.nombre)}</h1>
${catName ? `<div class="hd-cat">${esc(catName)}</div>` : ""}
${p.tagline ? `<p class="hd-tl">${esc(p.tagline)}</p>` : ""}
</div>
</div></div></section>

<section class="ct"><div class="cx">
<a href="/proveedores.html" class="bk">← Volver al directorio</a>

${p.diferenciador ? `<div class="sl">Qué nos diferencia</div><p class="sp">${esc(p.diferenciador)}</p>` : ""}

${p.precio_minimo || p.precio_maximo ? `<div class="pc">${p.precio_minimo ? `<div class="pc-i">Desde <strong>${prMin}</strong></div>` : ""}${p.precio_maximo ? `<div class="pc-i">Hasta <strong>${prMax}</strong></div>` : ""}</div>` : ""}

<div class="ig">
${p.experiencia ? `<div class="ii"><strong>Experiencia</strong>${esc(p.experiencia)}</div>` : ""}
${p.comunas ? `<div class="ii"><strong>Comunas</strong>${esc(p.comunas)}</div>` : ""}
${p.capacidad ? `<div class="ii"><strong>Capacidad</strong>${esc(p.capacidad)}</div>` : ""}
${p.responsable ? `<div class="ii"><strong>Responsable</strong>${esc(p.responsable)}</div>` : ""}
</div>

${soc ? `<div class="scr">${soc}</div>` : ""}

<div class="cg">
${p.email ? `<a href="mailto:${esc(p.email)}" class="bt">✉️ Enviar email</a>` : ""}
${p.telefono ? `<a href="tel:${esc(p.telefono)}" class="bt">📞 Llamar</a>` : ""}
</div>

<div class="up">
<div class="up-ico">✦</div>
<h3>Mejora tu visibilidad</h3>
<p>Con el plan Destacado, los clientes ven tu portada, galería de fotos, descripción completa y te contactan directo por WhatsApp.</p>
<div class="up-ft">
<span class="up-f">Foto de portada</span>
<span class="up-f">Galería de fotos</span>
<span class="up-f">WhatsApp directo</span>
<span class="up-f">Descripción completa</span>
<span class="up-f">Posición prioritaria</span>
</div>
<a href="/suscripciones.html" class="up-btn">Activar plan Destacado →</a>
</div>

</div></section>
</article>
${footH()}
</body></html>`;
}
