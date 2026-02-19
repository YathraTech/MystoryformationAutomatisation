import { NextResponse } from 'next/server';
import { getExamTypeOptions } from '@/lib/data/exam-type-options';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Récupérer les options associées à un type d'examen (public)
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const options = await getExamTypeOptions(parseInt(id, 10));

    // Extraire seulement les examOptions
    const examOptions = options
      .filter((o) => o.examOption)
      .map((o) => o.examOption);

    return NextResponse.json({ options: examOptions });
  } catch (error) {
    console.error('Error fetching exam type options:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des options' },
      { status: 500 }
    );
  }
}
