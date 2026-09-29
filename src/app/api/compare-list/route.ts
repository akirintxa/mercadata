import { NextRequest, NextResponse } from 'next/server';
import { compareShoppingList } from '@/lib/scrapers/compareList';
import { StoreId, CompareListItemRequest } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Cuerpo de solicitud inválido, se esperaba JSON' },
      { status: 400 }
    );
  }

  const items = body?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: 'Se requiere un arreglo "items" con al menos un producto' },
      { status: 400 }
    );
  }

  // Items are either plain strings (the original API) or
  // `{ id, query, quantity? }` objects (used by the refined shopping list).
  const parsed: CompareListItemRequest[] = [];
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    if (typeof item === 'string') {
      parsed.push({ id: `item-${index}`, query: item });
    } else if (
      item &&
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.query === 'string' &&
      (item.quantity === undefined || (typeof item.quantity === 'number' && item.quantity > 0))
    ) {
      parsed.push({ id: item.id, query: item.query, quantity: item.quantity });
    } else {
      return NextResponse.json(
        { error: 'Cada elemento de "items" debe ser un texto o un objeto { id, query, quantity? }' },
        { status: 400 }
      );
    }
  }

  const stores: StoreId[] | undefined = Array.isArray(body?.stores)
    ? (body.stores.filter((s: unknown) => typeof s === 'string') as StoreId[])
    : undefined;

  try {
    const result = await compareShoppingList(parsed, { stores });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Compare-list API error:', err);
    return NextResponse.json(
      { error: 'Failed to compare shopping list', details: err.message },
      { status: 500 }
    );
  }
}
