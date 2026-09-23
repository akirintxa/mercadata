'use client';

import React from 'react';
import { StoreId } from '@/lib/types';
import { STORES } from '@/lib/constants';
import { Check, Store, AlertTriangle } from 'lucide-react';

interface StoreFilterProps {
  selectedStores: StoreId[];
  onToggleStore: (id: StoreId) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  storeCounts: Record<StoreId, number>;
  storeErrors?: Partial<Record<StoreId, string>>;
}

export function StoreFilter({
  selectedStores,
  onToggleStore,
  onSelectAll,
  onClearAll,
  storeCounts,
  storeErrors = {},
}: StoreFilterProps) {
  const storeList = Object.values(STORES);
  const allSelected = selectedStores.length === storeList.length;

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Store className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Supermercados ({selectedStores.length}/{storeList.length})
          </h3>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <button
            type="button"
            onClick={allSelected ? onClearAll : onSelectAll}
            className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
          >
            {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {storeList.map((st) => {
          const isSelected = selectedStores.includes(st.id);
          const count = storeCounts[st.id] ?? 0;
          const errorMsg = storeErrors[st.id];

          return (
            <button
              key={st.id}
              type="button"
              onClick={() => onToggleStore(st.id)}
              title={errorMsg}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                errorMsg
                  ? 'border-amber-300 bg-amber-50/70 text-amber-900'
                  : isSelected
                  ? 'border-blue-500 bg-blue-50/70 text-slate-900 shadow-2xs'
                  : 'border-slate-200 bg-slate-50/60 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
              }`}
            >
              <div className="flex items-center space-x-2 min-w-0">
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="text-xs font-bold truncate">
                  {st.shortName}
                </span>
              </div>

              {errorMsg ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 ml-1 shrink-0" />
              ) : (
                count > 0 && (
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ml-1 shrink-0 ${
                      isSelected
                        ? 'bg-blue-200 text-blue-900'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                )
              )}
            </button>
          );
        })}
      </div>

      {Object.keys(storeErrors).length > 0 && (
        <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 space-y-0.5">
          {Object.entries(storeErrors).map(([storeId, msg]) => (
            <p key={storeId}>
              <span className="font-bold">{STORES[storeId as StoreId]?.shortName}:</span> {msg}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
