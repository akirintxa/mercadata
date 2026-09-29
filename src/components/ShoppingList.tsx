'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Loader2, ListChecks, AlertCircle, Trophy, Minus, Pencil } from 'lucide-react';
import {
  CompareListResponse,
  ListItemMatch,
  Product,
  ShoppingListItem,
  StoreId,
} from '@/lib/types';
import { ALL_STORE_IDS, POPULAR_SEARCHES } from '@/lib/constants';
import { getSelectedStores, saveSelectedStores } from '@/lib/storeSelection';
import {
  getShoppingList,
  saveShoppingList,
  createListItem,
  getFavoriteStore,
  saveFavoriteStore,
  isRefined,
  itemLabel,
  itemQuery,
  MAX_LIST_ITEMS,
  MAX_QUANTITY,
} from '@/lib/shoppingList';
import { StoreSettings } from '@/components/list/StoreSettings';
import { ItemEditSheet, ItemFields } from '@/components/list/ItemEditSheet';
import { ListResults } from '@/components/list/ListResults';

interface ShoppingListProps {
  currency: 'USD' | 'VES';
}

interface Editing {
  item: ShoppingListItem;
  reference?: Product;
}

async function fetchComparison(
  items: ShoppingListItem[],
  stores: StoreId[]
): Promise<CompareListResponse> {
  const res = await fetch('/api/compare-list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: items.map((i) => ({ id: i.id, query: itemQuery(i), quantity: i.quantity })),
      stores,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Error al comparar (${res.status})`);
  }
  return res.json();
}

export function ShoppingList({ currency }: ShoppingListProps) {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [selectedStores, setSelectedStores] = useState<StoreId[]>(ALL_STORE_IDS);
  const [favoriteStore, setFavoriteStore] = useState<StoreId | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [editing, setEditing] = useState<Editing | null>(null);

  // Results are kept per item so editing or adding one item only searches
  // that item again. `comparedStores` is null until the first comparison.
  const [results, setResults] = useState<Record<string, ListItemMatch>>({});
  const [comparedStores, setComparedStores] = useState<StoreId[] | null>(null);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(getShoppingList());
    // Same persisted selection as the single-product search.
    setSelectedStores(getSelectedStores());
    setFavoriteStore(getFavoriteStore());
  }, []);

  const updateItems = (next: ShoppingListItem[]) => {
    setItems(saveShoppingList(next));
  };

  const compare = useCallback(async (toSearch: ShoppingListItem[], stores: StoreId[]) => {
    if (toSearch.length === 0) return;
    const ids = toSearch.map((i) => i.id);
    setLoadingIds((prev) => new Set([...Array.from(prev), ...ids]));
    setError(null);
    try {
      const data = await fetchComparison(toSearch, stores);
      setResults((prev) => {
        const next = { ...prev };
        for (const r of data.itemResults) next[r.id] = r;
        return next;
      });
      setComparedStores(stores);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al comparar la lista.');
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }
  }, []);

  // Only results that still match the item's current query are shown.
  const freshResults: Record<string, ListItemMatch> = {};
  for (const item of items) {
    const r = results[item.id];
    if (r && r.query === itemQuery(item)) freshResults[item.id] = r;
  }
  const staleItems = items.filter((i) => !freshResults[i.id]);
  const isComparing = loadingIds.size > 0;
  const storesChanged =
    comparedStores !== null &&
    (comparedStores.length !== selectedStores.length ||
      comparedStores.some((s) => !selectedStores.includes(s)));

  const handleCompare = () => {
    // A store change invalidates every result; otherwise only search the
    // items that are new or were edited since the last comparison.
    if (comparedStores === null || storesChanged) {
      setResults({});
      // On phones the results start below the list; bring them into view.
      compare(items, selectedStores).then(() =>
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      );
    } else {
      compare(staleItems, selectedStores);
    }
  };

  const handleAdd = (name: string) => {
    const item = createListItem({ name });
    if (!item || items.length >= MAX_LIST_ITEMS) return;
    updateItems([...items, item]);
    if (comparedStores !== null && !storesChanged) compare([item], comparedStores);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    handleAdd(inputValue.trim());
    setInputValue('');
  };

  const handleQuantity = (item: ShoppingListItem, delta: number) => {
    const quantity = Math.min(MAX_QUANTITY, Math.max(1, item.quantity + delta));
    updateItems(items.map((i) => (i.id === item.id ? { ...i, quantity } : i)));
  };

  const handleSave = (fields: ItemFields) => {
    if (!editing) return;
    const updated: ShoppingListItem = { ...editing.item, ...fields };
    updateItems(items.map((i) => (i.id === updated.id ? updated : i)));
    setEditing(null);
    if (
      comparedStores !== null &&
      !storesChanged &&
      itemQuery(updated) !== itemQuery(editing.item)
    ) {
      compare([updated], comparedStores);
    }
  };

  const handleDelete = () => {
    if (!editing) return;
    updateItems(items.filter((i) => i.id !== editing.item.id));
    setEditing(null);
  };

  const handleClear = () => {
    updateItems([]);
    setResults({});
    setComparedStores(null);
  };

  const handleToggleStore = (storeId: StoreId) => {
    let updated: StoreId[];
    if (selectedStores.includes(storeId)) {
      if (selectedStores.length === 1) return; // keep at least one
      updated = selectedStores.filter((id) => id !== storeId);
      if (storeId === favoriteStore) {
        setFavoriteStore(null);
        saveFavoriteStore(null);
      }
    } else {
      updated = [...selectedStores, storeId];
    }
    setSelectedStores(updated);
    saveSelectedStores(updated);
  };

  const handleSetFavorite = (storeId: StoreId | null) => {
    setFavoriteStore(storeId);
    saveFavoriteStore(storeId);
    if (storeId && !selectedStores.includes(storeId)) {
      const updated = [...selectedStores, storeId];
      setSelectedStores(updated);
      saveSelectedStores(updated);
    }
  };

  const needsCompare = items.length > 0 && (comparedStores === null || storesChanged || staleItems.length > 0);
  const suggestions = POPULAR_SEARCHES.filter(
    (s) => !items.some((i) => i.name.toLowerCase() === s.toLowerCase())
  ).slice(0, 6);

  return (
    <div className="space-y-4">
      <StoreSettings
        selectedStores={selectedStores}
        favoriteStore={favoriteStore}
        onToggleStore={handleToggleStore}
        onSetFavorite={handleSetFavorite}
      />

      {/* The list */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-900 text-lg">Tu lista</h2>
            {items.length > 0 && <span className="text-xs font-semibold text-slate-400">{items.length}</span>}
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-semibold text-slate-400 hover:text-red-600 py-1"
            >
              Vaciar
            </button>
          )}
        </div>

        <form onSubmit={handleAddSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ej: leche descremada, harina PAN…"
            enterKeyHint="done"
            className="flex-1 min-w-0 px-3.5 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || items.length >= MAX_LIST_ITEMS}
            className="shrink-0 w-12 h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl active:scale-95"
            aria-label="Agregar a la lista"
          >
            <Plus className="w-5 h-5" />
          </button>
        </form>

        {items.length > 0 ? (
          <ul className="divide-y divide-slate-100 -mx-1">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-2 px-1 py-2">
                <button
                  type="button"
                  onClick={() => setEditing({ item })}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="text-sm font-semibold text-slate-900 truncate">{itemLabel(item)}</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Pencil className="w-3 h-3" />
                    {isRefined(item) ? 'Afinado · toca para editar' : 'Toca para afinar marca y presentación'}
                  </p>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleQuantity(item, -1)}
                    disabled={item.quantity <= 1}
                    className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-30"
                    aria-label="Menos"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => handleQuantity(item, 1)}
                    className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600"
                    aria-label="Más"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">
            Agrega lo que necesitas comprar. Luego puedes afinar la marca y la presentación de cada producto.
          </p>
        )}

        {suggestions.length > 0 && items.length < 3 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleAdd(s)}
                className="text-xs font-medium text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 px-2.5 py-1.5 rounded-full border border-slate-200"
              >
                + {s}
              </button>
            ))}
          </div>
        )}
      </section>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div ref={resultsRef} className="scroll-mt-16" />
      {comparedStores !== null && !storesChanged && items.length > 0 && (
        <ListResults
          items={items}
          results={freshResults}
          stores={comparedStores}
          favoriteStore={favoriteStore}
          loadingIds={loadingIds}
          currency={currency}
          onRefine={(item, reference) => setEditing({ item, reference })}
          onEdit={(item) => setEditing({ item })}
        />
      )}

      {/* Sticky compare action, within thumb reach on phones */}
      {items.length > 0 && (needsCompare || isComparing) && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-w-2xl mx-auto">
            <button
              type="button"
              onClick={handleCompare}
              disabled={isComparing}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white py-3.5 rounded-2xl text-base font-bold shadow-sm active:scale-[0.98]"
            >
              {isComparing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trophy className="w-5 h-5" />}
              <span>
                {isComparing
                  ? 'Buscando en las tiendas…'
                  : comparedStores === null || storesChanged
                  ? `Comparar precios (${items.length})`
                  : `Actualizar ${staleItems.length} ${staleItems.length === 1 ? 'producto' : 'productos'}`}
              </span>
            </button>
          </div>
        </div>
      )}

      {editing && (
        <ItemEditSheet
          key={`${editing.item.id}-${editing.reference?.id ?? ''}`}
          item={editing.item}
          reference={editing.reference}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
