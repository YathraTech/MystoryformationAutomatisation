import { NextResponse } from 'next/server';
import {
  getExamTypeOptions,
  addOptionToExamType,
  removeOptionFromExamType,
  setExamTypeOptions,
} from '@/lib/data/exam-type-options';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Récupérer les options associées à un type d'examen
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const options = await getExamTypeOptions(parseInt(id, 10));
    return NextResponse.json({ options });
  } catch (error) {
    console.error('Error fetching exam type options:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des options' },
      { status: 500 }
    );
  }
}

// POST: Ajouter une option à un type d'examen
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { examOptionId, ordre } = body;

    if (!examOptionId) {
      return NextResponse.json(
        { error: 'examOptionId est requis' },
        { status: 400 }
      );
    }

    const option = await addOptionToExamType(
      parseInt(id, 10),
      examOptionId,
      ordre
    );

    return NextResponse.json({ option }, { status: 201 });
  } catch (error) {
    console.error('Error adding option to exam type:', error);
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'ajout';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT: Remplacer toutes les options d'un type d'examen
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { optionIds } = body;

    if (!Array.isArray(optionIds)) {
      return NextResponse.json(
        { error: 'optionIds doit être un tableau' },
        { status: 400 }
      );
    }

    await setExamTypeOptions(parseInt(id, 10), optionIds);
    const options = await getExamTypeOptions(parseInt(id, 10));

    return NextResponse.json({ options });
  } catch (error) {
    console.error('Error setting exam type options:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des options' },
      { status: 500 }
    );
  }
}

// DELETE: Supprimer une option d'un type d'examen
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const examOptionId = searchParams.get('examOptionId');

    if (!examOptionId) {
      return NextResponse.json(
        { error: 'examOptionId est requis' },
        { status: 400 }
      );
    }

    await removeOptionFromExamType(
      parseInt(id, 10),
      parseInt(examOptionId, 10)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing option from exam type:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
