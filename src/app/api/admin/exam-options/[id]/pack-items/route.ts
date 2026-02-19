import { NextRequest, NextResponse } from 'next/server';
import { getPackItems, setPackItems } from '@/lib/data/exam-options';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const items = await getPackItems(parseInt(id, 10));
    return NextResponse.json({ items });
  } catch (error) {
    console.error('[Pack Items GET Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des éléments du pack' },
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

    const { optionIds } = body;

    if (!Array.isArray(optionIds)) {
      return NextResponse.json(
        { error: 'optionIds doit être un tableau' },
        { status: 400 }
      );
    }

    await setPackItems(parseInt(id, 10), optionIds);

    const items = await getPackItems(parseInt(id, 10));
    return NextResponse.json({ items });
  } catch (error) {
    console.error('[Pack Items PUT Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des éléments du pack' },
      { status: 500 }
    );
  }
}
