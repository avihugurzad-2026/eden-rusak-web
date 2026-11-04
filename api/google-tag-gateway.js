const https = require('https');

// The request body must reach Google unchanged, including measurement POSTs.
module.exports.config = { api: { bodyParser: false } };
module.exports = (req, res) => {
  const incoming = new URL(req.url, 'https://edenrusak.com');
  const suffix = incoming.searchParams.get('gateway_path') || '';
  incoming.searchParams.delete('gateway_path');
  const path = '/google-tag-gateway/' + suffix;
  const headers = { ...req.headers, host: 'gt-55ks2grc.fps.goog' };
  for (const name of ['connection', 'transfer-encoding', 'content-length', 'x-forwarded-country', 'x-forwarded-region', 'x-forwarded-countryregion', 'x-forwarded-geolocation']) delete headers[name];
  if (req.headers['x-vercel-ip-country']) headers['x-forwarded-country'] = req.headers['x-vercel-ip-country'];
  if (req.headers['x-vercel-ip-country-region']) headers['x-forwarded-region'] = req.headers['x-vercel-ip-country-region'];
  const upstream = https.request({ hostname: 'gt-55ks2grc.fps.goog', path: path + incoming.search, method: req.method, headers }, response => {
    res.writeHead(response.statusCode, response.headers);
    response.pipe(res);
  });
  upstream.on('error', () => { if (!res.headersSent) res.statusCode = 502; res.end(); });
  req.pipe(upstream);
};
