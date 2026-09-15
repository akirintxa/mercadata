import { NextRequest, NextResponse } from 'next/server';
import { searchAllStores } from '@/lib/scrapers';
import { StoreId } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const storesParam = searchParams.get('stores');
  const sortByParam = searchParams.get('sortBy') as 'price-asc' | 'price-desc' | 'relevance' | null;

  const stores = storesParam
    ? (storesParam.split(',').filter(Boolean) as StoreId[])
    : undefined;

  try {
    const result = await searchAllStores(q, {
      stores,
      sortBy: sortByParam || 'price-asc',
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Search API error:', err);
    return NextResponse.json(
      { error: 'Failed to perform search', details: err.message },
      { status: 500 }
    );
  }
}
