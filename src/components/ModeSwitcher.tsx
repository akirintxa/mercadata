'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ListChecks, ArrowRight } from 'lucide-react';

const MODES = [
  {
    href: '/',
    icon: Search,
    title: 'Buscar un producto',
    description: 'Compara el precio de un solo producto entre las 5 tiendas',
  },
  {
    href: '/lista',
    icon: ListChecks,
    title: 'Lista de compras',
    description: 'Arma varios productos y te decimos dónde sale más barato en total',
  },
] as const;

export function ModeSwitcher() {
  const pathname = usePathname();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {MODES.map((mode) => {
        const isActive = pathname === mode.href;
        const Icon = mode.icon;

        return (
          <Link
            key={mode.href}
            href={mode.href}
            className={`group flex items-center gap-3.5 p-4 rounded-2xl border-2 transition-all ${
              isActive
                ? 'border-blue-500 bg-blue-50/70 shadow-sm'
                : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
            }`}
          >
            <div
              className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className={`text-sm font-bold ${
                  isActive ? 'text-blue-900' : 'text-slate-900'
                }`}
              >
                {mode.title}
              </h3>
              <p className="text-xs text-slate-500 leading-snug mt-0.5">
                {mode.description}
              </p>
            </div>
            {!isActive && (
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 shrink-0 transition-colors" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
