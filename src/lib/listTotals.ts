import { StoreId, Product, ListItemMatch, StoreListTotal } from './types';
import { STORES } from './constants';

/** The product a store uses for an item: its cheapest in-stock option. */
export function pickForStore(item: ListItemMatch, store: StoreId): Product | undefined {
  return item.options[store]?.[0];
}

/**
 * Sums, per store, the chosen product of every item times its quantity.
 * Only items a store actually has count toward its total — a store missing
 * items still competes, with a smaller `foundCount` and its `missingItems`
 * listed so the user can judge whether the totals are comparable.
 *
 * Pure so the server (`/api/compare-list`) and the client (which updates
 * single items and quantities without refetching the whole list) agree.
 */
export function computeStoreTotals(
  itemResults: ListItemMatch[],
  stores: StoreId[]
): { storeTotals: StoreListTotal[]; cheapestStoreId: StoreId | null } {
  const storeTotals: StoreListTotal[] = stores.map((store) => {
    let totalUsd = 0;
    let totalVes = 0;
    let foundCount = 0;
    const missingItems: string[] = [];

    for (const item of itemResults) {
      const product = pickForStore(item, store);
      if (product) {
        totalUsd += product.priceUsd * item.quantity;
        totalVes += product.priceVes * item.quantity;
        foundCount += 1;
      } else {
        missingItems.push(item.query);
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
    [...storeTotals]
      .filter((s) => s.foundCount > 0)
      .sort((a, b) => b.foundCount - a.foundCount || a.totalUsd - b.totalUsd)[0]?.store ?? null;

  return { storeTotals, cheapestStoreId };
}

/**
 * The cheapest store (other than `exclude`) that has the item, so a store
 * missing it can point the user to where they can get it instead.
 */
export function cheapestElsewhere(
  item: ListItemMatch,
  stores: StoreId[],
  exclude: StoreId
): Product | undefined {
  let best: Product | undefined;
  for (const store of stores) {
    if (store === exclude) continue;
    const p = pickForStore(item, store);
    if (p && (!best || p.priceUsd < best.priceUsd)) best = p;
  }
  return best;
}
