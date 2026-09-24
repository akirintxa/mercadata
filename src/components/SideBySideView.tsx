'use client';

import React from 'react';
import { Product, StoreId } from '@/lib/types';
import { STORES } from '@/lib/constants';
import { ProductCard } from './ProductCard';
import { Store, AlertCircle, MoveHorizontal } from 'lucide-react';

interface SideBySideViewProps {
  products: Product[];
  selectedStores: StoreId[];
  currency: 'USD' | 'VES';
}

export function SideBySideView({
  products,
  selectedStores,
  currency,
}: SideBySideViewProps) {
  const storeList = selectedStores.map((id) => STORES[id]);

  // Group products by store
  const storeGroups = new Map<StoreId, Product[]>();
  for (const s of selectedStores) {
    storeGroups.set(s, []);
  }

  for (const p of products) {
    if (storeGroups.has(p.store)) {
      storeGroups.get(p.store)!.push(p);
    }
  }

  // Find the absolute cheapest across all for highlighting
  const globalCheapestId = products.length > 0 ? products[0].id : null;

  return (
    <div>
      {/* Mobile-only hint: this row scrolls sideways, not down */}
      {storeList.length > 1 && (
        <div className="flex md:hidden items-center justify-center gap-1.5 text-[11px] text-slate-400 mb-2">
          <MoveHorizontal className="w-3.5 h-3.5" />
          <span>Desliza para ver las demás tiendas</span>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 md:grid md:grid-cols-2 md:overflow-visible md:snap-none lg:grid-cols-3 xl:grid-cols-5 items-start">
        {storeList.map((st) => {
          const items = storeGroups.get(st.id) || [];

          return (
            <div
              key={st.id}
              className="shrink-0 w-[85vw] max-w-sm snap-center md:w-auto md:max-w-none md:shrink md:min-w-[240px] flex flex-col bg-slate-100/80 p-3 rounded-2xl border border-slate-200/90 space-y-3"
            >
            {/* Store Column Header */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900 truncate">
                  {st.name}
                </span>
              </div>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-100 shrink-0">
                {items.length}
              </span>
            </div>

            {/* Products Column */}
            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="bg-white/70 border border-dashed border-slate-300 rounded-xl p-6 text-center text-slate-400 text-xs">
                  <AlertCircle className="w-5 h-5 mx-auto mb-1.5 opacity-50 text-slate-400" />
                  Sin productos disponibles
                </div>
              ) : (
                items.map((p, idx) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    currency={currency}
                    rank={idx + 1}
                    isCheapest={p.id === globalCheapestId}
                  />
                ))
              )}
            </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
