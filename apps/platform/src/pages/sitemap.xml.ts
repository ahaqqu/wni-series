import type { APIRoute } from 'astro';

const pages = ['/', '/tentang', '/kontak', '/harga', '/privasi', '/syarat', '/refund'];

export const GET: APIRoute = () => {
  const site = 'https://wniseries.ahaqqu.com';
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((page) => `  <url><loc>${site}${page}</loc><changefreq>weekly</changefreq></url>`).join('\n')}
</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
