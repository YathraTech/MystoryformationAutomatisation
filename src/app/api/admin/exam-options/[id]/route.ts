import { NextRequest, NextResponse } from 'next/server';
import {
  getExamOptionById,
  updateExamOption,
  deleteExamOption,
  getPackItems,
  getOptionTimeSlots,
} from '@/lib/data/exam-options';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const option = await getExamOptionById(parseInt(id, 10));

    if (!option) {
      return NextResponse.json(
        { error: 'Option non trouvée' },
        { status: 404 }
      );
    }

    // Load related data
    if (option.estPack) {
      option.packItems = await getPackItems(option.id);
    }
    option.timeSlots = await getOptionTimeSlots(option.id);

    return NextResponse.json({ option });
  } catch (error) {
    console.error('[Exam Option GET Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement de l\'option' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const option = await updateExamOption(parseInt(id, 10), {
      code: body.code,
      label: body.label,
      description: body.description,
      categorie: body.categorie,
      estPack: body.estPack,
      visiblePublic: body.visiblePublic,
      ordre: body.ordre,
    });

    return NextResponse.json({ option });
  } catch (error) {
    console.error('[Exam Option PATCH Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'option' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteExamOption(parseInt(id, 10));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Exam Option DELETE Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'option' },
      { status: 500 }
    );
  }
}
