import { NextRequest, NextResponse } from 'next/server';
import { getOptionTimeSlots, setOptionTimeSlots } from '@/lib/data/exam-options';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const slots = await getOptionTimeSlots(parseInt(id, 10));
    return NextResponse.json({ slots });
  } catch (error) {
    console.error('[Option Time Slots GET Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des créneaux' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { slotIds } = body;

    if (!Array.isArray(slotIds)) {
      return NextResponse.json(
        { error: 'slotIds doit être un tableau' },
        { status: 400 }
      );
    }

    await setOptionTimeSlots(parseInt(id, 10), slotIds);

    const slots = await getOptionTimeSlots(parseInt(id, 10));
    return NextResponse.json({ slots });
  } catch (error) {
    console.error('[Option Time Slots PUT Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des créneaux' },
      { status: 500 }
    );
  }
}
