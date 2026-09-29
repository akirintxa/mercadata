import { StoreId, Product, ListItemMatch, CompareListItemRequest, CompareListResponse } from '../types';
import { ALL_STORE_IDS } from '../constants';
import { computeStoreTotals } from '../listTotals';
import { searchAllStores } from './index';
import { getExchangeRate } from './bcv';

const MAX_LIST_ITEMS = 25;
/** How many in-stock candidates per store are returned for each item. */
const OPTIONS_PER_STORE = 4;

interface CompareListOptions {
  stores?: StoreId[];
}

/**
 * For a shopping list, resolves each item independently (reusing the same
 * search + matching pipeline as a normal search) and, per store, keeps the
 * cheapest in-stock matches for that item. The first option per store is
 * the one used for totals; the rest let the user see alternatives and
 * refine the item's brand/presentation from a concrete product.
 */
export async function compareShoppingList(
  rawItems: CompareListItemRequest[],
  options: CompareListOptions = {}
): Promise<CompareListResponse> {
  const seen = new Set<string>();
  const items = rawItems
    .map((i) => ({
      id: i.id,
      query: i.query.trim(),
      quantity: Math.max(1, Math.round(i.quantity ?? 1)),
    }))
    .filter((i) => i.query && !seen.has(i.id) && seen.add(i.id))
    .slice(0, MAX_LIST_ITEMS);

  const stores = options.stores && options.stores.length > 0 ? options.stores : ALL_STORE_IDS;

  const rateInfo = await getExchangeRate();

  const itemResults: ListItemMatch[] = await Promise.all(
    items.map(async ({ id, query, quantity }) => {
      const result = await searchAllStores(query, { stores, sortBy: 'price-asc' });

      // `products` is sorted price-asc, so products are appended to each
      // store's options cheapest first.
      const storeOptions: Partial<Record<StoreId, Product[]>> = {};
      for (const product of result.products) {
        if (!product.inStock) continue;
        const list = (storeOptions[product.store] ??= []);
        if (list.length < OPTIONS_PER_STORE) list.push(product);
      }

      return { id, query, quantity, options: storeOptions };
    })
  );

  const { storeTotals, cheapestStoreId } = computeStoreTotals(itemResults, stores);

  return {
    timestamp: new Date().toISOString(),
    exchangeRate: rateInfo.rate,
    stores,
    storeTotals: storeTotals.sort((a, b) => a.totalUsd - b.totalUsd),
    itemResults,
    cheapestStoreId,
  };
}
