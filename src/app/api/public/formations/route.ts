import { NextResponse } from 'next/server';
import { getAllFormations } from '@/lib/data/formations';

export async function GET() {
  try {
    const formations = await getAllFormations();
    return NextResponse.json({ formations });
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des formations' },
      { status: 500 }
    );
  }
}
