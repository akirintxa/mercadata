import { Product, StoreId, SearchResponse } from '../types';
import { getExchangeRate } from './bcv';
import { searchCentral } from './central';
import { searchGama } from './gama';
import { searchPlazas } from './plazas';
import { searchKalea } from './kalea';
import { searchFarmatodo } from './farmatodo';
import { evaluateProductMatch, normalizeText } from '../searchMatcher';

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
    : ['central', 'gama', 'plazas', 'kalea', 'farmatodo'];

  const storeCounts: Record<StoreId, number> = {
    central: 0,
    gama: 0,
    plazas: 0,
    kalea: 0,
    farmatodo: 0,
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

  const tasks: Promise<{ store: StoreId; products: Product[]; error?: string }>[] = [];

  if (enabledStores.includes('central')) {
    tasks.push(
      searchCentral(queryForStores, exchangeRate)
        .then((products) => ({ store: 'central' as const, products }))
        .catch((err) => ({ store: 'central' as const, products: [], error: String(err) }))
    );
  }

  if (enabledStores.includes('gama')) {
    tasks.push(
      searchGama(queryForStores, exchangeRate)
        .then((products) => ({ store: 'gama' as const, products }))
        .catch((err) => ({ store: 'gama' as const, products: [], error: String(err) }))
    );
  }

  if (enabledStores.includes('plazas')) {
    tasks.push(
      searchPlazas(queryForStores, exchangeRate)
        .then((products) => ({ store: 'plazas' as const, products }))
        .catch((err) => ({ store: 'plazas' as const, products: [], error: String(err) }))
    );
  }

  if (enabledStores.includes('kalea')) {
    tasks.push(
      searchKalea(queryForStores, exchangeRate)
        .then((products) => ({ store: 'kalea' as const, products }))
        .catch((err) => ({ store: 'kalea' as const, products: [], error: String(err) }))
    );
  }

  if (enabledStores.includes('farmatodo')) {
    tasks.push(
      searchFarmatodo(queryForStores, exchangeRate)
        .then((products) => ({ store: 'farmatodo' as const, products }))
        .catch((err) => ({ store: 'farmatodo' as const, products: [], error: String(err) }))
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

  if (sortBy === 'price-asc') {
    finalProducts.sort((a, b) => a.priceUsd - b.priceUsd);
  } else if (sortBy === 'price-desc') {
    finalProducts.sort((a, b) => b.priceUsd - a.priceUsd);
  } else if (sortBy === 'relevance') {
    finalProducts.sort((a, b) => (b.score || 0) - (a.score || 0) || a.priceUsd - b.priceUsd);
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
