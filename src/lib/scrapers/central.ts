import { Product } from '../types';

export async function searchCentral(
  query: string,
  exchangeRate: number
): Promise<Product[]> {
  try {
    const url = `https://tucentralonline.com/La-Alameda-50/wp-json/wc/store/v1/products?search=${encodeURIComponent(
      query
    )}&per_page=20`;

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error(`Central error status: ${res.status}`);
      return [];
    }

    const items = await res.json();
    if (!Array.isArray(items)) return [];

    return items
      .filter((item: any) => item && item.name)
      .map((item: any) => {
        const minorUnit = item.prices?.currency_minor_unit ?? 2;
        const rawPrice = parseFloat(item.prices?.price || '0');
        const priceUsd = rawPrice / Math.pow(10, minorUnit);
        const priceVes = Math.round(priceUsd * exchangeRate * 100) / 100;

        const imageUrl =
          item.images && item.images.length > 0
            ? item.images[0].src || item.images[0].thumbnail
            : undefined;

        return {
          id: `central-${item.id}`,
          store: 'central' as const,
          storeName: 'Central Madeirense',
          name: (item.name || '').replace(/&amp;/g, '&').replace(/&#8211;/g, '-').trim(),
          brand: item.attributes?.find((a: any) => a.name?.toLowerCase().includes('marca'))?.terms?.[0]?.name,
          presentation: item.attributes?.find((a: any) =>
            a.name?.toLowerCase().includes('presentación') || a.name?.toLowerCase().includes('contenido')
          )?.terms?.[0]?.name,
          priceUsd: Math.round(priceUsd * 100) / 100,
          priceVes: priceVes,
          currencyOriginal: 'USD' as const,
          priceOriginal: Math.round(priceUsd * 100) / 100,
          imageUrl,
          productUrl: item.permalink || 'https://tucentralonline.com/La-Alameda-50/',
          inStock: item.is_in_stock !== false,
        };
      });
  } catch (err) {
    console.error('Error in searchCentral:', err);
    return [];
  }
}
