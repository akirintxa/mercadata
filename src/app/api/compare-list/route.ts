import { NextRequest, NextResponse } from 'next/server';
import { compareShoppingList } from '@/lib/scrapers/compareList';
import { StoreId } from '@/lib/types';

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

  if (!items.every((i) => typeof i === 'string')) {
    return NextResponse.json(
      { error: 'Cada elemento de "items" debe ser un texto' },
      { status: 400 }
    );
  }

  const stores: StoreId[] | undefined = Array.isArray(body?.stores)
    ? (body.stores.filter((s: unknown) => typeof s === 'string') as StoreId[])
    : undefined;

  try {
    const result = await compareShoppingList(items, { stores });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Compare-list API error:', err);
    return NextResponse.json(
      { error: 'Failed to compare shopping list', details: err.message },
      { status: 500 }
    );
  }
}
