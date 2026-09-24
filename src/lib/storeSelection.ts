import { StoreId } from './types';
import { ALL_STORE_IDS } from './constants';

const STORAGE_KEY = 'mercadata_selected_stores_v1';

/**
 * Reads the user's preferred store selection (shared between the single
 * product search and the shopping list), falling back to all stores when
 * nothing is saved yet.
 */
export function getSelectedStores(): StoreId[] {
  if (typeof window === 'undefined') return ALL_STORE_IDS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return ALL_STORE_IDS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return ALL_STORE_IDS;
    const valid = parsed.filter((id): id is StoreId => ALL_STORE_IDS.includes(id));
    return valid.length > 0 ? valid : ALL_STORE_IDS;
  } catch {
    return ALL_STORE_IDS;
  }
}

export function saveSelectedStores(stores: StoreId[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stores));
  } catch {
    // Storage unavailable (private mode, quota, etc.) — fail silently.
  }
}
