'use client';

import React from 'react';
import { Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Award, ArrowDownRight } from 'lucide-react';
import { STORES } from '@/lib/constants';

interface StoreComparisonSummaryProps {
  products: Product[];
  currency: 'USD' | 'VES';
}

export function StoreComparisonSummary({
  products,
  currency,
}: StoreComparisonSummaryProps) {
  if (products.length < 2) return null;

  const cheapest = products[0];
  const mostExpensive = products[products.length - 1];

  const priceDiff =
    currency === 'USD'
      ? mostExpensive.priceUsd - cheapest.priceUsd
      : mostExpensive.priceVes - cheapest.priceVes;

  const savingsPercent =
    mostExpensive.priceUsd > 0
      ? Math.round(
          ((mostExpensive.priceUsd - cheapest.priceUsd) / mostExpensive.priceUsd) * 100
        )
      : 0;

  const cheapestStore = STORES[cheapest.store];

  // Group cheapest per store (in-stock products only — an out-of-stock
  // match isn't something the store can actually sell right now)
  const storeBests = new Map<string, Product>();
  for (const p of products) {
    if (p.inStock && !storeBests.has(p.store)) {
      storeBests.set(p.store, p);
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-xl relative overflow-hidden border border-blue-900/50">
      {/* Decorative gradient glow */}
      <div className="absolute -right-12 -bottom-12 w-56 h-56 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-12 -top-12 w-56 h-56 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Best Price Highlight */}
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shrink-0 text-white shadow-md shadow-orange-500/30">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-orange-400">
                Opción más económica
              </span>
              {savingsPercent > 0 && (
                <span className="bg-orange-500/20 text-orange-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-orange-500/30">
                  Ahorras hasta {savingsPercent}%
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-1 line-clamp-2">
              {cheapest.name}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Encontrado en{' '}
              <span className="font-bold text-orange-300">
                {cheapestStore?.name || cheapest.storeName}
              </span>{' '}
              por{' '}
              <span className="font-black text-white text-base">
                {formatCurrency(
                  currency === 'USD' ? cheapest.priceUsd : cheapest.priceVes,
                  currency
                )}
              </span>
            </p>
          </div>
        </div>

        {/* Quick Comparison Metrics */}
        <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 shrink-0">
          <div>
            <span className="text-[11px] text-slate-300 block font-medium">Diferencia max</span>
            <span className="text-sm sm:text-base font-extrabold text-orange-400 flex items-center">
              <ArrowDownRight className="w-4 h-4 mr-0.5" />
              {formatCurrency(priceDiff, currency)}
            </span>
          </div>
          <div className="h-8 w-px bg-white/15" />
          <div>
            <span className="text-[11px] text-slate-300 block font-medium">Tiendas con stock</span>
            <span className="text-sm sm:text-base font-extrabold text-white">
              {storeBests.size} comparadas
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
