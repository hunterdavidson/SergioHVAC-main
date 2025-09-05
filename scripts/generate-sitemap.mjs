// scripts/generate-sitemap.mjs
// Generate sitemap.xml from Angular routes + city/service templates
import 'dotenv/config';
import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const BASE = 'https://svhvac.com';
const ROUTES_FILE = 'src/app/app.routes.ts';
const OUT_FILE = 'public/sitemap.xml';

function today() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function loadRoutes() {
  const src = readFileSync(ROUTES_FILE, 'utf8');
  const paths = [];
  const re = /path:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src))) {
    const p = m[1];
    // skip dynamic and private routes
    if (p.includes(':')) continue;
    if (p === '**') continue;
    if (p.startsWith('admin')) continue;
    if (p.startsWith('login')) continue;
    if (p.startsWith('estimate')) continue;
    paths.push(p ? '/' + p : '/');
  }
  // ensure unique
  return Array.from(new Set(paths));
}

async function generate() {
  const urls = [];
  const lastmod = today();
  const staticRoutes = loadRoutes();
  if (!staticRoutes.includes('/')) staticRoutes.unshift('/');
  for (const p of staticRoutes) {
    // home gets higher priority
    const changefreq = p === '/' ? 'weekly' : 'monthly';
    const priority = p === '/' ? '1.0' : '0.8';
    urls.push({ loc: BASE + p, lastmod, changefreq, priority });
  }

  // Include published blog posts from Supabase settings if available
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    if (url && key) {
      const sb = createClient(url, key);
      const { data, error } = await sb
        .from('site_settings')
        .select('data')
        .limit(1)
        .maybeSingle();
      if (!error && data?.data?.blog?.posts?.length) {
        for (const p of data.data.blog.posts) {
          if (p && p.slug && (p.published !== false)) {
            urls.push({ loc: BASE + `/blog/${p.slug}`, lastmod, changefreq: 'monthly', priority: '0.7' });
          }
        }
      }

      // Optional: include education video subpages
      const includeEdu = (process.env.SITEMAP_INCLUDE_EDU_PAGES || '').toLowerCase() === 'true';
      if (includeEdu && data?.data?.education?.videos?.length) {
        const list = data.data.education.videos;
        for (const v of list) {
          try {
            const title = String(v.title || 'video');
            const urlStr = String(v.url || '');
            let slug = title.toLowerCase().trim().replace(/&/g,'and').replace(/[^a-z0-9\s-]/g,'').replace(/[\s_-]+/g,'-').replace(/^-+|-+$/g,'');
            if (!slug) {
              // fallback to YouTube id
              const u = new URL(urlStr);
              if (u.hostname.includes('youtu.be')) slug = u.pathname.replace('/','');
              else if (u.hostname.includes('youtube.com')) slug = u.searchParams.get('v') || '';
              slug = slug || 'video';
            }
            urls.push({ loc: BASE + `/education/${slug}`, lastmod, changefreq: 'monthly', priority: '0.6' });
          } catch {}
        }
      }
    }
  } catch (e) {
    console.warn('⚠ sitemap: blog posts fetch skipped:', e?.message || e);
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`),
    '</urlset>',
    ''
  ].join('\n');
  writeFileSync(OUT_FILE, xml, 'utf8');
  console.log(`✔ sitemap.xml generated with ${urls.length} URLs`);
}

generate();
