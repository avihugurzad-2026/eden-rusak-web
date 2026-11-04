/* Fetch public product metadata for an authenticated recommendations administrator. */
const https = require('https');
const dns = require('dns').promises;
const net = require('net');
const SITE_DB = 'https://lefqtffubkmxbsenptrc.supabase.co';
const PUBLIC_KEY = 'sb_publishable_P2XYPTQ1k6DkqUZ5txXGgw_j7v-hIqn';
function isPublicIPv4(ip) {
  if (net.isIP(ip) !== 4) return false;
  const [a,b] = ip.split('.').map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0 || b === 2)) || (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19 || b === 51)) || (a === 203 && b === 0));
}
async function permitted(token) {
  const headers = { apikey: PUBLIC_KEY, Authorization: 'Bearer ' + token };
  const user = await fetch(SITE_DB + '/auth/v1/user', { headers });
  if (!user.ok) return false;
  const u = await user.json();
  if (!u.id) return false;
  const admin = await fetch(SITE_DB + '/rest/v1/eden_admins?select=user_id&user_id=eq.' + encodeURIComponent(u.id) + '&limit=1', { headers });
  return admin.ok && (await admin.json()).length === 1;
}
async function getPage(input, depth = 0) {
  if (depth > 3) throw new Error('redirect limit');
  const url = new URL(input);
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || url.hostname === 'localhost' || net.isIP(url.hostname)) throw new Error('invalid address');
  const answers = await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (!answers.length || answers.some(a => a.family === 4 && !isPublicIPv4(a.address))) throw new Error('address unavailable');
  const selected = answers.find(a => a.family === 4 && isPublicIPv4(a.address));
  if (!selected) throw new Error('address unavailable');
  return new Promise((resolve, reject) => {
    const req = https.get(url, { family: 4, lookup: (_h, _o, cb) => cb(null, selected.address, 4), headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EdenProductImport/1.0)', Accept: 'text/html,application/xhtml+xml' }, timeout: 8000 }, response => {
      if ([301,302,303,307,308].includes(response.statusCode) && response.headers.location) { response.resume(); return resolve(getPage(new URL(response.headers.location, url).href, depth + 1)); }
      if (response.statusCode !== 200 || !/text\/html|application\/xhtml/i.test(response.headers['content-type'] || '')) { response.resume(); return reject(new Error('page unavailable')); }
      let size = 0, chunks = [];
      response.on('data', chunk => { size += chunk.length; if (size > 1500000) { req.destroy(); reject(new Error('page too large')); } else chunks.push(chunk); });
      response.on('end', () => resolve({ html: Buffer.concat(chunks).toString('utf8'), url: url.href }));
      response.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('timeout'))); req.on('error', reject);
  });
}
function decode(s) { return String(s || '').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Math.min(Number(n),0x10ffff))).trim(); }
function meta(html, key) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const attrs = {}; for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[match[1].toLowerCase()] = match[2] ?? match[3];
    if ((attrs.property || attrs.name || '').toLowerCase() === key) return decode(attrs.content || '');
  }
  return '';
}
function products(obj) {
  if (Array.isArray(obj)) return obj.flatMap(products);
  if (!obj || typeof obj !== 'object') return [];
  return [ ...(String(obj['@type'] || '').toLowerCase() === 'product' ? [obj] : []), ...products(obj['@graph'] || []) ];
}
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token || !(await permitted(token))) return res.status(403).json({ error: 'unauthorized' });
    const { html, url } = await getPage(String((req.body || {}).url || ''));
    const found = [];
    for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) { try { found.push(...products(JSON.parse(match[1]))); } catch (_) {} }
    const p = found[0] || {}, offer = Array.isArray(p.offers) ? p.offers[0] : p.offers || {};
    let img = Array.isArray(p.image) ? p.image[0] : p.image; if (img && typeof img === 'object') img = img.url;
    try { img = new URL(img || meta(html,'og:image'),url).href; if (!/^https:\/\//i.test(img)) img = ''; } catch (_) { img = ''; }
    const price = String(offer.priceCurrency || '').toUpperCase() === 'ILS' && offer.price != null && String(offer.price).trim() !== '' && Number.isFinite(Number(offer.price)) ? Number(offer.price) : null;
    return res.status(200).json({ title: decode(p.name || meta(html,'og:title')).slice(0,180), description: decode(p.description || meta(html,'og:description') || meta(html,'description')).replace(/<[^>]*>/g,'').slice(0,3000), image: img, price, url });
  } catch (_) { return res.status(422).json({ error: 'לא ניתן לייבא מהקישור הזה. אפשר למלא את הפרטים ידנית.' }); }
};
