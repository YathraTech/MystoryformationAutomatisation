import { NextResponse } from 'next/server';
import { getVisibleExamTypes } from '@/lib/data/exam-types';

export async function GET() {
  try {
    const types = await getVisibleExamTypes();
    return NextResponse.json({ types });
  } catch (error) {
    console.error('Error fetching visible exam types:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des types d\'examens' },
      { status: 500 }
    );
  }
}
