'use client';

import React from 'react';
import Link from 'next/link';
import { DollarSign, ShoppingBag } from 'lucide-react';
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
  isLoadingRate,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2">
        {/* Brand — also doubles as the home link */}
        <Link href="/" className="flex items-center space-x-2.5 min-w-0" title="Ir al inicio">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-900 truncate">
            Mercadata
          </span>
        </Link>

        {/* Rate + Currency Switcher */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="hidden sm:flex items-center space-x-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-xs text-slate-600">
            <span>Tasa BCV:</span>
            <span className="font-bold text-slate-900">
              {isLoadingRate ? '...' : formatCurrency(exchangeRate, 'VES')}
            </span>
          </div>

          <button
            onClick={onToggleCurrency}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-medium text-sm transition-all active:scale-95"
            title="Cambiar moneda de visualización"
          >
            <DollarSign className="w-3.5 h-3.5 text-orange-400" />
            <span className="font-bold text-orange-400">{currency}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
