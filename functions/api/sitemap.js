/**
 * GET /sitemap.xml
 *
 * Dynamic sitemap that includes all static pages AND
 * all active provider pages from Supabase.
 * Auto-updates when providers are added/removed.
 *
 * Google fetches this to discover all indexable pages.
 */

import { createClient } from "@supabase/supabase-js";

export async function onRequest(context) {
  const { env } = context;

  const BASE = "https://www.cotizaeventos.cl";

  // Static pages with priority and change frequency
  const staticPages = [
    { url: "/", priority: "1.0", freq: "daily" },
    { url: "/proveedores.html", priority: "0.9", freq: "daily" },
    { url: "/form.html", priority: "0.8", freq: "monthly" },
    { url: "/nosotros.html", priority: "0.6", freq: "monthly" },
    { url: "/registro-proveedores-eventos.html", priority: "0.8", freq: "monthly" },
    { url: "/contratar-proveedores-eventos.html", priority: "0.7", freq: "monthly" },
    { url: "/terminos.html", priority: "0.3", freq: "yearly" },
  ];

  // Build static entries
  const today = new Date().toISOString().split("T")[0];
  let urls = staticPages.map(p => `  <url>
    <loc>${BASE}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join("\n");

  // Load active providers with slugs from Supabase
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
    try {
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

      const { data: providers } = await supabase
        .from("proveedores")
        .select("slug, nombre, posicion, cover_url")
        .eq("activo", true)
        .not("slug", "is", null)
        .not("slug", "eq", "")
        .order("posicion", { ascending: false });

      if (providers && providers.length > 0) {
        for (const p of providers) {
          // Destacados get higher priority
          const priority = p.posicion > 0 ? "0.8" : "0.6";
          const hasImages = p.cover_url ? `
    <image:image>
      <image:loc>${escXml(p.cover_url)}</image:loc>
      <image:title>${escXml(p.nombre)}</image:title>
    </image:image>` : "";

          urls += `\n  <url>
    <loc>${BASE}/prov/${escXml(p.slug)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>${hasImages}
  </url>`;
        }
      }
    } catch (e) {
      console.error("Error loading providers for sitemap:", e);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

function escXml(s) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
