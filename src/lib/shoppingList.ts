import { ShoppingListItem, StoreId } from './types';
import { ALL_STORE_IDS } from './constants';

const STORAGE_KEY = 'mercadata_shopping_list_v2';
/** The first version stored the list as plain strings; migrated on read. */
const LEGACY_STORAGE_KEY = 'mercadata_shopping_list_v1';
const FAVORITE_STORE_KEY = 'mercadata_favorite_store_v1';
export const MAX_LIST_ITEMS = 25;
export const MAX_QUANTITY = 99;

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function clean(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function sanitize(raw: any): ShoppingListItem | null {
  const name = clean(raw?.name);
  if (!name) return null;
  const quantity = Number(raw?.quantity);
  return {
    id: clean(raw?.id) ?? newId(),
    name,
    brand: clean(raw?.brand),
    presentation: clean(raw?.presentation),
    quantity: Number.isFinite(quantity)
      ? Math.min(MAX_QUANTITY, Math.max(1, Math.round(quantity)))
      : 1,
  };
}

function readList(): ShoppingListItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.map(sanitize).filter((i): i is ShoppingListItem => i !== null)
        : [];
    }

    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      const migrated = Array.isArray(parsed)
        ? parsed
            .filter((i): i is string => typeof i === 'string')
            .map((name) => sanitize({ name }))
            .filter((i): i is ShoppingListItem => i !== null)
        : [];
      writeList(migrated);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      return migrated;
    }
  } catch {
    // Corrupt or unavailable storage — start with an empty list.
  }
  return [];
}

function writeList(items: ShoppingListItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable (private mode, quota, etc.) — fail silently.
  }
}

export function getShoppingList(): ShoppingListItem[] {
  return readList();
}

export function saveShoppingList(items: ShoppingListItem[]): ShoppingListItem[] {
  const sanitized = items
    .map(sanitize)
    .filter((i): i is ShoppingListItem => i !== null)
    .slice(0, MAX_LIST_ITEMS);
  writeList(sanitized);
  return sanitized;
}

export function createListItem(
  fields: Omit<ShoppingListItem, 'id' | 'quantity'> & { quantity?: number }
): ShoppingListItem | null {
  return sanitize({ ...fields, id: newId() });
}

/** Whether the user already narrowed the item to a brand or presentation. */
export function isRefined(item: ShoppingListItem): boolean {
  return Boolean(item.brand || item.presentation);
}

/** Human label for an item: "Leche descremada La Pastoreña 1L". */
export function itemLabel(item: ShoppingListItem): string {
  return [item.name, item.brand, item.presentation].filter(Boolean).join(' ');
}

/**
 * The search query sent to the stores. Brand and presentation are appended
 * to the generic name, so the matcher requires them in every result.
 */
export function itemQuery(item: ShoppingListItem): string {
  return itemLabel(item);
}

export function getFavoriteStore(): StoreId | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(FAVORITE_STORE_KEY);
    return raw && ALL_STORE_IDS.includes(raw as StoreId) ? (raw as StoreId) : null;
  } catch {
    return null;
  }
}

export function saveFavoriteStore(store: StoreId | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (store) window.localStorage.setItem(FAVORITE_STORE_KEY, store);
    else window.localStorage.removeItem(FAVORITE_STORE_KEY);
  } catch {
    // Storage unavailable — fail silently.
  }
}
