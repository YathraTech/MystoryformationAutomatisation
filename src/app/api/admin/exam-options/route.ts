import { NextRequest, NextResponse } from 'next/server';
import {
  getExamOptionsWithPackItems,
  createExamOption,
  setOptionTimeSlots,
} from '@/lib/data/exam-options';

export async function GET() {
  try {
    const options = await getExamOptionsWithPackItems();
    return NextResponse.json({ options });
  } catch (error) {
    console.error('[Exam Options GET Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des options' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { code, label, description, categorie, estPack, visiblePublic, ordre, timeSlotIds } = body;

    if (!code || !label) {
      return NextResponse.json(
        { error: 'Code et label sont requis' },
        { status: 400 }
      );
    }

    const option = await createExamOption({
      code,
      label,
      description: description ?? null,
      categorie: categorie ?? null,
      estPack: estPack ?? false,
      visiblePublic: visiblePublic ?? true,
      ordre: ordre ?? 0,
    });

    // Associate time slots if provided
    if (timeSlotIds && Array.isArray(timeSlotIds)) {
      await setOptionTimeSlots(option.id, timeSlotIds);
    }

    return NextResponse.json({ option }, { status: 201 });
  } catch (error) {
    console.error('[Exam Options POST Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'option' },
      { status: 500 }
    );
  }
}
