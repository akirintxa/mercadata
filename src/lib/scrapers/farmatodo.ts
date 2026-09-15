import { Product } from '../types';

const FARMATODO_ALGOLIA_URL =
  'https://api-search.farmatodo.com/1/indexes/products-venezuela/query';
const FARMATODO_APP_ID = 'VCOJEYD2PO';
const FARMATODO_API_KEY = '869a91e98550dd668b8b1dc04bca9011';

export async function searchFarmatodo(
  query: string,
  exchangeRate: number
): Promise<Product[]> {
  try {
    const payload = {
      query: query.trim(),
      hitsPerPage: 24,
      page: 0,
    };

    const res = await fetch(FARMATODO_ALGOLIA_URL, {
      method: 'POST',
      headers: {
        'x-algolia-application-id': FARMATODO_APP_ID,
        'x-algolia-api-key': FARMATODO_API_KEY,
        'Content-Type': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify(payload),
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error(`Farmatodo error status: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const hits = data.hits || [];

    return hits
      .filter((hit: any) => hit && (hit.mediaDescription || hit.largeDescription || hit.description))
      .map((hit: any): Product => {
        // In Farmatodo, fullPrice includes IVA (taxes).
        // If fullPrice is not available, we compute unitPrice + taxes (or unitPrice * (1 + taxRate/100))
        let priceVes = 0;
        if (typeof hit.fullPrice === 'number' && hit.fullPrice > 0) {
          priceVes = hit.fullPrice;
        } else if (typeof hit.offerPrice === 'number' && hit.offerPrice > 0) {
          priceVes = hit.offerPrice;
        } else if (typeof hit.unitPrice === 'number' && hit.unitPrice > 0) {
          const taxes = typeof hit.taxes === 'number' ? hit.taxes : 0;
          if (taxes > 0) {
            priceVes = hit.unitPrice + taxes;
          } else if (typeof hit.taxRate === 'number' && hit.taxRate > 0) {
            priceVes = hit.unitPrice * (1 + hit.taxRate / 100);
          } else {
            priceVes = hit.unitPrice;
          }
        } else {
          priceVes = parseFloat(hit.fullPrice || hit.unitPrice || '0');
        }

        const priceUsd = exchangeRate > 0 && priceVes > 0 ? priceVes / exchangeRate : 0;

        const name = (hit.mediaDescription || hit.largeDescription || hit.description || '').trim();
        const brand = hit.marca || hit.brand || undefined;
        const imageUrl = hit.mediaImageUrl || hit.listUrlImages?.[0] || undefined;
        const id = hit.id || hit.objectID;
        const productUrl = id
          ? `https://www.farmatodo.com.ve/producto/${id}`
          : 'https://www.farmatodo.com.ve/';

        return {
          id: `farmatodo-${id}`,
          store: 'farmatodo' as const,
          storeName: 'Farmatodo',
          name,
          brand,
          priceUsd: Math.round(priceUsd * 100) / 100,
          priceVes: Math.round(priceVes * 100) / 100,
          currencyOriginal: 'VES' as const,
          priceOriginal: Math.round(priceVes * 100) / 100,
          imageUrl,
          productUrl,
          inStock: hit.hasStock !== false,
        };
      })
      .filter((p: Product) => p.priceUsd > 0);
  } catch (err) {
    console.error('Error in searchFarmatodo:', err);
    return [];
  }
}
