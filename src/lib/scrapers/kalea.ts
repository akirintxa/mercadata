import { Product } from '../types';

const KALEA_SUPABASE_URL = 'https://mywkxuvnbnzfxdbswojh.supabase.co';
const KALEA_ANON_KEY = 'sb_publishable_kBqxEZ84Hm_AIwHrj0YEIg_LUG4c21B';

export async function searchKalea(
  query: string,
  exchangeRate: number
): Promise<Product[]> {
  try {
    const formattedQuery = `*${query.trim().replace(/\s+/g, '*')}*`;
    const url = `${KALEA_SUPABASE_URL}/rest/v1/products?select=id,code,string_code,name,brand,presentation,thumbnail_url,inventory(price,price_base,tax_rate,quantity)&name=ilike.${encodeURIComponent(
      formattedQuery
    )}&active=eq.true&limit=24`;

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
