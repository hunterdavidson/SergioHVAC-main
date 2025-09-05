export default async function handler(req: any, res: any) {
  try {
    const h = req.headers || {};
    const city = (h['x-vercel-ip-city'] as string) || '';
    const region = (h['x-vercel-ip-country-region'] as string) || '';
    const country = (h['x-vercel-ip-country'] as string) || '';
    const lat = (h['x-vercel-ip-latitude'] as string) || '';
    const lon = (h['x-vercel-ip-longitude'] as string) || '';

    const cookies: string[] = [];
    const maxAge = 60 * 60 * 24; // 1 day
    const add = (k: string, v?: string) => {
      if (!v) return;
      cookies.push(`${k}=${encodeURIComponent(v)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`);
    };
    add('x-geo-city', city);
    add('x-geo-region', region);
    add('x-geo-country', country);
    add('x-geo-lat', lat);
    add('x-geo-lon', lon);

    if (cookies.length) res.setHeader('Set-Cookie', cookies);
    res.setHeader('Cache-Control', 'private, max-age=0, no-store');
    res.status(200).json({ city, region, country, lat, lon });
  } catch (e: any) {
    res.status(200).json({ city: '', region: '', country: '', lat: '', lon: '' });
  }
}

