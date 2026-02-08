import { NextResponse } from 'next/server';
import { getAllInscriptions } from '@/lib/data/inscriptions';

export async function GET() {
  try {
    const inscriptions = await getAllInscriptions();
    return NextResponse.json({ inscriptions });
  } catch (error) {
    console.error('Error fetching inscriptions:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des inscriptions' },
      { status: 500 }
    );
  }
}
