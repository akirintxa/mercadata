'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DollarSign, ShoppingBag, Landmark } from 'lucide-react';
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
  const [showRatePopover, setShowRatePopover] = useState(false);

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
        <div className="flex items-center space-x-2 shrink-0 relative">
          <div className="hidden sm:flex items-center space-x-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-xs text-slate-600">
            <span>Tasa BCV:</span>
            <span className="font-bold text-slate-900">
              {isLoadingRate ? '...' : formatCurrency(exchangeRate, 'VES')}
            </span>
          </div>

          {/* Mobile: tap to check the BCV rate without permanently taking up
              header space (the pill above is hidden below `sm`). */}
          <button
            onClick={() => setShowRatePopover((v) => !v)}
            className="sm:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            title="Ver tasa BCV"
            aria-label="Ver tasa BCV"
            aria-expanded={showRatePopover}
          >
            <Landmark className="w-4 h-4" />
          </button>

          {showRatePopover && (
            <div className="sm:hidden absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg px-3.5 py-2.5 text-xs text-slate-600 whitespace-nowrap z-50">
              <span>Tasa BCV: </span>
              <span className="font-bold text-slate-900">
                {isLoadingRate ? 'Cargando...' : `1 USD = ${formatCurrency(exchangeRate, 'VES')}`}
              </span>
            </div>
          )}

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
