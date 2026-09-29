'use client';

import React, { useState } from 'react';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { Product, ShoppingListItem } from '@/lib/types';
import { STORES } from '@/lib/constants';
import { extractPresentation } from '@/lib/searchMatcher';
import { MAX_QUANTITY } from '@/lib/shoppingList';
import { ProductThumb } from './ProductThumb';

export interface ItemFields {
  name: string;
  brand?: string;
  presentation?: string;
  quantity: number;
}

interface ItemEditSheetProps {
  /** The item being edited (always set: new items are created before refining). */
  item: ShoppingListItem;
  /** A concrete product the user tapped to refine the item from. */
  reference?: Product;
  onSave: (fields: ItemFields) => void;
  onDelete: () => void;
  onClose: () => void;
}

/**
 * Gama's connector fills `brand` with the product category, not the real
 * brand, so it isn't used to prefill a refinement.
 */
function referenceBrand(product: Product): string | undefined {
  return product.store === 'gama' ? undefined : product.brand;
}

/** Bottom sheet to edit an item's name, brand, presentation and quantity. */
export function ItemEditSheet({ item, reference, onSave, onDelete, onClose }: ItemEditSheetProps) {
  const [name, setName] = useState(item.name);
  const [brand, setBrand] = useState(
    (reference && referenceBrand(reference)) ?? item.brand ?? ''
  );
  const [presentation, setPresentation] = useState(
    (reference &&
      extractPresentation(`${reference.name} ${reference.presentation ?? ''}`)) ??
      item.presentation ??
      ''
  );
  const [quantity, setQuantity] = useState(item.quantity);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      brand: brand.trim() || undefined,
      presentation: presentation.trim() || undefined,
      quantity,
    });
  };

  const inputClass =
    'w-full px-3.5 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-lg">
            {reference ? 'Afinar con este producto' : 'Editar producto'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-slate-100 text-slate-500"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {reference && (
          <div className="flex gap-3 items-center bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <ProductThumb src={reference.imageUrl} alt={reference.name} />
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">
                {STORES[reference.store].shortName}
              </p>
              <p className="text-sm font-semibold text-slate-800 leading-snug">{reference.name}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Revisa que la marca y la presentación coincidan con este nombre.
              </p>
            </div>
          </div>
        )}

        <label className="block space-y-1">
          <span className="text-xs font-bold text-slate-600">Producto</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Leche descremada"
            className={inputClass}
            required
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-600">Marca</span>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Cualquiera"
              className={inputClass}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-600">Presentación</span>
            <input
              value={presentation}
              onChange={(e) => setPresentation(e.target.value)}
              placeholder="Ej: 1L, 900g"
              className={inputClass}
            />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">Cantidad</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-11 h-11 rounded-xl border-2 border-slate-200 flex items-center justify-center text-slate-700 active:scale-95"
              aria-label="Menos"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-bold text-lg">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
              className="w-11 h-11 rounded-xl border-2 border-slate-200 flex items-center justify-center text-slate-700 active:scale-95"
              aria-label="Más"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onDelete}
            className="p-3 rounded-xl border-2 border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200"
            aria-label="Quitar de la lista"
            title="Quitar de la lista"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl text-base font-bold active:scale-[0.98]"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
