import { Product } from '../types';

export async function searchPlazas(
  query: string,
  exchangeRate: number
): Promise<Product[]> {
  try {
    const url = `https://vallearriba.elplazas.com/catalogsearch/result/?q=${encodeURIComponent(
      query
    )}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      // Plaza's has Cloudflare's bot-challenge ("Managed Challenge") in
      // front of the whole site, which a plain server-side fetch can never
      // solve (it requires executing JS in a real browser). Surface this as
      // an error instead of silently returning empty results, so it isn't
      // mistaken for "no matching products".
      if (res.headers.get('cf-mitigated') || res.status === 403) {
        throw new Error(
          "Plaza's está bloqueando el acceso automatizado (protección Cloudflare) y no se puede consultar en este momento"
        );
      }
      console.error(`Plazas error status: ${res.status}`);
      return [];
    }

    const html = await res.text();
    const parts = html.split('class="product-item-info"');
    if (parts.length <= 1) return [];

    const products: Product[] = [];

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];

      const linkMatch = part.match(
        /href="(https:\/\/vallearriba\.elplazas\.com\/[^"]+)"/
      );
      const nameMatch = part.match(
        /<a class="product-item-link"[^>]*>\s*([^<]+)\s*<\/a>/
      );
      const priceMatch = part.match(/<span class="price">\s*([^<]+)\s*<\/span>/);

      if (!nameMatch || !priceMatch) continue;

      const rawName = nameMatch[1].trim();
      const rawPrice = priceMatch[1]
        .replace('$', '')
        .replace('Bs', '')
        .replace(/\./g, '')
        .replace(',', '.')
        .trim();

      const priceUsd = parseFloat(rawPrice);
      if (isNaN(priceUsd) || priceUsd <= 0) continue;

      const priceVes = Math.round(priceUsd * exchangeRate * 100) / 100;

      let imgMatch = part.match(
        /<img[^>]*class="[^"]*product-image-photo[^"]*"[^>]*src="([^"]+)"/
      );
      if (!imgMatch) {
        imgMatch = part.match(
          /<img[^>]*src="([^"]+)"[^>]*class="[^"]*product-image-photo[^"]*"/
        );
      }

      const productUrl = linkMatch
        ? linkMatch[1]
        : 'https://vallearriba.elplazas.com/';

      const id = productUrl.replace(/[^a-zA-Z0-9]/g, '_');

      products.push({
        id: `plazas-${id}`,
        store: 'plazas' as const,
        storeName: "Plaza's",
        name: rawName,
        priceUsd: Math.round(priceUsd * 100) / 100,
        priceVes: priceVes,
        currencyOriginal: 'USD' as const,
        priceOriginal: Math.round(priceUsd * 100) / 100,
        imageUrl: imgMatch ? imgMatch[1] : undefined,
        productUrl,
        inStock: true,
      });
    }

    return products;
  } catch (err) {
    console.error('Error in searchPlazas:', err);
    throw err instanceof Error ? err : new Error(String(err));
  }
}
