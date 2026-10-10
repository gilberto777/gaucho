import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadDotEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8');

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;

    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

const loadDotEnv = () => {
  const projectRoot = path.resolve(__dirname, '..');
  loadDotEnvFile(path.join(projectRoot, '.env'));
  loadDotEnvFile(path.join(projectRoot, '.env.local'));
};

loadDotEnv();

const SITE_URL = process.env.SITE_URL || 'https://gauchoimoveissp.com.br';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const toIso = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

const xmlEscape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const buildUrlEntry = ({ loc, lastmod, changefreq, priority }) => {
  const lines = [];
  lines.push('  <url>');
  lines.push(`    <loc>${xmlEscape(loc)}</loc>`);
  if (lastmod) lines.push(`    <lastmod>${xmlEscape(lastmod)}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${xmlEscape(changefreq)}</changefreq>`);
  if (priority) lines.push(`    <priority>${xmlEscape(priority)}</priority>`);
  lines.push('  </url>');
  return lines.join('\n');
};

const supabaseFetch = async ({ table, select, filters = [] }) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment.');
  }

  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  url.searchParams.set('select', select);
  for (const [k, v] of filters) url.searchParams.set(k, v);

  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Supabase fetch failed: ${res.status} ${res.statusText} ${body}`);
  }

  return res.json();
};

const main = async () => {
  const staticUrls = [
    { loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${SITE_URL}/imoveis`, changefreq: 'daily', priority: '0.9' },
    { loc: `${SITE_URL}/bairros`, changefreq: 'weekly', priority: '0.8' },
    { loc: `${SITE_URL}/blog`, changefreq: 'weekly', priority: '0.6' },
    { loc: `${SITE_URL}/contact`, changefreq: 'monthly', priority: '0.5' },
  ];

  const [properties, neighborhoods] = await Promise.all([
    supabaseFetch({
      table: 'properties',
      select: 'slug,updated_at,status,is_active',
      filters: [['status', 'eq.available'], ['is_active', 'eq.true']],
    }),
    supabaseFetch({
      table: 'neighborhoods',
      select: 'slug,updated_at',
    }).catch(() => []),
  ]);

  const propertyUrls = (properties || [])
    .filter((p) => p?.slug)
    .map((p) => ({
      loc: `${SITE_URL}/imovel/${p.slug}`,
      lastmod: toIso(p.updated_at),
      changefreq: 'weekly',
      priority: '0.7',
    }));

  const neighborhoodUrls = (neighborhoods || [])
    .filter((n) => n?.slug)
    .map((n) => ({
      loc: `${SITE_URL}/neighborhood/${n.slug}`,
      lastmod: toIso(n.updated_at),
      changefreq: 'weekly',
      priority: '0.6',
    }));

  const all = [...staticUrls, ...neighborhoodUrls, ...propertyUrls];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...all.map(buildUrlEntry),
    '</urlset>',
    '',
  ].join('\n');

  const publicPath = path.resolve(__dirname, '..', 'public');
  fs.mkdirSync(publicPath, { recursive: true });
  fs.writeFileSync(path.join(publicPath, 'sitemap.xml'), xml, 'utf8');

  process.stdout.write(`Generated sitemap.xml with ${all.length} URLs\n`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
