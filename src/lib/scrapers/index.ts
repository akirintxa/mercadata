import { Product, StoreId, SearchResponse } from '../types';
import { getExchangeRate } from './bcv';
import { searchCentral } from './central';
import { searchGama } from './gama';
import { searchPlazas } from './plazas';
import { searchKalea } from './kalea';
import { searchFarmatodo } from './farmatodo';
import { searchRiomarket } from './riomarket';
import { evaluateProductMatch, normalizeText, STOPWORDS } from '../searchMatcher';

interface SearchOptions {
  stores?: StoreId[];
  sortBy?: 'price-asc' | 'price-desc' | 'relevance';
}

export async function searchAllStores(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResponse> {
  const cleanQuery = query.trim();
  const rateInfo = await getExchangeRate();
  const exchangeRate = rateInfo.rate;

  const enabledStores: StoreId[] = options.stores && options.stores.length > 0
    ? options.stores
    : ['central', 'gama', 'plazas', 'kalea', 'farmatodo', 'riomarket'];

  const storeCounts: Record<StoreId, number> = {
    central: 0,
    gama: 0,
    plazas: 0,
    kalea: 0,
    farmatodo: 0,
    riomarket: 0,
  };

  const errors: Record<string, string> = {};

  if (!cleanQuery) {
    return {
      query: '',
      timestamp: new Date().toISOString(),
      exchangeRate,
      totalProducts: 0,
      products: [],
      storeCounts,
      errors,
    };
  }

  // To ensure supermarket APIs don't fail on complex presentation formats,
  // we extract terms for the store query:
  const normQuery = normalizeText(cleanQuery);
  const sizeTokenRegex = /^(\d+(?:\.\d+)?)(l|kg|g|ml)$/;
  const qTokens = normQuery.split(/\s+/).filter(Boolean);
  const keywordTokens = qTokens.filter((t) => !sizeTokenRegex.test(t));
  
  // Store query: if query has keywords + size, we send the core keywords or full query
  const queryForStores = keywordTokens.length > 0 ? keywordTokens.join(' ') : cleanQuery;

  // Some store search backends (e.g. Central's WooCommerce "search" param)
  // effectively require the words to appear together/in order, so a
  // multi-word query like "atun en agua" can return zero results even
  // though matching products exist. As a fallback, if a store's search
  // comes back empty for a multi-word query, retry with just the single
  // most distinctive keyword to get a broader result set — the strict
  // multi-keyword filtering below (evaluateProductMatch) still ensures
  // only real matches make it into the final results.
  const meaningfulKeywords = keywordTokens.filter((t) => !STOPWORDS.has(t));
  const fallbackKeyword = [...(meaningfulKeywords.length > 0 ? meaningfulKeywords : keywordTokens)].sort(
    (a, b) => b.length - a.length
  )[0];
  const fallbackQueryForStores =
    fallbackKeyword && fallbackKeyword !== queryForStores ? fallbackKeyword : null;

  async function searchStoreWithFallback(
    searchFn: (query: string, rate: number) => Promise<Product[]>
  ): Promise<Product[]> {
    const products = await searchFn(queryForStores, exchangeRate);
    if (products.length > 0 || !fallbackQueryForStores) {
      return products;
    }
    return searchFn(fallbackQueryForStores, exchangeRate);
  }

  const tasks: Promise<{ store: StoreId; products: Product[]; error?: string }>[] = [];

  if (enabledStores.includes('central')) {
    tasks.push(
      searchStoreWithFallback(searchCentral)
        .then((products) => ({ store: 'central' as const, products }))
        .catch((err) => ({ store: 'central' as const, products: [], error: String(err) }))
    );
  }

  if (enabledStores.includes('gama')) {
    tasks.push(
      searchStoreWithFallback(searchGama)
        .then((products) => ({ store: 'gama' as const, products }))
        .catch((err) => ({ store: 'gama' as const, products: [], error: String(err) }))
    );
  }

  if (enabledStores.includes('plazas')) {
    tasks.push(
      searchStoreWithFallback(searchPlazas)
        .then((products) => ({ store: 'plazas' as const, products }))
        .catch((err) => ({ store: 'plazas' as const, products: [], error: String(err) }))
    );
  }

  if (enabledStores.includes('kalea')) {
    tasks.push(
      searchStoreWithFallback(searchKalea)
        .then((products) => ({ store: 'kalea' as const, products }))
        .catch((err) => ({ store: 'kalea' as const, products: [], error: String(err) }))
    );
  }

  if (enabledStores.includes('farmatodo')) {
    tasks.push(
      searchStoreWithFallback(searchFarmatodo)
        .then((products) => ({ store: 'farmatodo' as const, products }))
        .catch((err) => ({ store: 'farmatodo' as const, products: [], error: String(err) }))
    );
  }

  if (enabledStores.includes('riomarket')) {
    tasks.push(
      searchStoreWithFallback(searchRiomarket)
        .then((products) => ({ store: 'riomarket' as const, products }))
        .catch((err) => ({ store: 'riomarket' as const, products: [], error: String(err) }))
    );
  }

  const results = await Promise.allSettled(tasks);
  let rawProducts: Product[] = [];

  for (const res of results) {
    if (res.status === 'fulfilled') {
      const { store, products, error } = res.value;
      if (error) {
        errors[store] = error;
      }
      rawProducts.push(...products);
    }
  }

  // Evaluate each product against the user's FULL original query with smart matching
  const evaluated = rawProducts.map((p) => {
    const match = evaluateProductMatch(p, cleanQuery);
    return {
      product: {
        ...p,
        score: match.score,
      },
      match,
    };
  });

  // Filter products:
  // 1. Strict matches (contains all keywords + exact presentation/size if specified)
  const strictMatches = evaluated
    .filter((e) => e.match.matches)
    .map((e) => e.product);

  let finalProducts: Product[] = [];

  if (strictMatches.length > 0) {
    finalProducts = strictMatches;
  } else {
    // If no strict matches (e.g. very niche query), fallback to highest scoring partial matches
    finalProducts = evaluated
      .filter((e) => e.match.score >= 40)
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, 30)
      .map((e) => e.product);
  }

  // Update storeCounts with the filtered results
  for (const p of finalProducts) {
    if (storeCounts[p.store] !== undefined) {
      storeCounts[p.store]++;
    }
  }

  // Default sorting: Price Ascending (lowest to highest)
  const sortBy = options.sortBy || 'price-asc';

  // A product with no stock isn't actually purchasable at that price, so it
  // should never outrank an available one as "cheapest" — push it to the
  // bottom regardless of sort order, then apply the chosen sort within each
  // availability group.
  const byAvailability = (a: Product, b: Product) =>
    (a.inStock === b.inStock ? 0 : a.inStock ? -1 : 1);

  if (sortBy === 'price-asc') {
    finalProducts.sort((a, b) => byAvailability(a, b) || a.priceUsd - b.priceUsd);
  } else if (sortBy === 'price-desc') {
    finalProducts.sort((a, b) => byAvailability(a, b) || b.priceUsd - a.priceUsd);
  } else if (sortBy === 'relevance') {
    finalProducts.sort(
      (a, b) => byAvailability(a, b) || (b.score || 0) - (a.score || 0) || a.priceUsd - b.priceUsd
    );
  }

  return {
    query: cleanQuery,
    timestamp: new Date().toISOString(),
    exchangeRate,
    totalProducts: finalProducts.length,
    products: finalProducts,
    storeCounts,
    errors,
  };
}
