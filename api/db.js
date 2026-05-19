// Vercel serverless proxy — forwards all /api/db requests to Google Apps Script
// Needed because COEP headers block direct browser fetches to script.google.com

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyGqUE3c7AV8c3sGB6t8LkzAjvv11dVtptV4KO3I756giB3g4Gqx6VX7-Mn0pq7AzKTpw/exec';

export default async function handler(req, res) {
  // Pass CORS headers so browser requests don't get blocked
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let gasRes;

    if (req.method === 'GET') {
      // Forward query params as-is
      const params = new URLSearchParams(req.query).toString();
      const url = params ? `${GAS_URL}?${params}` : GAS_URL;
      gasRes = await fetch(url, { method: 'GET' });

    } else if (req.method === 'POST') {
      // Forward JSON body
      gasRes = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const data = await gasRes.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error('[api/db] proxy error:', err.message);
    return res.status(502).json({ success: false, error: 'GAS proxy error: ' + err.message });
  }
}
