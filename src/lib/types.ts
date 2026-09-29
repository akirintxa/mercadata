export type StoreId =
  | 'central'
  | 'gama'
  | 'plazas'
  | 'kalea'
  | 'farmatodo'
  | 'riomarket'
  | 'plansuarez';

export interface StoreInfo {
  id: StoreId;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  logoText: string;
  url: string;
  currencyNative: 'USD' | 'VES';
}

export interface Product {
  id: string;
  store: StoreId;
  storeName: string;
  name: string;
  brand?: string;
  presentation?: string;
  priceUsd: number;
  priceVes: number;
  currencyOriginal: 'USD' | 'VES';
  priceOriginal: number;
  imageUrl?: string;
  productUrl: string;
  inStock: boolean;
  score?: number;
}

export interface SearchResponse {
  query: string;
  timestamp: string;
  exchangeRate: number; // VES per USD
  totalProducts: number;
  products: Product[];
  storeCounts: Record<StoreId, number>;
  errors: Record<string, string>;
}

export interface ExchangeRateInfo {
  rate: number;
  source: string;
  updatedAt: string;
}

/**
 * One entry of the user's shopping list. `name` is the generic product the
 * user wants ("leche descremada"); `brand` and `presentation` are optional
 * refinements ("La Pastoreña", "1L") that narrow the search so every store
 * is compared on the same product.
 */
export interface ShoppingListItem {
  id: string;
  name: string;
  brand?: string;
  presentation?: string;
  quantity: number;
}

/** An item as sent to `/api/compare-list`: its id, search query and quantity. */
export interface CompareListItemRequest {
  id: string;
  query: string;
  quantity?: number;
}

export interface ListItemMatch {
  id: string;
  query: string;
  quantity: number;
  /**
   * In-stock candidates per store, cheapest first (at most a few). The first
   * one is the product used for that store's total.
   */
  options: Partial<Record<StoreId, Product[]>>;
}

export interface StoreListTotal {
  store: StoreId;
  storeName: string;
  totalUsd: number;
  totalVes: number;
  foundCount: number;
  totalCount: number;
  missingItems: string[];
}

export interface CompareListResponse {
  timestamp: string;
  exchangeRate: number;
  stores: StoreId[];
  storeTotals: StoreListTotal[];
  itemResults: ListItemMatch[];
  cheapestStoreId: StoreId | null;
}
