import { Product } from '../types';

const KALEA_SUPABASE_URL = 'https://mywkxuvnbnzfxdbswojh.supabase.co';
const KALEA_ANON_KEY = 'sb_publishable_kBqxEZ84Hm_AIwHrj0YEIg_LUG4c21B';

export async function searchKalea(
  query: string,
  exchangeRate: number
): Promise<Product[]> {
  try {
    const words = query.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) words.push(query.trim());

    // Require every word to appear (AND), but let each word match in any of
    // name/brand/presentation and in any order (OR per word). The previous
    // approach glued all words into a single "*w1*w2*"-style pattern against
    // `name` only, which missed products where a word lives in `brand` (e.g.
    // "P.A.N." as brand, not in the name) or appears in a different order —
    // a real cause of low recall on Kalea.
    const orAcrossColumns = (w: string) =>
      `or(name.ilike.*${w}*,brand.ilike.*${w}*,presentation.ilike.*${w}*)`;

    const filterParam =
      words.length > 1
        ? `and=${encodeURIComponent(`(${words.map(orAcrossColumns).join(',')})`)}`
        : `or=${encodeURIComponent(`(name.ilike.*${words[0]}*,brand.ilike.*${words[0]}*,presentation.ilike.*${words[0]}*)`)}`;

    const url = `${KALEA_SUPABASE_URL}/rest/v1/products?select=id,code,string_code,name,brand,presentation,thumbnail_url,inventory(price,price_base,tax_rate,quantity)&${filterParam}&active=eq.true&limit=40`;

    const res = await fetch(url, {
      headers: {
        apikey: KALEA_ANON_KEY,
        Authorization: `Bearer ${KALEA_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error(`Kalea error status: ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((item: any) => item && item.name)
      .map((item: any): Product => {
        const inv = Array.isArray(item.inventory) && item.inventory.length > 0 ? item.inventory[0] : null;
        
        // In Kalea: inv.price already has tax (price_base * (1 + tax_rate)).
        // If price is missing or 0, fallback to price_base * (1 + tax_rate)
        let priceVes = 0;
        if (inv?.price && parseFloat(inv.price) > 0) {
          priceVes = parseFloat(inv.price);
        } else if (inv?.price_base && parseFloat(inv.price_base) > 0) {
          const taxRate = typeof inv.tax_rate === 'number' ? inv.tax_rate : 0;
          priceVes = parseFloat(inv.price_base) * (1 + taxRate);
        }

        const priceUsd = exchangeRate > 0 && priceVes > 0 ? priceVes / exchangeRate : 0;

        return {
          id: `kalea-${item.id}`,
          store: 'kalea' as const,
          storeName: 'Kalea',
          name: item.name.trim(),
          brand: item.brand || undefined,
          presentation: item.presentation || undefined,
          priceUsd: Math.round(priceUsd * 100) / 100,
          priceVes: Math.round(priceVes * 100) / 100,
          currencyOriginal: 'VES' as const,
          priceOriginal: Math.round(priceVes * 100) / 100,
          imageUrl: item.thumbnail_url || undefined,
          productUrl: item.string_code
            ? `https://www.kaleamarket.com/buscar?q=${encodeURIComponent(item.name)}`
            : 'https://www.kaleamarket.com/',
          inStock: (inv?.quantity ?? 1) > 0,
        };
      })
      .filter((p: Product) => p.priceUsd > 0);
  } catch (err) {
    console.error('Error in searchKalea:', err);
    return [];
  }
}
