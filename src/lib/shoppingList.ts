const STORAGE_KEY = 'mercadata_shopping_list_v1';
const MAX_ITEMS = 25;

function readList(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((i) => typeof i === 'string') : [];
  } catch {
    return [];
  }
}

function writeList(items: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable (private mode, quota, etc.) — fail silently.
  }
}

export function getShoppingList(): string[] {
  return readList();
}

export function addToShoppingList(item: string): string[] {
  const clean = item.trim();
  if (!clean) return readList();

  const list = readList();
  const exists = list.some((i) => i.toLowerCase() === clean.toLowerCase());
  const updated = exists ? list : [...list, clean].slice(0, MAX_ITEMS);
  writeList(updated);
  return updated;
}

export function removeFromShoppingList(item: string): string[] {
  const updated = readList().filter((i) => i !== item);
  writeList(updated);
  return updated;
}

export function clearShoppingList(): string[] {
  writeList([]);
  return [];
}
