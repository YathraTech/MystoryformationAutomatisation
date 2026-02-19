import { NextRequest, NextResponse } from 'next/server';
import { getAllTimeSlots, createTimeSlot } from '@/lib/data/exam-time-slots';

export async function GET() {
  try {
    const slots = await getAllTimeSlots();
    return NextResponse.json({ slots });
  } catch (error) {
    console.error('[Exam Time Slots GET Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des créneaux' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { label, jour, heure, actif } = body;

    if (!label || !jour || !heure) {
      return NextResponse.json(
        { error: 'Label, jour et heure sont requis' },
        { status: 400 }
      );
    }

    const slot = await createTimeSlot({
      label,
      jour,
      heure,
      actif: actif ?? true,
    });

    return NextResponse.json({ slot }, { status: 201 });
  } catch (error) {
    console.error('[Exam Time Slots POST Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du créneau' },
      { status: 500 }
    );
  }
}
