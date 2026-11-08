// Vercel serverless function: returns the visitor's country from Vercel's edge geolocation headers.
// GET /api/geo -> { "country": "NG" }
module.exports = (req, res) => {
  const country = String(req.headers['x-vercel-ip-country'] || '').toUpperCase().slice(0, 2);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(JSON.stringify({ country }));
};
