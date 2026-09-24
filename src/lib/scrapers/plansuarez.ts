import { Product } from '../types';

// Plan Suarez runs on OpenCart, server-rendering plain HTML product grids —
// same style of integration as Central/Plaza's, just parsed with regex
// instead of an API.
export async function searchPlansuarez(
  query: string,
  exchangeRate: number
): Promise<Product[]> {
  try {
    const url = `https://www.plansuarez.com/index.php?route=product/search&search=${encodeURIComponent(
      query
    )}&limit=40`;

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error(`Plansuarez error status: ${res.status}`);
      return [];
    }

    const html = await res.text();
    const blocks = html.split('<div class="product-thumb">').slice(1);

    const products: Product[] = [];

    for (const block of blocks) {
      const idMatch = block.match(/product_id=(\d+)/);
      const nameMatch = block.match(/<div class="name"><a[^>]*>([^<]+)<\/a>/);
      // "price-normal" is the final, tax-included price (there's also a
      // "price-tax" span showing the pre-IVA amount, which we don't need).
      const priceMatch = block.match(/price-normal">\s*([^<]+)</);
      const imgMatch = block.match(/<img src="([^"]+)"/);

      if (!idMatch || !nameMatch || !priceMatch) continue;

      const rawPrice = priceMatch[1].replace(/Bs\.?/i, '').replace(/,/g, '').trim();
      const priceVes = parseFloat(rawPrice);
      if (isNaN(priceVes) || priceVes <= 0) continue;

      const priceUsd = exchangeRate > 0 ? priceVes / exchangeRate : 0;
      const id = idMatch[1];
      const name = nameMatch[1]
        .replace(/&amp;/g, '&')
        .replace(/&#0?39;/g, "'")
        .replace(/&quot;/g, '"')
        .trim();

      products.push({
        id: `plansuarez-${id}`,
        store: 'plansuarez' as const,
        storeName: 'Plan Suarez',
        name,
        priceUsd: Math.round(priceUsd * 100) / 100,
        priceVes: Math.round(priceVes * 100) / 100,
        currencyOriginal: 'VES' as const,
        priceOriginal: Math.round(priceVes * 100) / 100,
        imageUrl: imgMatch ? imgMatch[1] : undefined,
        productUrl: `https://www.plansuarez.com/index.php?route=product/product&product_id=${id}`,
        // The listing HTML doesn't expose a real stock/availability flag —
        // every product sampled (including a broad homepage scan) always
        // renders an active "add to cart" control, so there's no reliable
        // signal to treat any result as out of stock.
        inStock: true,
      });
    }

    return products;
  } catch (err) {
    console.error('Error in searchPlansuarez:', err);
    return [];
  }
}
