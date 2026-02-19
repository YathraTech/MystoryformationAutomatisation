import { NextRequest, NextResponse } from 'next/server';
import {
  getTimeSlotById,
  updateTimeSlot,
  deleteTimeSlot,
} from '@/lib/data/exam-time-slots';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const slot = await getTimeSlotById(parseInt(id, 10));

    if (!slot) {
      return NextResponse.json(
        { error: 'Créneau non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ slot });
  } catch (error) {
    console.error('[Exam Time Slot GET Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement du créneau' },
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

    const slot = await updateTimeSlot(parseInt(id, 10), {
      label: body.label,
      jour: body.jour,
      heure: body.heure,
      actif: body.actif,
    });

    return NextResponse.json({ slot });
  } catch (error) {
    console.error('[Exam Time Slot PATCH Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du créneau' },
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
    await deleteTimeSlot(parseInt(id, 10));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Exam Time Slot DELETE Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du créneau' },
      { status: 500 }
    );
  }
}
