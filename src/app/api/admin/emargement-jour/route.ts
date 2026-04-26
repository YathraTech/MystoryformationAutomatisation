import { NextRequest, NextResponse } from 'next/server';
import { getEmargementsForDate } from '@/lib/data/stagiaires-formation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    // Date locale Paris (format YYYY-MM-DD), faute de paramètre.
    const fallback = (() => {
      const now = new Date();
      const paris = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
      const y = paris.getFullYear();
      const m = String(paris.getMonth() + 1).padStart(2, '0');
      const d = String(paris.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    })();

    const date = dateParam || fallback;
    const entries = await getEmargementsForDate(date);
    return NextResponse.json({ date, entries });
  } catch (error) {
    console.error('[GET emargement-jour]', error);
    return NextResponse.json({ error: 'Erreur de chargement' }, { status: 500 });
  }
}
