import { NextResponse } from 'next/server';
import { getAllExamens } from '@/lib/data/examens';
import { getAllInscriptions } from '@/lib/data/inscriptions';
import { getSessionUser } from '@/lib/auth/session';
import type { FeuilleAppelExamen, FeuilleAppelSummary } from '@/types/admin';

function computeSummary(examens: { resultat: string }[], dateExamen: string): FeuilleAppelSummary {
  let reussi = 0, echoue = 0, absent = 0, aVenir = 0;
  for (const ex of examens) {
    if (ex.resultat === 'reussi') reussi++;
    else if (ex.resultat === 'echoue') echoue++;
    else if (ex.resultat === 'absent') absent++;
    else aVenir++;
  }
  return { dateExamen, totalCandidats: examens.length, reussi, echoue, absent, aVenir };
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const isCommercial = user.role === 'commercial';
    const userLieu = user.lieu;

    const [allExamens, allInscriptions] = await Promise.all([
      getAllExamens(),
      getAllInscriptions(),
    ]);

    // Filtrage par lieu pour les commerciaux
    const examens = (isCommercial && userLieu)
      ? allExamens.filter((ex) => ex.lieu === userLieu)
      : allExamens;

    // Ne garder que les examens avec date_examen
    const examensWithDate = examens.filter((ex) => ex.dateExamen);

    // Grouper par date_examen
    const grouped = new Map<string, typeof examensWithDate>();
    for (const ex of examensWithDate) {
      const date = ex.dateExamen!;
      if (!grouped.has(date)) grouped.set(date, []);
      grouped.get(date)!.push(ex);
    }

    // emailToInscriptionId map
    const emailToInscriptionId = new Map<string, number>();
    for (const ins of allInscriptions) {
      if (ins.email) {
        emailToInscriptionId.set(ins.email.toLowerCase(), ins.rowIndex);
      }
    }

    // Calculer l'heure Paris actuelle
    const now = new Date();
    const parisNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const parisHour = parisNow.getHours();
    const parisMinute = parisNow.getMinutes();
    const parisTimeDecimal = parisHour + parisMinute / 60;

    const todayStr = parisNow.toISOString().split('T')[0];
    const yesterday = new Date(parisNow);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Si avant 15h30: inclure hier ET aujourd'hui. Si après 15h30: uniquement aujourd'hui
    const datesToInclude = parisTimeDecimal < 15.5
      ? [yesterdayStr, todayStr]
      : [todayStr];

    // Trouver la feuille courante: date la plus récente <= aujourd'hui avec des résultats a_venir ou dans les dates à inclure
    let currentDateExamen: string | null = null;

    // D'abord chercher dans les dates à inclure (aujourd'hui/hier)
    const candidateDates = Array.from(grouped.keys())
      .filter((d) => datesToInclude.includes(d))
      .sort();

    if (candidateDates.length > 0) {
      currentDateExamen = candidateDates[candidateDates.length - 1];
    } else {
      // Sinon prendre la date la plus récente <= aujourd'hui qui a encore des a_venir
      const pastDates = Array.from(grouped.keys())
        .filter((d) => d <= todayStr)
        .sort();
      for (let i = pastDates.length - 1; i >= 0; i--) {
        const exs = grouped.get(pastDates[i])!;
        if (exs.some((e) => e.resultat === 'a_venir')) {
          currentDateExamen = pastDates[i];
          break;
        }
      }
    }

    // Construire la feuille courante
    let current: {
      examens: FeuilleAppelExamen[];
      deadline: string;
      dateExamen: string;
      summary: FeuilleAppelSummary;
    } | null = null;

    if (currentDateExamen && grouped.has(currentDateExamen)) {
      const currentExamens = grouped.get(currentDateExamen)!;
      const deadlineDate = new Date(currentDateExamen + 'T15:30:00');
      deadlineDate.setDate(deadlineDate.getDate() + 1);
      const deadlineIso = `${deadlineDate.toISOString().split('T')[0]}T15:30:00+01:00`;

      current = {
        examens: currentExamens.map((ex) => ({
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
        })),
        deadline: deadlineIso,
        dateExamen: currentDateExamen,
        summary: computeSummary(currentExamens, currentDateExamen),
      };
    }

    // Construire l'historique (toutes les dates sauf la courante), triées DESC
    const history: FeuilleAppelSummary[] = Array.from(grouped.entries())
      .filter(([date]) => date !== currentDateExamen)
      .map(([date, exs]) => computeSummary(exs, date))
      .sort((a, b) => b.dateExamen.localeCompare(a.dateExamen));

    return NextResponse.json({ current, history });
  } catch (error) {
    console.error('[Feuilles-appel GET Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des feuilles d\'appel' },
      { status: 500 }
    );
  }
}
