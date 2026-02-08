import { NextResponse } from 'next/server';
import { getAllInscriptions } from '@/lib/data/inscriptions';
import type { DashboardStats, InscriptionStatus } from '@/types/admin';

export async function GET() {
  try {
    const inscriptions = await getAllInscriptions();

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

    const stats: DashboardStats = {
      totalInscriptions: inscriptions.length,
      byStatus,
      byFormation,
      byMonth,
      recentInscriptions,
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
