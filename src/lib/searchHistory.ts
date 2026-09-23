import { POPULAR_SEARCHES } from './constants';

const STORAGE_KEY = 'mercadata_search_history_v1';
const MAX_ENTRIES = 50;
const MAX_FREQUENT = 12;

interface SearchHistoryEntry {
  term: string; // display casing, most recent usage
  count: number;
  lastUsedAt: number;
}

function normalizeKey(term: string): string {
  return term.trim().toLowerCase().replace(/\s+/g, ' ');
}

function readHistory(): SearchHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: SearchHistoryEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage unavailable (private mode, quota, etc.) — fail silently.
  }
}

/**
 * Records a user-initiated search in this browser's local history.
 * Repeated searches for the same term (case/whitespace-insensitive)
 * increment its frequency count instead of creating duplicates.
 */
export function recordSearch(term: string): void {
  const cleanTerm = term.trim();
  if (!cleanTerm) return;

  const key = normalizeKey(cleanTerm);
  const entries = readHistory();
  const existing = entries.find((e) => normalizeKey(e.term) === key);

  if (existing) {
    existing.term = cleanTerm;
    existing.count += 1;
    existing.lastUsedAt = Date.now();
  } else {
    entries.push({ term: cleanTerm, count: 1, lastUsedAt: Date.now() });
  }

  // Evict least frequent / oldest entries once we exceed the cap.
  entries.sort((a, b) => b.count - a.count || b.lastUsedAt - a.lastUsedAt);
  writeHistory(entries.slice(0, MAX_ENTRIES));
}

/**
 * Returns this browser's most frequently searched terms, most-searched first.
 * Falls back to (and tops up with) the curated POPULAR_SEARCHES list when
 * the user doesn't have enough history yet.
 */
export function getFrequentSearches(limit: number = MAX_FREQUENT): string[] {
  const entries = readHistory()
    .sort((a, b) => b.count - a.count || b.lastUsedAt - a.lastUsedAt)
    .map((e) => e.term);

  if (entries.length >= limit) {
    return entries.slice(0, limit);
  }

  const seenKeys = new Set(entries.map(normalizeKey));
  const fillers = POPULAR_SEARCHES.filter((term) => !seenKeys.has(normalizeKey(term)));

  return [...entries, ...fillers].slice(0, limit);
}
