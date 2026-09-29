'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ListChecks } from 'lucide-react';

const MODES = [
  { href: '/', icon: ListChecks, title: 'Mi lista' },
  { href: '/buscar', icon: Search, title: 'Buscar producto' },
] as const;

/** Compact segmented control between the shopping list and single search. */
export function ModeSwitcher() {
  const pathname = usePathname();

  return (
    <nav className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
      {MODES.map((mode) => {
        const isActive = pathname === mode.href;
        const Icon = mode.icon;
        return (
          <Link
            key={mode.href}
            href={mode.href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
              isActive ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {mode.title}
          </Link>
        );
      })}
    </nav>
  );
}
