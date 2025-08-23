// generate-env.mjs
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';

// Load .env locally (not on Vercel)
if (!process.env.VERCEL && existsSync('.env')) {
  // Optional dependency: dotenv
  try {
    const dotenv = await import('dotenv');
    dotenv.config();
    console.log('✔ Loaded .env locally');
  } catch (e) {
    console.warn('⚠ dotenv not installed; skipping local .env load');
  }
}

const isProd =
  process.env.VERCEL_ENV === 'production' ||
  process.env.NODE_ENV === 'production';

const url = process.env.SUPABASE_URL || '';
const anon = process.env.SUPABASE_ANON_KEY || '';

if (!url || !anon) {
  console.warn('⚠ Missing SUPABASE_URL or SUPABASE_ANON_KEY at build time.');
  console.warn('   SUPABASE_URL=', url ? '(present)' : '(missing)');
  console.warn('   SUPABASE_ANON_KEY=', anon ? '(present)' : '(missing)');
}

const envDir = './src/environments';
mkdirSync(envDir, { recursive: true });

const content = `export const environment = {
  production: ${isProd},
  supabaseUrl: '${url}',
  supabaseAnonKey: '${anon}'
};\n`;

writeFileSync(`${envDir}/environment.ts`, content);
writeFileSync(`${envDir}/environment.prod.ts`, content);

console.log('✔ Wrote Angular environment files to', envDir);
console.log('  production =', isProd);
