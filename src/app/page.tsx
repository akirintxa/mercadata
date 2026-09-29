'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ModeSwitcher } from '@/components/ModeSwitcher';
import { ShoppingList } from '@/components/ShoppingList';
import { ExchangeRateInfo } from '@/lib/types';

export default function HomePage() {
  const [currency, setCurrency] = useState<'USD' | 'VES'>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(840.0);
  const [rateInfo, setRateInfo] = useState<ExchangeRateInfo | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState(true);

  useEffect(() => {
    async function fetchRate() {
      try {
        setIsLoadingRate(true);
        const res = await fetch('/api/rate');
        if (res.ok) {
          const data: ExchangeRateInfo = await res.json();
          setRateInfo(data);
          if (data.rate > 0) {
            setExchangeRate(data.rate);
          }
        }
      } catch (err) {
        console.error('Error fetching rate:', err);
      } finally {
        setIsLoadingRate(false);
      }
    }
    fetchRate();
  }, []);

  const toggleCurrency = () => {
    setCurrency((prev) => (prev === 'USD' ? 'VES' : 'USD'));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        currency={currency}
        onToggleCurrency={toggleCurrency}
        exchangeRate={exchangeRate}
        rateSource={rateInfo?.source}
        isLoadingRate={isLoadingRate}
      />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 space-y-4">
        <ModeSwitcher />

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            ¿Dónde consigo lo que necesito?
          </h1>
          <p className="text-sm text-slate-500">
            Arma tu lista, afina marca y presentación, y mira en cada supermercado qué producto encontramos y cuánto cuesta.
          </p>
        </div>

        <ShoppingList currency={currency} />
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 mt-6 mb-20 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700">
            Mercadata VZLA — Comparador de Precios de Supermercados
          </p>
          <p className="text-slate-400">
            Precios y disponibilidad obtenidos en tiempo real, consultando directamente la página web de cada tienda.
          </p>
        </div>
      </footer>
    </div>
  );
}
