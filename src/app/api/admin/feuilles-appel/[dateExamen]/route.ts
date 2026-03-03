import { NextRequest, NextResponse } from 'next/server';
import { getExamensByDate, archiveExamensByDate } from '@/lib/data/examens';
import { getAllInscriptions } from '@/lib/data/inscriptions';
import { getSessionUser } from '@/lib/auth/session';
import type { FeuilleAppelExamen, FeuilleAppelSummary } from '@/types/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dateExamen: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { dateExamen } = await params;
    const isCommercial = user.role === 'commercial';
    const userLieu = user.lieu;

    const [allExamens, allInscriptions] = await Promise.all([
      getExamensByDate(dateExamen),
      getAllInscriptions(),
    ]);

    // Filtrage par lieu pour les commerciaux
    const examens = (isCommercial && userLieu)
      ? allExamens.filter((ex) => ex.lieu === userLieu)
      : allExamens;

    if (examens.length === 0) {
      return NextResponse.json(
        { error: 'Aucun examen trouvé pour cette date' },
        { status: 404 }
      );
    }

    // emailToInscriptionId map
    const emailToInscriptionId = new Map<string, number>();
    for (const ins of allInscriptions) {
      if (ins.email) {
        emailToInscriptionId.set(ins.email.toLowerCase(), ins.rowIndex);
      }
    }

    // Deadline = dateExamen + 1 jour à 15:30
    const deadlineDate = new Date(dateExamen + 'T15:30:00');
    deadlineDate.setDate(deadlineDate.getDate() + 1);
    const deadlineIso = `${deadlineDate.toISOString().split('T')[0]}T15:30:00+01:00`;

    const feuilleExamens: FeuilleAppelExamen[] = examens.map((ex) => ({
      id: ex.id,
      nom: ex.nom,
      prenom: ex.prenom,
      email: ex.email,
      telephone: ex.telephone,
      diplome: ex.diplome,
      dateExamen: ex.dateExamen!,
      heureExamen: ex.heureExamen,
      resultat: ex.resultat as FeuilleAppelExamen['resultat'],
      lieu: ex.lieu,
      inscriptionId: emailToInscriptionId.get(ex.email.toLowerCase()) || null,
    }));

    // Summary
    let reussi = 0, echoue = 0, absent = 0, aVenir = 0;
    for (const ex of feuilleExamens) {
      if (ex.resultat === 'reussi') reussi++;
      else if (ex.resultat === 'echoue') echoue++;
      else if (ex.resultat === 'absent') absent++;
      else aVenir++;
    }

    const summary: FeuilleAppelSummary = {
      dateExamen,
      totalCandidats: feuilleExamens.length,
      reussi,
      echoue,
      absent,
      aVenir,
    };

    return NextResponse.json({
      examens: feuilleExamens,
      dateExamen,
      deadline: deadlineIso,
      summary,
    });
  } catch (error) {
    console.error('[Feuille-appel detail GET Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ dateExamen: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { dateExamen } = await params;
    const archived = await archiveExamensByDate(dateExamen);

    return NextResponse.json({ success: true, archived });
  } catch (error) {
    console.error('[Feuille-appel DELETE Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'archivage' },
      { status: 500 }
    );
  }
}
