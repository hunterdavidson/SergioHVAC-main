// update-sitemap.mjs
// Small build-time helper to refresh <lastmod> dates in public/sitemap.xml
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const path = 'public/sitemap.xml';
if (!existsSync(path)) {
  console.warn('sitemap.xml not found at', path);
  process.exit(0);
}

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const stamp = `${yyyy}-${mm}-${dd}`;

try {
  const xml = readFileSync(path, 'utf8');
  const updated = xml.replace(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g, `<lastmod>${stamp}</lastmod>`);
  writeFileSync(path, updated);
  console.log('✔ sitemap.xml lastmod updated to', stamp);
} catch (e) {
  console.warn('⚠ Could not update sitemap.xml:', e?.message || e);
}

