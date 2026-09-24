import { Product } from '../types';

// Rio Market runs on Instaleap (Next.js App Router). It has no public
// GraphQL endpoint the browser calls directly — the storefront's own
// server does that server-side. What the browser gets instead is the
// React Server Components ("Flight") payload for /search, which we can
// fetch directly by sending the same "rsc" navigation headers a browser
// would. That payload is a series of `<id>:<json>` lines; product objects
// are the ones carrying name/price/sku/slug together.
const SEARCH_URL = 'https://www.riomarket.com/search';

// A fixed store branch (Rio Market requires picking one, normally via
// geolocation) — pinned the same way Central/Plaza's are pinned to one
// physical branch, so pricing is at least consistent across searches.
const STORE_COOKIE = '_IL-storeId=14964; _IL-storeReference=22';

interface RiomarketProductChunk {
  name: string;
  price: number;
  sku: string;
  slug: string;
  brand?: string;
  stock?: number;
  isAvailable?: boolean;
  photosUrl?: unknown;
}

function isProductChunk(value: unknown): value is RiomarketProductChunk {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.name === 'string' &&
    typeof v.price === 'number' &&
    typeof v.sku === 'string' &&
    typeof v.slug === 'string'
  );
}

function resolvePhotoUrl(
  photosUrl: unknown,
  chunks: Map<string, unknown>
): string | undefined {
  if (typeof photosUrl !== 'string') return undefined;
  // Flight payloads reference other chunks as "$<id>" instead of inlining
  // them twice.
  const resolved = photosUrl.startsWith('$')
    ? chunks.get(photosUrl.slice(1))
    : photosUrl;
  if (Array.isArray(resolved) && typeof resolved[0] === 'string') {
    return resolved[0];
  }
  return typeof resolved === 'string' ? resolved : undefined;
}

export async function searchRiomarket(
  query: string,
  exchangeRate: number
): Promise<Product[]> {
  try {
    const url = `${SEARCH_URL}?name=${encodeURIComponent(query)}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: '*/*',
        // These two headers are what make Next.js return the lightweight
        // RSC payload instead of a full HTML page.
        rsc: '1',
        'next-url': '/search',
        Cookie: STORE_COOKIE,
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error(`Riomarket error status: ${res.status}`);
      return [];
    }

    const text = await res.text();
    const chunks = new Map<string, unknown>();

    for (const line of text.split('\n')) {
      const match = line.match(/^([0-9a-fA-F]+):(.*)$/);
      if (!match) continue;
      try {
        chunks.set(match[1], JSON.parse(match[2]));
      } catch {
        // Not a JSON chunk (e.g. a Next.js module reference like
        // `I[1234,[...],""]`) — irrelevant to us, skip it.
      }
    }

    const products: Product[] = [];
    const seenSkus = new Set<string>();

    for (const value of Array.from(chunks.values())) {
      if (!isProductChunk(value) || seenSkus.has(value.sku)) continue;
      seenSkus.add(value.sku);

      const priceUsd = Math.round(value.price * 100) / 100;
      const priceVes = Math.round(priceUsd * exchangeRate * 100) / 100;

      products.push({
        id: `riomarket-${value.sku}`,
        store: 'riomarket',
        storeName: 'Rio Market',
        name: value.name,
        brand: value.brand || undefined,
        priceUsd,
        priceVes,
        currencyOriginal: 'USD',
        priceOriginal: priceUsd,
        imageUrl: resolvePhotoUrl(value.photosUrl, chunks),
        productUrl: `https://www.riomarket.com/p/${value.slug}`,
        inStock: value.isAvailable === true && (value.stock ?? 1) > 0,
      });
    }

    return products;
  } catch (err) {
    console.error('Error in searchRiomarket:', err);
    return [];
  }
}
