import { NextResponse } from 'next/server';
import { getExamTypeById, updateExamType, deleteExamType } from '@/lib/data/exam-types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const examType = await getExamTypeById(parseInt(id, 10));

    if (!examType) {
      return NextResponse.json(
        { error: 'Type d\'examen non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ type: examType });
  } catch (error) {
    console.error('Error fetching exam type:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement du type d\'examen' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { code, label, description, icon, color, visible, ordre } = body;

    const examType = await updateExamType(parseInt(id, 10), {
      code,
      label,
      description,
      icon,
      color,
      visible,
      ordre,
    });

    return NextResponse.json({ type: examType });
  } catch (error) {
    console.error('Error updating exam type:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du type d\'examen' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    await deleteExamType(parseInt(id, 10));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exam type:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du type d\'examen' },
      { status: 500 }
    );
  }
}
