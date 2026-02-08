import { NextResponse } from 'next/server';
import { addRelance } from '@/lib/data/inscriptions';
import { relanceSchema } from '@/lib/validations/admin.schema';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rowIndex = parseInt(id, 10);

    if (isNaN(rowIndex)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const body = await request.json();
    const result = relanceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }

    await addRelance(rowIndex, result.data.note || '');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding relance:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la relance' },
      { status: 500 }
    );
  }
}
