import { NextResponse } from 'next/server';
import { getAllInscriptions } from '@/lib/data/inscriptions';
import { getAllExamens } from '@/lib/data/examens';
import { getSessionUser } from '@/lib/auth/session';
import { getSafeUsers } from '@/lib/auth/users';
import { getCaMensuelHistory } from '@/lib/data/ca-mensuel';
import type { DashboardStats, InscriptionStatus, RevenueStats, CommercialRevenue, CentreRevenue, CentreExamenStats } from '@/types/admin';

// Helper pour formater le nom du mois
function getMonthLabel(year: number, month: number): string {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

// Helper pour calculer le CA par mois à partir des examens
function calculateRevenueStats(examens: { prix: number | null; createdAt: string }[]): RevenueStats {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Mois précédent
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Map pour stocker le CA par mois (clé: "YYYY-MM")
  const revenueByMonth = new Map<string, number>();

  // Initialiser les 6 derniers mois à 0
  for (let i = 5; i >= 0; i--) {
    let m = currentMonth - i;
    let y = currentYear;
    if (m < 0) {
      m += 12;
      y -= 1;
    }
    const key = `${y}-${String(m + 1).padStart(2, '0')}`;
    revenueByMonth.set(key, 0);
  }

  // Calculer le CA pour chaque examen
  for (const ex of examens) {
    if (ex.prix !== null && ex.prix > 0) {
      const date = new Date(ex.createdAt);
      if (!isNaN(date.getTime())) {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        revenueByMonth.set(key, (revenueByMonth.get(key) || 0) + ex.prix);
      }
    }
  }

  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const prevMonthKey = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;

  const currentMonthRevenue = revenueByMonth.get(currentMonthKey) || 0;
  const previousMonthRevenue = revenueByMonth.get(prevMonthKey) || 0;

  // Calculer la progression (pourcentage d'atteinte de l'objectif)
  const progression = previousMonthRevenue > 0
    ? Math.round((currentMonthRevenue / previousMonthRevenue) * 100)
    : currentMonthRevenue > 0 ? 100 : 0;

  // Construire l'historique des 6 derniers mois
  const byMonth = Array.from(revenueByMonth.entries())
    .map(([month, amount]) => {
      const [y, m] = month.split('-').map(Number);
      return {
        month,
        label: getMonthLabel(y, m - 1),
        amount,
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    currentMonth: currentMonthRevenue,
    previousMonth: previousMonthRevenue,
    currentMonthLabel: getMonthLabel(currentYear, currentMonth),
    previousMonthLabel: getMonthLabel(prevYear, prevMonth),
    progression,
    byMonth,
  };
}

export async function GET() {
  try {
    // Récupérer le lieu de l'utilisateur connecté
    const user = await getSessionUser();
    const userLieu = user?.lieu || null;
    const isCommercial = user?.role === 'commercial';

    const [allInscriptions, allExamens, allUsers] = await Promise.all([
      getAllInscriptions(),
      getAllExamens(),
      getSafeUsers(),
    ]);

    // Les commerciaux ne voient que les données de leur centre
    // Les admins voient tout
    const inscriptions = (isCommercial && userLieu)
      ? allInscriptions.filter((ins) => ins.lieu === userLieu)
      : allInscriptions;

    const examens = (isCommercial && userLieu)
      ? allExamens.filter((ex) => ex.lieu === userLieu)
      : allExamens;

    const byStatus: Record<InscriptionStatus, number> = {
      'En attente': 0,
      Validee: 0,
      Refusee: 0,
      Archivee: 0,
    };

    const formationMap = new Map<string, number>();
    const monthMap = new Map<string, number>();

    for (const ins of inscriptions) {
      if (ins.statut in byStatus) {
        byStatus[ins.statut]++;
      } else {
        byStatus['En attente']++;
      }

      const fname = ins.formationNom || 'Non renseignée';
      formationMap.set(fname, (formationMap.get(fname) || 0) + 1);

      if (ins.timestamp) {
        const date = new Date(ins.timestamp);
        if (!isNaN(date.getTime())) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
        }
      }
    }

    const byFormation = Array.from(formationMap.entries())
      .map(([formation, count]) => ({ formation, count }))
      .sort((a, b) => b.count - a.count);

    const byMonth = Array.from(monthMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const recentInscriptions = [...inscriptions]
      .reverse()
      .slice(0, 5);

    // Créer une map email -> inscription ID pour les examens
    const emailToInscriptionId = new Map<string, number>();
    for (const ins of inscriptions) {
      const email = ins.email.toLowerCase();
      if (!emailToInscriptionId.has(email)) {
        emailToInscriptionId.set(email, ins.rowIndex);
      }
    }

    // Vérifier si un examen est complètement configuré
    const isExamenConfigured = (ex: typeof examens[0]) => {
      return ex.prix !== null &&
        ex.moyenPaiement !== null &&
        ex.typeExamen !== null &&
        ex.dateExamen !== null &&
        ex.heureExamen !== null &&
        ex.lieu !== null &&
        ex.formateurId !== null;
    };

    // Recent exams (5 derniers) avec lien vers inscription
    const recentExamens = examens.slice(0, 5).map((ex) => ({
      id: ex.id,
      nom: ex.nom,
      prenom: ex.prenom,
      diplome: ex.diplome,
      createdAt: ex.createdAt,
      resultat: ex.resultat,
      inscriptionId: emailToInscriptionId.get(ex.email.toLowerCase()) || null,
      configured: isExamenConfigured(ex),
      lieu: ex.lieu || null,
    }));

    // Exam statistics (Traité = configuration complète, À compléter = le reste)
    let termines = 0;
    let incomplets = 0;

    for (const ex of examens) {
      // Incomplets = pas de diplôme choisi
      if (!ex.diplome) {
        incomplets++;
      }

      // Traité = configuration complète OU résultat connu
      if (isExamenConfigured(ex) || ex.resultat === 'reussi' || ex.resultat === 'echoue') {
        termines++;
      }
    }

    const examenStats = {
      total: examens.length,
      aPlanifier: 0, // Plus utilisé mais gardé pour compatibilité
      aVenir: 0, // Plus utilisé mais gardé pour compatibilité
      termines,
      incomplets,
    };

    // Calculer les stats de chiffre d'affaires
    const revenue = calculateRevenueStats(examens);

    // Calculer le CA par commercial
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();

    // Filtrer les commerciaux + admins du centre concerné
    const commercialsAndAdmins = allUsers.filter((u) => {
      if (u.role !== 'commercial' && u.role !== 'admin') return false;
      if (isCommercial && userLieu) return u.lieu === userLieu;
      return true;
    });

    const commercialRevenues: CommercialRevenue[] = commercialsAndAdmins.map((member) => {
      // Examens attribués à ce membre dans le mois en cours
      let monthCA = 0;
      for (const ex of examens) {
        if (ex.commercialId !== member.id) continue;
        if (ex.prix === null || ex.prix <= 0) continue;
        const date = new Date(ex.createdAt);
        if (date.getFullYear() === currentYear && date.getMonth() === currentMonthIdx) {
          monthCA += ex.prix;
        }
      }

      const objectif = member.objectifCa;
      const progression = objectif && objectif > 0
        ? Math.round((monthCA / objectif) * 100)
        : monthCA > 0 ? 100 : 0;

      return {
        commercialId: member.id,
        nom: member.nom,
        prenom: member.prenom,
        role: member.role as 'admin' | 'commercial',
        currentMonth: monthCA,
        objectifCa: objectif,
        progression,
      };
    });

    // Historique CA mensuel depuis la table ca_mensuel
    const caHistory = await getCaMensuelHistory(6);
    const caByCommercial = new Map<string, Map<string, number>>();
    for (const row of caHistory) {
      if (!caByCommercial.has(row.commercial_id)) {
        caByCommercial.set(row.commercial_id, new Map());
      }
      caByCommercial.get(row.commercial_id)!.set(row.mois, row.montant);
    }

    // Attacher l'historique par mois à chaque commercial
    for (const cr of commercialRevenues) {
      const history = caByCommercial.get(cr.commercialId);
      if (history) {
        cr.byMonth = Array.from(history.entries())
          .map(([mois, montant]) => {
            const [y, m] = mois.split('-').map(Number);
            return { mois, label: getMonthLabel(y, m - 1), montant };
          })
          .sort((a, b) => a.mois.localeCompare(b.mois));
      }
    }

    // Pour les admins : calculer le CA par centre (Gagny + Sarcelles séparés)
    let revenueByCentre: CentreRevenue[] | null = null;
    if (!isCommercial) {
      const centres = ['Gagny', 'Sarcelles'];
      revenueByCentre = centres.map((centre) => {
        const centreExamens = allExamens.filter((ex) => ex.lieu === centre);
        const centreRevenue = calculateRevenueStats(centreExamens);
        // Commerciaux du centre + admins (les admins apparaissent dans tous les centres)
        const centreMembers = allUsers.filter((u) => {
          if (u.role === 'commercial') return u.lieu === centre;
          if (u.role === 'admin') return true; // admins apparaissent dans chaque centre
          return false;
        });

        const centreCommercialRevenues: CommercialRevenue[] = centreMembers.map((member) => {
          let monthCA = 0;
          for (const ex of centreExamens) {
            if (ex.commercialId !== member.id) continue;
            if (ex.prix === null || ex.prix <= 0) continue;
            const date = new Date(ex.createdAt);
            if (date.getFullYear() === currentYear && date.getMonth() === currentMonthIdx) {
              monthCA += ex.prix;
            }
          }
          const objectif = member.objectifCa;
          const prog = objectif && objectif > 0
            ? Math.round((monthCA / objectif) * 100)
            : monthCA > 0 ? 100 : 0;
          return {
            commercialId: member.id,
            nom: member.nom,
            prenom: member.prenom,
            role: member.role as 'admin' | 'commercial',
            currentMonth: monthCA,
            objectifCa: objectif,
            progression: prog,
          };
        });

        // Attacher historique CA aux commerciaux du centre
        for (const cr of centreCommercialRevenues) {
          const history = caByCommercial.get(cr.commercialId);
          if (history) {
            cr.byMonth = Array.from(history.entries())
              .map(([mois, montant]) => {
                const [y, m] = mois.split('-').map(Number);
                return { mois, label: getMonthLabel(y, m - 1), montant };
              })
              .sort((a, b) => a.mois.localeCompare(b.mois));
          }
        }

        // Stats examens par centre
        let centreTraites = 0;
        for (const ex of centreExamens) {
          if (isExamenConfigured(ex) || ex.resultat === 'reussi' || ex.resultat === 'echoue') {
            centreTraites++;
          }
        }
        // Inscriptions par centre
        const centreInscriptions = allInscriptions.filter((ins) => ins.lieu === centre);
        const centreExamenStats: CentreExamenStats = {
          totalExamens: centreExamens.length,
          examenTraites: centreTraites,
          examenACompleter: centreExamens.length - centreTraites,
          totalInscriptions: centreInscriptions.length,
        };

        return {
          centre,
          revenue: centreRevenue,
          commercialRevenues: centreCommercialRevenues,
          examenStats: centreExamenStats,
        };
      });
    }

    const stats: DashboardStats = {
      totalInscriptions: inscriptions.length,
      totalExamens: examens.length,
      byStatus,
      byFormation,
      byMonth,
      recentInscriptions,
      recentExamens,
      examenStats,
      revenue,
      userLieu: (isCommercial && userLieu) ? userLieu : null,
      commercialRevenues,
      revenueByCentre,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}
