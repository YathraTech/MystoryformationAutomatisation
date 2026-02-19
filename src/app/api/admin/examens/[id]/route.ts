import { NextRequest, NextResponse } from 'next/server';
import { getExamenById, updateExamenFields, archiveExamen, deleteExamen } from '@/lib/data/examens';
import { recalculateCaAfterExamenChange } from '@/lib/data/ca-mensuel';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const examen = await getExamenById(parseInt(id, 10));

    if (!examen) {
      return NextResponse.json({ error: 'Examen non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ examen });
  } catch (error) {
    console.error('[Examen GET Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement' },
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

    // Si action = archive, archiver l'examen
    if (body.action === 'archive') {
      await archiveExamen(parseInt(id, 10));
      return NextResponse.json({ success: true, message: 'Examen archivé' });
    }

    // Capturer l'état avant mise à jour (pour recalcul CA)
    const caFieldsChanging = body.prix !== undefined || body.commercialId !== undefined;
    const beforeExamen = caFieldsChanging
      ? await getExamenById(parseInt(id, 10))
      : null;

    // Mise à jour normale des champs
    await updateExamenFields(parseInt(id, 10), {
      dateExamen: body.dateExamen,
      heureExamen: body.heureExamen,
      resultat: body.resultat,
      prix: body.prix,
      moyenPaiement: body.moyenPaiement,
      formateurId: body.formateurId,
      typeExamen: body.typeExamen,
      lieu: body.lieu,
      remises: body.remises,
      distanciel: body.distanciel,
      datePaiement: body.datePaiement,
      lieuConfiguration: body.lieuConfiguration,
      commercialId: body.commercialId,
    });

    // Recalculer le CA mensuel si prix ou commercialId a changé
    if (caFieldsChanging && beforeExamen) {
      try {
        const afterExamen = await getExamenById(parseInt(id, 10));
        if (afterExamen) {
          await recalculateCaAfterExamenChange(
            afterExamen.createdAt,
            afterExamen.commercialId,
            beforeExamen.commercialId
          );
        }
      } catch (caError) {
        console.error('[CA Recalculation Error]', caError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Examen PATCH Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
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

    // Capturer avant suppression pour recalcul CA
    const examen = await getExamenById(parseInt(id, 10));

    await deleteExamen(parseInt(id, 10));

    // Recalculer le CA si l'examen supprimé contribuait au CA
    if (examen?.commercialId && examen.prix && examen.prix > 0) {
      try {
        await recalculateCaAfterExamenChange(
          examen.createdAt,
          null,
          examen.commercialId
        );
      } catch (caError) {
        console.error('[CA Recalculation Error on DELETE]', caError);
      }
    }

    return NextResponse.json({ success: true, message: 'Examen supprimé' });
  } catch (error) {
    console.error('[Examen DELETE Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
