// Vercel serverless function: reads a partner store's product page and returns its photo, title and price.
// GET /api/preview?url=<product page>  ->  { ok, title, image, price, currency, url }
// Only allow-listed store domains are fetched. Results are cached at Vercel's edge for 6 hours.
const ALLOW = ['jumia.com.ng','jumia.co.ke','jumia.com.gh','jumia.com.eg','jumia.ma','konga.com','ebay.com','ebay.co.uk','ebay.de','ebay.fr','ebay.it','ebay.es','ebay.ca','ebay.com.au','bol.com','backmarket.co.uk','backmarket.com','backmarket.fr','backmarket.de','backmarket.es','backmarket.it','zalando.co.uk','zalando.de','zalando.fr','allegro.pl','aliexpress.com','aliexpress.us','temu.com','amazon.com','amazon.co.uk','amazon.de','amazon.fr','amazon.it','amazon.es','amazon.ca','amazon.ae','amazon.sa','amazon.in','amazon.com.au'];
const okHost = h => { h = h.replace(/^www\./, ''); return ALLOW.some(d => h === d || h.endsWith('.' + d)); };
const decode = s => String(s || '').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();
function meta(html, names) {
  for (const n of names) {
    const re1 = new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${n}["'][^>]*content=["']([^"']+)["']`, 'i');
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name|itemprop)=["']${n}["']`, 'i');
    const m = html.match(re1) || html.match(re2);
    if (m) return decode(m[1]);
  }
  return '';
}
function fromJsonLd(html) {
  const out = {};
  const blocks = html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const b of blocks) {
    try {
      const txt = b.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '');
      let data = JSON.parse(txt); const list = [].concat(data['@graph'] || data);
      for (const d of list) {
        if (!d || !/Product/i.test([].concat(d['@type']).join(' '))) continue;
        out.title = out.title || d.name;
        const img = [].concat(d.image || [])[0]; out.image = out.image || (typeof img === 'string' ? img : img && img.url);
        const off = [].concat(d.offers || [])[0] || {};
        out.price = out.price || off.price || off.lowPrice; out.currency = out.currency || off.priceCurrency;
      }
    } catch (e) {}
  }
  return out;
}
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  let target;
  try { target = new URL(String(req.query.url || '')); } catch (e) { return res.status(400).send(JSON.stringify({ ok: false, error: 'bad url' })); }
  if (target.protocol !== 'https:' || !okHost(target.hostname)) return res.status(400).send(JSON.stringify({ ok: false, error: 'store not allowed' }));
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 7000);
  try {
    const r = await fetch(target.href, { redirect: 'follow', signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HoulioDuoPreview/1.0; +https://houlioduo.vercel.app)', 'Accept': 'text/html', 'Accept-Language': 'en' } });
    clearTimeout(timer);
    const finalUrl = new URL(r.url || target.href);
    // A product that has been removed usually redirects to a category or search page.
    const moved = finalUrl.pathname.replace(/\/$/, '') !== target.pathname.replace(/\/$/, '');
    if (!r.ok) { res.setHeader('Cache-Control', 's-maxage=1800'); return res.status(200).send(JSON.stringify({ ok: false, status: r.status })); }
    const html = (await r.text()).slice(0, 1500000);
    const ld = fromJsonLd(html);
    const title = meta(html, ['og:title', 'twitter:title']) || ld.title || decode((html.match(/<title>([^<]+)<\/title>/i) || [])[1]);
    let image = meta(html, ['og:image', 'og:image:secure_url', 'twitter:image', 'image']) || ld.image || '';
    if (image && image.startsWith('//')) image = 'https:' + image;
    const price = meta(html, ['product:price:amount', 'og:price:amount', 'price']) || (ld.price != null ? String(ld.price) : '');
    const currency = meta(html, ['product:price:currency', 'og:price:currency', 'priceCurrency']) || ld.currency || '';
    const ok = !moved && !!image && !!title;
    res.setHeader('Cache-Control', ok ? 's-maxage=21600, stale-while-revalidate=86400' : 's-maxage=1800');
    return res.status(200).send(JSON.stringify({ ok, moved, title, image, price, currency, url: finalUrl.href }));
  } catch (e) {
    clearTimeout(timer);
    res.setHeader('Cache-Control', 's-maxage=600');
    return res.status(200).send(JSON.stringify({ ok: false, error: 'fetch failed' }));
  }
};
