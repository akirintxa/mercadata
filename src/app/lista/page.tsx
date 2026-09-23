'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ModeSwitcher } from '@/components/ModeSwitcher';
import { ShoppingList } from '@/components/ShoppingList';
import { ExchangeRateInfo } from '@/lib/types';

export default function ShoppingListPage() {
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

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="max-w-2xl mx-auto w-full">
          <ModeSwitcher />
        </div>

        <div className="text-center space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            ¿En cuál supermercado sale más barata tu compra?
          </h1>
          <p className="text-sm text-slate-500">
            Arma tu lista y te decimos dónde te conviene comprar cada cosa y en conjunto.
          </p>
        </div>

        <ShoppingList currency={currency} />
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700">
            Mercadata VZLA — Comparador de Precios de Supermercados
          </p>
        </div>
      </footer>
    </div>
  );
}
