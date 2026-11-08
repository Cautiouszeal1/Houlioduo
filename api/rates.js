// Vercel serverless function: daily USD exchange rates from ExchangeRate-API's free open endpoint (no key).
// GET /api/rates -> { ok, rates: { NGN: 1420.5, KES: 129.1, ... }, updated }
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD');
    const j = await r.json();
    if (j.result !== 'success') throw new Error('bad response');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(JSON.stringify({ ok: true, rates: j.rates, updated: j.time_last_update_utc }));
  } catch (e) {
    res.setHeader('Cache-Control', 's-maxage=300');
    return res.status(200).send(JSON.stringify({ ok: false }));
  }
};
