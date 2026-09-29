'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  Loader2,
  SlidersHorizontal,
  Star,
  Store,
  Trophy,
  LayoutList,
} from 'lucide-react';
import { ListItemMatch, Product, ShoppingListItem, StoreId } from '@/lib/types';
import { STORES } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import { computeStoreTotals, cheapestElsewhere, pickForStore } from '@/lib/listTotals';
import { evaluateProductMatch } from '@/lib/searchMatcher';
import { isRefined, itemLabel } from '@/lib/shoppingList';
import { ProductThumb } from './ProductThumb';

interface ListResultsProps {
  items: ShoppingListItem[];
  /** Result per item id, only for items whose result matches their current query. */
  results: Record<string, ListItemMatch>;
  stores: StoreId[];
  favoriteStore: StoreId | null;
  loadingIds: Set<string>;
  currency: 'USD' | 'VES';
  onRefine: (item: ShoppingListItem, product: Product) => void;
  onEdit: (item: ShoppingListItem) => void;
}

type ViewMode = 'store' | 'item';

export function ListResults({
  items,
  results,
  stores,
  favoriteStore,
  loadingIds,
  currency,
  onRefine,
  onEdit,
}: ListResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('store');

  // Quantity lives on the list item, so changing it updates totals without
  // searching again.
  const rows = useMemo(
    () =>
      items.map((item) => ({
        item,
        result: results[item.id] ? { ...results[item.id], quantity: item.quantity } : undefined,
      })),
    [items, results]
  );

  const { storeTotals, cheapestStoreId } = useMemo(
    () =>
      computeStoreTotals(
        rows.flatMap((r) => (r.result ? [r.result] : [])),
        stores
      ),
    [rows, stores]
  );

  // Favorite first, then the most complete and cheapest stores.
  const orderedTotals = useMemo(
    () =>
      [...storeTotals].sort((a, b) => {
        if (a.store === favoriteStore) return -1;
        if (b.store === favoriteStore) return 1;
        return b.foundCount - a.foundCount || a.totalUsd - b.totalUsd;
      }),
    [storeTotals, favoriteStore]
  );
  const orderedStores = orderedTotals.map((t) => t.store);

  const [activeStore, setActiveStore] = useState<StoreId | null>(null);
  useEffect(() => {
    if (!activeStore || !stores.includes(activeStore)) {
      setActiveStore(
        favoriteStore && stores.includes(favoriteStore) ? favoriteStore : cheapestStoreId ?? stores[0] ?? null
      );
    }
  }, [activeStore, stores, favoriteStore, cheapestStoreId]);

  const money = (usd: number, ves: number) => formatCurrency(currency === 'USD' ? usd : ves, currency);

  return (
    <section className="space-y-4">
      {/* Store totals: swipeable chips that also act as tabs */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-900 text-lg">¿Dónde lo consigo?</h2>
        <span
          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200"
          title="Los precios se consultan en vivo directamente en la página web de cada tienda"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          En vivo
        </span>
      </div>

      <div className="-mx-4 px-4 flex gap-2.5 overflow-x-auto snap-x snap-mandatory pb-1 [scrollbar-width:none]">
        {orderedTotals.map((t) => {
          const isActive = viewMode === 'store' && t.store === activeStore;
          const isCheapest = t.store === cheapestStoreId;
          const isFavorite = t.store === favoriteStore;
          return (
            <button
              key={t.store}
              type="button"
              onClick={() => {
                setActiveStore(t.store);
                setViewMode('store');
              }}
              className={`snap-start shrink-0 w-40 text-left rounded-2xl p-3 border-2 transition-all ${
                isActive
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-1 min-h-[16px]">
                {isFavorite && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                {isCheapest && (
                  <span className="flex items-center gap-0.5 text-[10px] font-black uppercase text-green-700">
                    <Trophy className="w-3 h-3" /> Más barata
                  </span>
                )}
              </div>
              <p className="font-bold text-slate-900 text-sm truncate">{STORES[t.store].shortName}</p>
              <p className="text-lg font-black text-slate-900 leading-tight">
                {t.foundCount > 0 ? money(t.totalUsd, t.totalVes) : '—'}
              </p>
              <p
                className={`text-[11px] font-semibold ${
                  t.foundCount === t.totalCount ? 'text-green-700' : 'text-amber-600'
                }`}
              >
                {t.foundCount}/{t.totalCount} productos
              </p>
            </button>
          );
        })}
      </div>

      {/* View switch */}
      <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-sm font-bold">
        <button
          type="button"
          onClick={() => setViewMode('store')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg ${
            viewMode === 'store' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500'
          }`}
        >
          <Store className="w-4 h-4" /> Por supermercado
        </button>
        <button
          type="button"
          onClick={() => setViewMode('item')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg ${
            viewMode === 'item' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500'
          }`}
        >
          <LayoutList className="w-4 h-4" /> Por producto
        </button>
      </div>

      {viewMode === 'store' && activeStore && (
        <ul className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-xs">
          {rows.map(({ item, result }) => {
            const product = result && pickForStore(result, activeStore);
            const alternative = result && !product ? cheapestElsewhere(result, stores, activeStore) : undefined;
            return (
              <li key={item.id} className="p-3.5">
                <ItemHeader item={item} onEdit={onEdit} loading={loadingIds.has(item.id)} />
                {!result ? (
                  <PendingRow loading={loadingIds.has(item.id)} />
                ) : product ? (
                  <ProductRow
                    product={product}
                    item={item}
                    query={result.query}
                    money={money}
                    onRefine={onRefine}
                  />
                ) : (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="w-16 h-16 shrink-0 rounded-xl bg-slate-50 border border-dashed border-slate-300" />
                    <div className="text-sm">
                      <p className="font-semibold text-slate-500">No lo encontramos aquí</p>
                      {alternative ? (
                        <button
                          type="button"
                          onClick={() => setActiveStore(alternative.store)}
                          className="text-blue-700 font-semibold text-left underline-offset-2 hover:underline"
                        >
                          Lo consigues en {STORES[alternative.store].shortName} a{' '}
                          {money(alternative.priceUsd, alternative.priceVes)}
                        </button>
                      ) : (
                        <p className="text-slate-400">Ninguna tienda lo tiene disponible</p>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {viewMode === 'item' && (
        <div className="space-y-3">
          {rows.map(({ item, result }) => {
            const found = result
              ? orderedStores
                  .map((store) => pickForStore(result, store))
                  .filter((p): p is Product => Boolean(p))
              : [];
            const minPrice = found.length > 0 ? Math.min(...found.map((p) => p.priceUsd)) : null;
            return (
              <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
                <ItemHeader item={item} onEdit={onEdit} loading={loadingIds.has(item.id)} />
                {!result ? (
                  <PendingRow loading={loadingIds.has(item.id)} />
                ) : found.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-400">Ninguna tienda lo tiene disponible.</p>
                ) : (
                  <div className="-mx-3.5 px-3.5 mt-2 flex gap-2.5 overflow-x-auto snap-x snap-mandatory pb-1 [scrollbar-width:none]">
                    {found.map((p) => (
                      <StoreProductCard
                        key={p.store}
                        product={p}
                        item={item}
                        query={result.query}
                        isCheapest={p.priceUsd === minPrice}
                        isFavorite={p.store === favoriteStore}
                        money={money}
                        onRefine={onRefine}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

type Money = (usd: number, ves: number) => string;

function ItemHeader({
  item,
  onEdit,
  loading,
}: {
  item: ShoppingListItem;
  onEdit: (item: ShoppingListItem) => void;
  loading: boolean;
}) {
  return (
    <button type="button" onClick={() => onEdit(item)} className="w-full flex items-center gap-2 text-left">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide truncate">
        {item.quantity > 1 && <span className="text-blue-700">{item.quantity}× </span>}
        {itemLabel(item)}
      </span>
      {!isRefined(item) && (
        <span className="shrink-0 text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
          Sin afinar
        </span>
      )}
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />}
    </button>
  );
}

function PendingRow({ loading }: { loading: boolean }) {
  return (
    <p className="mt-2 text-sm text-slate-400">
      {loading ? 'Buscando en las tiendas…' : 'Pendiente: toca "Comparar precios".'}
    </p>
  );
}

/**
 * The results fall back to partial matches when nothing matches strictly,
 * so a product can differ from what the user asked for; flag those.
 */
function MismatchNote({ product, query }: { product: Product; query: string }) {
  if (evaluateProductMatch(product, query).matches) return null;
  return (
    <p className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 mt-1">
      <AlertTriangle className="w-3 h-3 shrink-0" /> Puede no ser la misma marca o tamaño
    </p>
  );
}

function ProductRow({
  product,
  item,
  query,
  money,
  onRefine,
}: {
  product: Product;
  item: ShoppingListItem;
  query: string;
  money: Money;
  onRefine: (item: ShoppingListItem, product: Product) => void;
}) {
  return (
    <div className="mt-2 flex gap-3">
      <a href={product.productUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
        <ProductThumb src={product.imageUrl} alt={product.name} />
      </a>
      <div className="min-w-0 flex-1">
        <a
          href={product.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-slate-900 leading-snug hover:text-blue-700"
        >
          {product.name}
          <ExternalLink className="inline w-3 h-3 ml-1 opacity-50 align-baseline" />
        </a>
        <MismatchNote product={product} query={query} />
        <div className="flex items-end justify-between gap-2 mt-1">
          <div>
            <p className="text-base font-black text-slate-900">
              {money(product.priceUsd * item.quantity, product.priceVes * item.quantity)}
            </p>
            {item.quantity > 1 && (
              <p className="text-[11px] text-slate-500">
                {money(product.priceUsd, product.priceVes)} c/u
              </p>
            )}
          </div>
          <RefineButton onClick={() => onRefine(item, product)} />
        </div>
      </div>
    </div>
  );
}

function StoreProductCard({
  product,
  item,
  query,
  isCheapest,
  isFavorite,
  money,
  onRefine,
}: {
  product: Product;
  item: ShoppingListItem;
  query: string;
  isCheapest: boolean;
  isFavorite: boolean;
  money: Money;
  onRefine: (item: ShoppingListItem, product: Product) => void;
}) {
  return (
    <div
      className={`snap-start shrink-0 w-44 rounded-2xl border-2 p-2.5 flex flex-col ${
        isCheapest ? 'border-green-400 bg-green-50/50' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
        {isFavorite && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
        <span className="truncate">{STORES[product.store].shortName}</span>
        {isCheapest && <Trophy className="w-3 h-3 text-green-700 ml-auto shrink-0" />}
      </div>
      <a href={product.productUrl} target="_blank" rel="noopener noreferrer" className="mt-1.5">
        <ProductThumb src={product.imageUrl} alt={product.name} className="w-full h-28" />
      </a>
      <p className="text-xs font-semibold text-slate-800 leading-snug mt-1.5 flex-1">{product.name}</p>
      <MismatchNote product={product} query={query} />
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-sm font-black text-slate-900">
          {money(product.priceUsd * item.quantity, product.priceVes * item.quantity)}
        </p>
        <RefineButton onClick={() => onRefine(item, product)} compact />
      </div>
    </div>
  );
}

function RefineButton({ onClick, compact }: { onClick: () => void; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-lg active:scale-95"
      title="Usar la marca y presentación de este producto para tu lista"
    >
      <SlidersHorizontal className="w-3.5 h-3.5" />
      {compact ? 'Usar' : 'Usar este'}
    </button>
  );
}
