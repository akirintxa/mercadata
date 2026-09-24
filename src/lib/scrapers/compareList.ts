import { StoreId, Product, ListItemMatch, StoreListTotal, CompareListResponse } from '../types';
import { STORES } from '../constants';
import { searchAllStores } from './index';
import { getExchangeRate } from './bcv';

const MAX_LIST_ITEMS = 25;
const ALL_STORES: StoreId[] = ['central', 'gama', 'plazas', 'kalea', 'farmatodo', 'riomarket'];

/**
 * For a shopping list, resolves each item independently (reusing the same
 * search + matching pipeline as a normal search) and, per store, picks the
 * cheapest in-stock match for that item. Store totals only sum the items a
 * store actually has — a store missing items is not excluded from the
 * ranking, it just has a smaller `foundCount` and its `missingItems` listed
 * so the user can judge whether the total is really comparable.
 */
export async function compareShoppingList(
  rawItems: string[]
): Promise<CompareListResponse> {
  const items = Array.from(
    new Set(rawItems.map((i) => i.trim()).filter(Boolean))
  ).slice(0, MAX_LIST_ITEMS);

  const rateInfo = await getExchangeRate();

  const itemResults: ListItemMatch[] = await Promise.all(
    items.map(async (query) => {
      const result = await searchAllStores(query, { sortBy: 'price-asc' });

      // `products` is sorted price-asc, so the first product seen per store
      // is that store's cheapest in-stock match for this item.
      const matches: Partial<Record<StoreId, Product>> = {};
      for (const product of result.products) {
        if (!product.inStock) continue;
        if (!matches[product.store]) {
          matches[product.store] = product;
        }
      }

      return { query, matches };
    })
  );

  const storeTotals: StoreListTotal[] = ALL_STORES.map((store) => {
    let totalUsd = 0;
    let totalVes = 0;
    let foundCount = 0;
    const missingItems: string[] = [];

    for (const { query, matches } of itemResults) {
      const product = matches[store];
      if (product) {
        totalUsd += product.priceUsd;
        totalVes += product.priceVes;
        foundCount += 1;
      } else {
        missingItems.push(query);
      }
    }

    return {
      store,
      storeName: STORES[store].name,
      totalUsd,
      totalVes,
      foundCount,
      totalCount: itemResults.length,
      missingItems,
    };
  });

  const cheapestStoreId =
    storeTotals
      .filter((s) => s.foundCount > 0)
      .sort((a, b) => a.totalUsd - b.totalUsd)[0]?.store ?? null;

  return {
    items,
    timestamp: new Date().toISOString(),
    exchangeRate: rateInfo.rate,
    storeTotals: storeTotals.sort((a, b) => a.totalUsd - b.totalUsd),
    itemResults,
    cheapestStoreId,
  };
}
