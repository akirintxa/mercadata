'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { ModeSwitcher } from '@/components/ModeSwitcher';
import { SearchBar } from '@/components/SearchBar';
import { StoreFilter } from '@/components/StoreFilter';
import { ProductCard } from '@/components/ProductCard';
import { StoreComparisonSummary } from '@/components/StoreComparisonSummary';
import { SideBySideView } from '@/components/SideBySideView';
import { Product, StoreId, SearchResponse, ExchangeRateInfo } from '@/lib/types';
import {
  ArrowUpDown,
  LayoutGrid,
  Columns,
  Search,
  AlertCircle,
} from 'lucide-react';

export default function HomePage() {
  const [query, setQuery] = useState('Harina PAN');
  const [currency, setCurrency] = useState<'USD' | 'VES'>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(840.0);
  const [rateInfo, setRateInfo] = useState<ExchangeRateInfo | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState(true);

  const [selectedStores, setSelectedStores] = useState<StoreId[]>([
    'central',
    'gama',
    'plazas',
    'kalea',
    'farmatodo',
    'riomarket',
  ]);

  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'relevance'>('price-asc');
  const [viewMode, setViewMode] = useState<'grid' | 'columns'>('grid');

  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial BCV exchange rate
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

  // Perform search
  const performSearch = useCallback(
    async (searchQuery: string, stores: StoreId[], sort: string) => {
      if (!searchQuery.trim()) {
        setResults(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          q: searchQuery,
          stores: stores.join(','),
          sortBy: sort,
        });

        const res = await fetch(`/api/search?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Error en búsqueda (${res.status})`);
        }

        const data: SearchResponse = await res.json();
        setResults(data);
        if (data.exchangeRate > 0) {
          setExchangeRate(data.exchangeRate);
        }
      } catch (err: any) {
        console.error('Search failed:', err);
        setError(err.message || 'Ocurrió un error al buscar los productos.');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Trigger initial search
  useEffect(() => {
    performSearch(query, selectedStores, sortBy);
  }, []);

  const handleSearchSubmit = (newQuery: string) => {
    setQuery(newQuery);
    performSearch(newQuery, selectedStores, sortBy);
  };

  const handleToggleStore = (storeId: StoreId) => {
    let updated: StoreId[];
    if (selectedStores.includes(storeId)) {
      if (selectedStores.length === 1) return; // keep at least one
      updated = selectedStores.filter((id) => id !== storeId);
    } else {
      updated = [...selectedStores, storeId];
    }
    setSelectedStores(updated);
    performSearch(query, updated, sortBy);
  };

  const handleSelectAllStores = () => {
    const all: StoreId[] = ['central', 'gama', 'plazas', 'kalea', 'farmatodo', 'riomarket'];
    setSelectedStores(all);
    performSearch(query, all, sortBy);
  };

  const handleClearAllStores = () => {
    const single: StoreId[] = ['central'];
    setSelectedStores(single);
    performSearch(query, single, sortBy);
  };

  const handleSortChange = (newSort: 'price-asc' | 'price-desc' | 'relevance') => {
    setSortBy(newSort);
    performSearch(query, selectedStores, newSort);
  };

  const toggleCurrency = () => {
    setCurrency((prev) => (prev === 'USD' ? 'VES' : 'USD'));
  };

  const products = results?.products || [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Navbar */}
      <Navbar
        currency={currency}
        onToggleCurrency={toggleCurrency}
        exchangeRate={exchangeRate}
        rateSource={rateInfo?.source}
        isLoadingRate={isLoadingRate}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Mode switcher: buscar 1 producto vs. lista de compras */}
        <div className="max-w-2xl mx-auto w-full">
          <ModeSwitcher />
        </div>

        {/* Hero & Search Header */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="max-w-2xl mx-auto text-center space-y-1.5 mb-5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Busca un producto y compara su precio
            </h1>
            <p className="text-sm text-slate-500">
              Entre Central Madeirense, Gama, Plaza&apos;s, Kalea y Farmatodo, con IVA incluido.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <SearchBar
              query={query}
              onSearch={handleSearchSubmit}
              isLoading={isLoading}
            />
          </div>
        </section>

        {/* Store Filters */}
        <StoreFilter
          selectedStores={selectedStores}
          onToggleStore={handleToggleStore}
          onSelectAll={handleSelectAllStores}
          onClearAll={handleClearAllStores}
          storeCounts={results?.storeCounts || { central: 0, gama: 0, plazas: 0, kalea: 0, farmatodo: 0, riomarket: 0 }}
          storeErrors={results?.errors}
        />

        {/* Results summary or best price card */}
        {results && products.length > 0 && (
          <div className="animate-fade-in-up">
            <StoreComparisonSummary products={products} currency={currency} />
          </div>
        )}

        {/* Controls Bar: Sort & View Toggle */}
        {results && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <span className="font-bold text-slate-900 text-sm">
                {products.length} {products.length === 1 ? 'producto encontrado' : 'productos encontrados'}
              </span>
              <span>para &quot;{query}&quot;</span>
            </div>

            <div className="flex items-center space-x-2.5">
              {/* Sort selector */}
              <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-500 hidden sm:inline">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as any)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="price-asc">Menor precio primero</option>
                  <option value="price-desc">Mayor precio primero</option>
                  <option value="relevance">Relevancia</option>
                </select>
              </div>

              {/* View Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Vista en cuadrícula ordenada"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">General</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('columns')}
                  className={`p-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors ${
                    viewMode === 'columns'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Vista en columnas por supermercado"
                >
                  <Columns className="w-4 h-4" />
                  <span className="hidden sm:inline">Por Tienda</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 animate-pulse"
              >
                <div className="h-5 bg-slate-200 rounded-md w-1/3" />
                <div className="h-40 bg-slate-100 rounded-xl w-full" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <div className="h-6 bg-slate-200 rounded w-1/3" />
                  <div className="h-8 bg-slate-200 rounded-xl w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error message */}
        {error && !isLoading && (
          <div className="animate-fade-in-up bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center space-x-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">No se pudieron cargar algunos resultados</p>
              <p className="text-xs text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Results Grid / Columns */}
        {!isLoading && results && products.length > 0 && (
          <div className="animate-fade-in-up">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    currency={currency}
                    rank={idx + 1}
                    isCheapest={idx === 0 && sortBy === 'price-asc'}
                  />
                ))}
              </div>
            ) : (
              <SideBySideView
                products={products}
                selectedStores={selectedStores}
                currency={currency}
              />
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && results && products.length === 0 && (
          <div className="animate-fade-in-up bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">
              No se encontraron productos
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No encontramos coincidencias para &quot;{query}&quot; en los supermercados seleccionados. Intenta con un término más general (por ejemplo: &quot;harina&quot;, &quot;arroz&quot;, &quot;leche 1L&quot;).
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700">
            Mercadata VZLA — Comparador de Precios de Supermercados
          </p>
          <p className="text-slate-400">
            Precios y disponibilidad obtenidos en tiempo real de Central Madeirense, Gama, Plaza&apos;s, Kalea y Farmatodo.
          </p>
        </div>
      </footer>
    </div>
  );
}
