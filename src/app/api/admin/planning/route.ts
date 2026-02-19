import { NextRequest, NextResponse } from 'next/server';
import { getInscriptionsForPlanning, getAllInscriptions } from '@/lib/data/inscriptions';
import { getExamensForPlanning } from '@/lib/data/examens';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate et endDate sont requis' },
        { status: 400 }
      );
    }

    const [formations, examens, allInscriptions] = await Promise.all([
      getInscriptionsForPlanning(startDate, endDate),
      getExamensForPlanning(startDate, endDate),
      getAllInscriptions(),
    ]);

    // Créer une map email -> inscription ID pour les liens
    const emailToInscriptionId = new Map<string, number>();
    for (const ins of allInscriptions) {
      const email = ins.email.toLowerCase();
      // Garder la première inscription (la plus récente car triée par ID desc)
      if (!emailToInscriptionId.has(email)) {
        emailToInscriptionId.set(email, ins.rowIndex);
      }
    }

    // Enrichir les examens avec l'ID d'inscription
    const examensWithInscriptionId = examens.map((ex) => ({
      ...ex,
      inscriptionId: emailToInscriptionId.get(ex.email.toLowerCase()) || null,
    }));

    return NextResponse.json({
      formations,
      examens: examensWithInscriptionId
    });
  } catch (error) {
    console.error('[Planning API Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement du planning' },
      { status: 500 }
    );
  }
}
