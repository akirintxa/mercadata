export type StoreId = 'central' | 'gama' | 'plazas' | 'kalea' | 'farmatodo';

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
