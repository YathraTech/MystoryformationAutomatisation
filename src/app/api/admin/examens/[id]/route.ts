import { NextRequest, NextResponse } from 'next/server';
import { getExamenById, updateExamenFields, archiveExamen, deleteExamen } from '@/lib/data/examens';
import type { PdfVersion } from '@/lib/data/examens';
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

    // Champs de configuration dont le changement invalide les PDF
    const CONFIG_FIELDS = [
      'prix', 'dateExamen', 'heureExamen', 'lieu', 'moyenPaiement',
      'lieuConfiguration', 'commercialId', 'remises', 'distanciel', 'datePaiement',
    ] as const;

    const configFieldsChanging = CONFIG_FIELDS.some((f) => body[f] !== undefined);
    const caFieldsChanging = body.prix !== undefined || body.commercialId !== undefined;

    // Capturer l'état avant mise à jour (pour recalcul CA + reset PDF)
    const beforeExamen = (caFieldsChanging || configFieldsChanging)
      ? await getExamenById(parseInt(id, 10))
      : null;

    // Si des champs de configuration changent, archiver les anciens PDF au lieu de les supprimer
    let pdfResetFields: Record<string, null> = {};
    let pdfVersionsUpdate: PdfVersion[] | undefined;
    if (configFieldsChanging && beforeExamen) {
      const hasPdfs = beforeExamen.pdfConvocation || beforeExamen.pdfFicheInscription || beforeExamen.pdfAttestationPaiement;

      if (hasPdfs) {
        // Archiver les PDFs actuels dans pdf_versions
        const existingVersions: PdfVersion[] = beforeExamen.pdfVersions || [];
        const nextVersion = existingVersions.length > 0
          ? Math.max(...existingVersions.map(v => v.version)) + 1
          : 1;

        const newVersion: PdfVersion = {
          version: nextVersion,
          date: new Date().toISOString(),
          convocation: beforeExamen.pdfConvocation,
          ficheInscription: beforeExamen.pdfFicheInscription,
          attestationPaiement: beforeExamen.pdfAttestationPaiement,
        };

        pdfVersionsUpdate = [...existingVersions, newVersion];
      }

      pdfResetFields = {
        pdfAttestationPaiement: null,
        pdfFicheInscription: null,
        pdfConvocation: null,
      };
    }

    // Mise à jour normale des champs
    await updateExamenFields(parseInt(id, 10), {
      dateExamen: body.dateExamen,
      heureExamen: body.heureExamen,
      resultat: body.resultat,
      prix: body.prix,
      moyenPaiement: body.moyenPaiement,
      montantEspeces: body.montantEspeces,
      montantCb: body.montantCb,
      typeExamen: body.typeExamen,
      lieu: body.lieu,
      remises: body.remises,
      distanciel: body.distanciel,
      datePaiement: body.datePaiement,
      lieuConfiguration: body.lieuConfiguration,
      commercialId: body.commercialId,
      pdfAttestationPaiement: body.pdfAttestationPaiement,
      pdfFicheInscription: body.pdfFicheInscription,
      pdfConvocation: body.pdfConvocation,
      ...pdfResetFields,
      ...(pdfVersionsUpdate ? { pdfVersions: pdfVersionsUpdate } : {}),
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
