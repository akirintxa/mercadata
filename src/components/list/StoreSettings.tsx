'use client';

import React, { useState } from 'react';
import { AlertTriangle, Check, ChevronDown, Star, Store } from 'lucide-react';
import { StoreId } from '@/lib/types';
import { STORES, ALL_STORE_IDS } from '@/lib/constants';

interface StoreSettingsProps {
  selectedStores: StoreId[];
  favoriteStore: StoreId | null;
  onToggleStore: (id: StoreId) => void;
  onSetFavorite: (id: StoreId | null) => void;
  /** Results per store from the last search, shown next to each store. */
  storeCounts?: Partial<Record<StoreId, number>>;
  /** Per-store errors from the last search (e.g. a store blocking access). */
  storeErrors?: Partial<Record<StoreId, string>>;
}

/**
 * Collapsible panel to choose which stores to compare and mark a favorite.
 * Shared by the list and the single search; collapsed by default so the
 * content stays the focus on small screens.
 */
export function StoreSettings({
  selectedStores,
  favoriteStore,
  onToggleStore,
  onSetFavorite,
  storeCounts,
  storeErrors = {},
}: StoreSettingsProps) {
  const errorCount = Object.keys(storeErrors).length;
  const [open, setOpen] = useState(false);

  return (
    <section className="bg-white border border-slate-200 rounded-2xl shadow-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        <Store className="w-5 h-5 text-blue-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900">
            Supermercados ({selectedStores.length}/{ALL_STORE_IDS.length})
          </p>
          <p className="text-xs text-slate-500 truncate">
            {favoriteStore ? (
              <>
                Favorito: <span className="font-semibold text-amber-600">{STORES[favoriteStore].name}</span>
              </>
            ) : (
              'Toca la estrella para elegir tu favorito'
            )}
          </p>
          {errorCount > 0 && (
            <p className="text-[11px] font-semibold text-amber-600 flex items-center gap-1 mt-0.5">
              <AlertTriangle className="w-3 h-3" />
              {errorCount === 1 ? '1 tienda no respondió' : `${errorCount} tiendas no respondieron`}
            </p>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul className="border-t border-slate-100 divide-y divide-slate-100">
          {ALL_STORE_IDS.map((id) => {
            const isSelected = selectedStores.includes(id);
            const isFavorite = favoriteStore === id;
            return (
              <li key={id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => onToggleStore(id)}
                  className="flex-1 flex items-center gap-3 px-4 py-3 text-left"
                >
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center border-2 ${
                      isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-semibold ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                      {STORES[id].name}
                    </span>
                    {storeErrors[id] && (
                      <span className="block text-[11px] text-amber-600 leading-snug">{storeErrors[id]}</span>
                    )}
                  </span>
                  {storeErrors[id] ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    isSelected &&
                    storeCounts?.[id] !== undefined && (
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-100 shrink-0">
                        {storeCounts[id]}
                      </span>
                    )
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onSetFavorite(isFavorite ? null : id)}
                  className="p-3 mr-1"
                  aria-label={isFavorite ? 'Quitar como favorito' : 'Marcar como favorito'}
                  title={isFavorite ? 'Quitar como favorito' : 'Marcar como favorito'}
                >
                  <Star
                    className={`w-5 h-5 ${isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
