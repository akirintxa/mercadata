import { NextResponse } from 'next/server';
import { getExchangeRate } from '@/lib/scrapers/bcv';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rateInfo = await getExchangeRate();
    return NextResponse.json(rateInfo);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to fetch exchange rate', details: err.message },
      { status: 500 }
    );
  }
}
