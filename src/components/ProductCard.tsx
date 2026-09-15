'use client';

import React from 'react';
import { Product } from '@/lib/types';
import { STORES } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import { ExternalLink, Tag, CheckCircle2, AlertCircle, Store } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  currency: 'USD' | 'VES';
  rank?: number;
  isCheapest?: boolean;
}

export function ProductCard({
  product,
  currency,
  rank,
  isCheapest,
}: ProductCardProps) {
  const store = STORES[product.store];
  const primaryPrice =
    currency === 'USD' ? product.priceUsd : product.priceVes;
  const secondaryPrice =
    currency === 'USD' ? product.priceVes : product.priceUsd;
  const secondaryCurrency = currency === 'USD' ? 'VES' : 'USD';

  return (
    <div
      className={`group relative flex flex-col bg-white rounded-2xl border transition-all duration-200 hover:shadow-lg ${
        isCheapest
          ? 'border-orange-400 ring-2 ring-orange-400/25 shadow-md'
          : 'border-slate-200/90 hover:border-blue-300'
      }`}
    >
      {/* Cheapest Badge */}
      {isCheapest && (
        <div className="absolute -top-3 left-4 z-10 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-extrabold px-3 py-0.5 rounded-full shadow-md flex items-center space-x-1.5 tracking-wide">
          <Tag className="w-3 h-3" />
          <span>¡MEJOR PRECIO!</span>
        </div>
      )}


      {/* Header: only store name + rank badge */}
      <div className="px-3.5 pt-3.5 pb-2">
        <div className="flex items-center gap-2">
          {/* Store Identification Badge */}
          <div className="flex items-center space-x-1.5 bg-blue-50 border border-blue-100/80 text-blue-900 px-2.5 py-1 rounded-lg text-xs font-bold tracking-tight min-w-0 flex-1">
            <Store className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">{store?.name || product.storeName}</span>
          </div>
          {/* Rank badge */}
          {rank !== undefined && !isCheapest && (
            <span className="shrink-0 bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200/80">
              #{rank}
            </span>
          )}
        </div>

        {/* Product Image Container */}
        <div className="relative w-full h-36 sm:h-40 mt-2.5 bg-slate-50/70 rounded-xl overflow-hidden flex items-center justify-center p-2.5 border border-slate-100 group-hover:bg-slate-100/60 transition-colors">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="text-slate-300 flex flex-col items-center justify-center">
              <Tag className="w-8 h-8 mb-1 opacity-40" />
              <span className="text-[11px]">Sin imagen</span>
            </div>
          )}
        </div>

        {/* Availability Status — below image */}
        <div className="mt-2">
          {product.inStock ? (
            <span className="inline-flex items-center text-emerald-700 font-medium text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600 shrink-0" />
              Disponible
            </span>
          ) : (
            <span className="inline-flex items-center text-amber-700 font-medium text-[11px] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
              <AlertCircle className="w-3 h-3 mr-1 text-amber-600 shrink-0" />
              Stock limitado
            </span>
          )}
        </div>
      </div>


      {/* Product Details */}
      <div className="p-3.5 pt-1 flex-1 flex flex-col justify-between">
        <div>
          {product.brand && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 block mb-0.5">
              {product.brand}
            </span>
          )}
          
          {/* Full Name without awkward cut-off */}
          <h4
            className="text-sm font-semibold text-slate-900 leading-snug min-h-[2.75rem] line-clamp-3 group-hover:text-blue-700 transition-colors"
            title={product.name}
          >
            {product.name}
          </h4>

          {product.presentation && (
            <span className="inline-block mt-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {product.presentation}
            </span>
          )}
        </div>

        {/* Price & Action Section */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-medium">
              <span>Precio</span>
              <span className="text-[9px] text-blue-700 bg-blue-50 font-bold px-1 rounded border border-blue-100">
                IVA incl.
              </span>
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight truncate">
              {formatCurrency(primaryPrice, currency)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium truncate">
              ≈ {formatCurrency(secondaryPrice, secondaryCurrency)}
            </div>
          </div>

          <a
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center space-x-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-xl transition-all shadow-xs active:scale-95"
            title="Ir a la tienda oficial"
          >
            <span>Ver</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
