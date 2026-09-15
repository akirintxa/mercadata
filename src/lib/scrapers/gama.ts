import { Product } from '../types';

const GAMA_OCC_BASE =
  'https://api.cl94ncbhsi-excelsior1-p1-public.model-t.cc.commerce.ondemand.com';

const FIELDS =
  'products(dvMessage,score,baseProduct,taxWithDiscount(formattedValue,value),seoName,code,name,summary,configurable,configuratorType,multidimensional,price(FULL),images(FULL),stock(FULL),averageRating,variantOptions,vatAmountPrice(formattedValue),totalWithVatPrice(formattedValue,value),totalPriceWithNoDiscount(formattedValue),basePriceWithDiscount(formattedValue),categories(code,name),promotions(code,name,message,promotionType,labelColor,labelTextColor,dvMessage)),facets,breadcrumbs,pagination(DEFAULT),sorts(DEFAULT),freeTextSearch,currentQuery';

export async function searchGama(
  query: string,
  exchangeRate: number
): Promise<Product[]> {
  try {
    const params = new URLSearchParams({
      fields: FIELDS,
      query: query,
      pageSize: '24',
      lang: 'es',
      curr: 'REF',
    });

    const url = `${GAMA_OCC_BASE}/occ/v2/egb2c-spa/products/search?${params.toString()}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        Origin: 'https://gamaenlinea.com',
        Referer: 'https://gamaenlinea.com/',
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error(`Gama error status: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const products = data.products || [];

    return products.map((item: any) => {
      const priceVal =
        item.totalWithVatPrice?.value ??
        item.price?.value ??
        item.basePriceWithDiscount?.value ??
        0;

      const priceUsd = typeof priceVal === 'number' ? priceVal : parseFloat(priceVal || '0');
      const priceVes = Math.round(priceUsd * exchangeRate * 100) / 100;

      // Clean HTML tags like <em class="search-results-highlight">...</em>
      const cleanName = (item.name || '').replace(/<[^>]*>/g, '').trim();

      let imageUrl: string | undefined = undefined;
      if (item.images && item.images.length > 0) {
        const rawImg = item.images[0].url;
        if (rawImg) {
          imageUrl = rawImg.startsWith('http') ? rawImg : `${GAMA_OCC_BASE}${rawImg}`;
        }
      }

      const productUrl = item.code
        ? `https://gamaenlinea.com/es/p/${item.code}`
        : 'https://gamaenlinea.com/es/';

      return {
        id: `gama-${item.code}`,
        store: 'gama' as const,
        storeName: 'Gama',
        name: cleanName,
        brand: item.categories?.[0]?.name,
        priceUsd: Math.round(priceUsd * 100) / 100,
        priceVes: priceVes,
        currencyOriginal: 'USD' as const,
        priceOriginal: Math.round(priceUsd * 100) / 100,
        imageUrl,
        productUrl,
        inStock: item.stock?.stockLevelStatus !== 'outOfStock',
      };
    });
  } catch (err) {
    console.error('Error in searchGama:', err);
    return [];
  }
}
