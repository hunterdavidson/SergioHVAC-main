// /api/google-reviews.js
// Fetch a business's public Google reviews via Places Details API.
// Requires: process.env.GOOGLE_MAPS_API_KEY

module.exports = handler;
module.exports.config = { runtime: 'nodejs20.x' };

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', error: 'Method not allowed' });
  }

  const key = process.env.GOOGLE_MAPS_API_KEY || '';
  if (!key) {
    return res.status(200).json({ status: 'no_key' });
  }

  const placeId = (req.query.placeId || req.query.placeid || '').toString().trim();
  if (!placeId) {
    return res.status(400).json({ status: 'error', error: 'Missing placeId' });
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('fields', 'rating,user_ratings_total,reviews');
    url.searchParams.set('reviews_no_translations', 'true');
    url.searchParams.set('reviews_sort', 'newest');
    url.searchParams.set('key', key);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort('timeout'), 8000);
    const resp = await fetch(url, { signal: controller.signal }).catch((e) => ({ ok: false, status: 0, json: async () => ({ error: String(e?.message || e) }) }));
    clearTimeout(timer);
    if (!resp?.ok) {
      const msg = await (resp?.json ? resp.json() : Promise.resolve({ error: 'failed' }));
      return res.status(502).json({ status: 'error', error: 'Upstream error', details: msg });
    }
    const data = await resp.json();
    if (data?.status && data.status !== 'OK') {
      return res.status(200).json({ status: 'error', error: data.status, details: data?.error_message });
    }
    const result = data?.result || {};
    const out = {
      status: 'ok',
      rating: result.rating ?? null,
      count: result.user_ratings_total ?? null,
      reviews: Array.isArray(result.reviews) ? result.reviews.map((r) => ({
        author_name: r.author_name,
        profile_photo_url: r.profile_photo_url,
        rating: r.rating,
        text: r.text,
        relative_time_description: r.relative_time_description,
        time: r.time,
      })) : [],
    };
    return res.status(200).json(out);
  } catch (err) {
    console.error('[google-reviews] error:', err);
    return res.status(500).json({ status: 'error', error: 'Unexpected server error' });
  }
}

