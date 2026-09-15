import { ExchangeRateInfo } from '../types';

let cachedRate: ExchangeRateInfo | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

export async function getExchangeRate(): Promise<ExchangeRateInfo> {
  const now = Date.now();
  if (cachedRate && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedRate;
  }

  // 1. Try fetching from Kalea's Supabase exchange_rates table (reliable & fast)
  try {
    const res = await fetch(
      'https://mywkxuvnbnzfxdbswojh.supabase.co/rest/v1/exchange_rates?order=effective_date.desc&limit=1',
      {
        headers: {
          apikey: 'sb_publishable_kBqxEZ84Hm_AIwHrj0YEIg_LUG4c21B',
          Authorization: 'Bearer sb_publishable_kBqxEZ84Hm_AIwHrj0YEIg_LUG4c21B',
        },
        next: { revalidate: 1800 },
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0].usd_to_ves_rate) {
        const rate = parseFloat(data[0].usd_to_ves_rate);
        if (rate > 0) {
          cachedRate = {
            rate: Math.round(rate * 100) / 100,
            source: 'BCV (Oficial)',
            updatedAt: data[0].effective_date || new Date().toISOString(),
          };
          lastFetchTime = now;
          return cachedRate;
        }
      }
    }
  } catch (err) {
    console.error('Error fetching rate from primary source:', err);
  }

  // 2. Try secondary API (pydolarve / bcv fallback)
  try {
    const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      next: { revalidate: 1800 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.promedio) {
        cachedRate = {
          rate: parseFloat(data.promedio),
          source: 'BCV (Oficial DolarApi)',
          updatedAt: data.fechaActualizacion || new Date().toISOString(),
        };
        lastFetchTime = now;
        return cachedRate;
      }
    }
  } catch (err) {
    console.error('Error fetching rate from fallback source:', err);
  }

  // 3. Fallback constant if completely offline/unreachable
  return (
    cachedRate || {
      rate: 840.0,
      source: 'Referencia Estimada',
      updatedAt: new Date().toISOString(),
    }
  );
}
