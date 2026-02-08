import { NextResponse } from 'next/server';
import { getInscriptionById, updateInscriptionStatus, updateBadge, updateInscriptionFields } from '@/lib/data/inscriptions';
import { statusUpdateSchema, badgeUpdateSchema } from '@/lib/validations/admin.schema';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rowIndex = parseInt(id, 10);

    if (isNaN(rowIndex)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const inscription = await getInscriptionById(rowIndex);

    if (!inscription) {
      return NextResponse.json(
        { error: 'Inscription non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({ inscription });
  } catch (error) {
    console.error('Error fetching inscription:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Try status update
    const statusResult = statusUpdateSchema.safeParse(body);
    if (statusResult.success) {
      await updateInscriptionStatus(rowIndex, statusResult.data.statut);
      return NextResponse.json({ success: true });
    }

    // Try badge update
    const badgeResult = badgeUpdateSchema.safeParse(body);
    if (badgeResult.success) {
      await updateBadge(rowIndex, badgeResult.data.badge, badgeResult.data.color);
      return NextResponse.json({ success: true });
    }

    // Try fields update (general update)
    if (body.fields && typeof body.fields === 'object') {
      await updateInscriptionFields(rowIndex, body.fields);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Données invalides' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating inscription:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}
