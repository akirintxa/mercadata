'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, Sparkles } from 'lucide-react';
import { POPULAR_SEARCHES } from '@/lib/constants';

interface SearchBarProps {
  query: string;
  onSearch: (q: string) => void;
  isLoading: boolean;
}

export function SearchBar({ query, onSearch, isLoading }: SearchBarProps) {
  const [inputValue, setInputValue] = useState(query);

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue.trim());
    }
  };

  const handleClear = () => {
    setInputValue('');
  };

  const handleQuickSearch = (term: string) => {
    setInputValue(term);
    onSearch(term);
  };

  return (
    <div className="w-full space-y-3">
      {/* Search Input Form */}
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-slate-400 pointer-events-none">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="¿Qué producto buscas? Ej: Leche 1L, Harina PAN, Coca Cola 1lt, Nutella..."
            className="w-full pl-12 pr-28 py-3.5 bg-white border-2 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-base shadow-xs focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
          />
          <div className="absolute right-2.5 flex items-center space-x-1.5">
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                title="Borrar texto"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95"
            >
              Buscar
            </button>
          </div>
        </div>
      </form>

      {/* Popular quick searches */}
      <div className="flex items-center flex-wrap gap-1.5 pt-1">
        <div className="flex items-center text-xs font-bold text-slate-500 mr-1">
          <Sparkles className="w-3.5 h-3.5 mr-1 text-orange-500" />
          <span>Frecuentes:</span>
        </div>
        {POPULAR_SEARCHES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => handleQuickSearch(item)}
            className="text-xs bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200 transition-all shadow-2xs font-medium"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
