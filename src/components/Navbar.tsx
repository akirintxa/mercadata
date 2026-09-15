'use client';

import React from 'react';
import { DollarSign, ShoppingBag, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface NavbarProps {
  currency: 'USD' | 'VES';
  onToggleCurrency: () => void;
  exchangeRate: number;
  rateSource?: string;
  isLoadingRate?: boolean;
}

export function Navbar({
  currency,
  onToggleCurrency,
  exchangeRate,
  rateSource,
  isLoadingRate,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 bg-clip-text text-transparent">
                Mercadata
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">
                VZLA
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Comparador de supermercados en tiempo real
            </p>
          </div>
        </div>

        {/* Rate, IVA badge & Currency Switcher */}
        <div className="flex items-center space-x-2.5">
          {/* IVA Included Badge */}
          <div className="hidden lg:flex items-center space-x-1 bg-blue-50 border border-blue-200/80 px-2.5 py-1 rounded-full text-xs text-blue-900 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Precios con IVA incluido</span>
          </div>

          {/* BCV Rate Pill */}
          <div className="hidden md:flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 text-xs text-slate-700">
            <span className="font-medium text-slate-500">Tasa BCV:</span>
            <span className="font-bold text-slate-900">
              {isLoadingRate ? 'Cargando...' : `1 USD = ${formatCurrency(exchangeRate, 'VES')}`}
            </span>
          </div>

          {/* Currency Toggle */}
          <button
            onClick={onToggleCurrency}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl font-medium text-sm transition-all shadow-sm active:scale-95"
            title="Cambiar moneda de visualización"
          >
            <DollarSign className="w-4 h-4 text-orange-400" />
            <span>Moneda:</span>
            <span className="font-bold text-orange-400">
              {currency === 'USD' ? 'USD ($)' : 'Bs. (VES)'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
