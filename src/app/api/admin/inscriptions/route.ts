import { NextResponse } from 'next/server';
import { getAllInscriptions } from '@/lib/data/inscriptions';
import { getSessionUser } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await getSessionUser();
    const isCommercial = user?.role === 'commercial';
    const userLieu = user?.lieu || null;

    let inscriptions = await getAllInscriptions();

    // Les commerciaux ne voient que les inscriptions de leur centre
    if (isCommercial && userLieu) {
      inscriptions = inscriptions.filter((ins) => ins.lieu === userLieu);
    }

    return NextResponse.json({ inscriptions });
  } catch (error) {
    console.error('Error fetching inscriptions:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des inscriptions' },
      { status: 500 }
    );
  }
}
