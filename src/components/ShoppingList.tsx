'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, Trophy, Loader2, ListChecks, AlertCircle } from 'lucide-react';
import { CompareListResponse, StoreId } from '@/lib/types';
import { STORES } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import {
  getShoppingList,
  addToShoppingList,
  removeFromShoppingList,
  clearShoppingList,
} from '@/lib/shoppingList';

export function ShoppingList() {
  const [items, setItems] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isComparing, setIsComparing] = useState(false);
  const [result, setResult] = useState<CompareListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(getShoppingList());
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setItems(addToShoppingList(inputValue.trim()));
    setInputValue('');
    setResult(null);
  };

  const handleRemove = (item: string) => {
    setItems(removeFromShoppingList(item));
    setResult(null);
  };

  const handleClear = () => {
    setItems(clearShoppingList());
    setResult(null);
  };

  const handleCompare = async () => {
    if (items.length === 0) return;
    setIsComparing(true);
    setError(null);
    try {
      const res = await fetch('/api/compare-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Error al comparar (${res.status})`);
      }
      const data: CompareListResponse = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al comparar la lista.');
    } finally {
      setIsComparing(false);
    }
  };

  const allStores: StoreId[] = ['central', 'gama', 'plazas', 'kalea', 'farmatodo'];

  return (
    <div className="space-y-6">
      {/* Add items */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <ListChecks className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-slate-900 text-lg">Tu lista de compras</h2>
        </div>

        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ej: Harina PAN, Leche 1L, Arroz 1kg..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar</span>
          </button>
        </form>

        {items.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <span
                key={item}
                className="flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-medium pl-3 pr-1.5 py-1.5 rounded-full border border-slate-200"
              >
                {item}
                <button
                  type="button"
                  onClick={() => handleRemove(item)}
                  className="p-0.5 hover:bg-slate-200 rounded-full transition-colors"
                  title="Quitar de la lista"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            Agrega los productos que sueles comprar para comparar el total entre supermercados.
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleClear}
            disabled={items.length === 0}
            className="text-xs font-semibold text-slate-500 hover:text-red-600 disabled:opacity-40 transition-colors"
          >
            Vaciar lista
          </button>
          <button
            type="button"
            onClick={handleCompare}
            disabled={items.length === 0 || isComparing}
            className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95"
          >
            {isComparing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trophy className="w-4 h-4" />
            )}
            <span>Comparar precios</span>
          </button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <section className="space-y-4">
          {/* Store totals ranking */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {result.storeTotals.map((s) => {
              const isCheapest = s.store === result.cheapestStoreId;
              return (
                <div
                  key={s.store}
                  className={`rounded-2xl p-4 border-2 ${
                    isCheapest
                      ? 'border-green-400 bg-green-50 shadow-md shadow-green-500/10'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {isCheapest && (
                    <div className="flex items-center space-x-1 text-green-700 text-[11px] font-black uppercase tracking-wide mb-1.5">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Más barata</span>
                    </div>
                  )}
                  <p className="font-bold text-slate-900 text-sm">{s.storeName}</p>
                  <p className="text-xl font-black text-slate-900 mt-1">
                    {s.foundCount > 0 ? formatCurrency(s.totalUsd, 'USD') : '—'}
                  </p>
                  {s.foundCount > 0 && (
                    <p className="text-xs text-slate-500">
                      {formatCurrency(s.totalVes, 'VES')}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    {s.foundCount}/{s.totalCount} productos encontrados
                  </p>
                  {s.missingItems.length > 0 && (
                    <p className="text-[11px] text-amber-600 mt-1 leading-snug">
                      Le falta: {s.missingItems.join(', ')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Per-item breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-xs">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left font-bold text-slate-700 px-4 py-3">Producto</th>
                  {allStores.map((store) => (
                    <th
                      key={store}
                      className="text-right font-bold text-slate-700 px-4 py-3 whitespace-nowrap"
                    >
                      {STORES[store].shortName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.itemResults.map(({ query, matches }) => {
                  const prices = allStores
                    .map((store) => matches[store]?.priceUsd)
                    .filter((p): p is number => typeof p === 'number');
                  const minPrice = prices.length > 0 ? Math.min(...prices) : null;

                  return (
                    <tr key={query} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 font-medium text-slate-800">{query}</td>
                      {allStores.map((store) => {
                        const product = matches[store];
                        const isCheapestCell =
                          product && minPrice !== null && product.priceUsd === minPrice;
                        return (
                          <td
                            key={store}
                            className={`px-4 py-3 text-right ${
                              isCheapestCell
                                ? 'font-bold text-green-700'
                                : product
                                ? 'text-slate-700'
                                : 'text-slate-300'
                            }`}
                          >
                            {product ? formatCurrency(product.priceUsd, 'USD') : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
