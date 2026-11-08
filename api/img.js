// Vercel serverless function: serves a partner store's product photo through this site.
// GET /api/img?u=<image url>. Used only when a photo won't load directly in the visitor's browser.
// Only image hosts of partner stores are allowed. Cached at Vercel's edge for a day.
const HOSTS = ['ebayimg.com','ebaystatic.com','jumia.is','jumia.com.ng','jumia.co.ke','konga.com','aliexpress-media.com','alicdn.com','s-bol.com','media-amazon.com','ssl-images-amazon.com','backmarket.com','back-market.com','ztat.net','allegroimg.com','kwcdn.com','tcgplayer-cdn.tcgplayer.com','tcgplayer.com','cardmarket.com','pokemoncenter.com'];
const okHost = h => HOSTS.some(d => h === d || h.endsWith('.' + d));
module.exports = async (req, res) => {
  let u;
  try { u = new URL(String(req.query.u || '')); } catch (e) { return res.status(400).end(); }
  if (u.protocol !== 'https:' || !okHost(u.hostname)) return res.status(400).end();
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(u.href, { signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HoulioDuoPreview/1.0; +https://houlioduo.vercel.app)', 'Accept': 'image/avif,image/webp,image/*;q=0.8' } });
    clearTimeout(timer);
    const type = r.headers.get('content-type') || '';
    if (!r.ok || !type.startsWith('image/')) { res.setHeader('Cache-Control', 's-maxage=600'); return res.status(404).end(); }
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 6 * 1024 * 1024) return res.status(413).end();
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).send(buf);
  } catch (e) {
    clearTimeout(timer); res.setHeader('Cache-Control', 's-maxage=300'); return res.status(502).end();
  }
};
