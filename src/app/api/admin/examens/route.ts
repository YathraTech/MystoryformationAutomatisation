import { NextResponse } from 'next/server';
import { getAllExamens } from '@/lib/data/examens';
import { getAllInscriptions } from '@/lib/data/inscriptions';

export async function GET() {
  try {
    const [examens, inscriptions] = await Promise.all([
      getAllExamens(),
      getAllInscriptions(),
    ]);

    // Créer une map email -> { inscriptionId, examenSeul }
    const emailToInscriptionInfo = new Map<string, { inscriptionId: number; examenSeul: boolean }>();
    for (const ins of inscriptions) {
      const email = ins.email.toLowerCase();
      if (!emailToInscriptionInfo.has(email)) {
        // Vérifier si c'est un examen seul (pas de formation ou formation vide)
        const examenSeul = !ins.formationNom ||
          ins.formationNom === '' ||
          ins.formationNom.toLowerCase().includes('examen');
        emailToInscriptionInfo.set(email, {
          inscriptionId: ins.rowIndex,
          examenSeul,
        });
      }
    }

    // Enrichir les examens avec l'ID d'inscription et le flag examenSeul
    const examensWithInscriptionId = examens.map((ex) => {
      const info = emailToInscriptionInfo.get(ex.email.toLowerCase());
      return {
        ...ex,
        inscriptionId: info?.inscriptionId || null,
        // Si pas d'inscription trouvée, c'est un examen seul
        examenSeul: info ? info.examenSeul : true,
      };
    });

    return NextResponse.json({ examens: examensWithInscriptionId });
  } catch (error) {
    console.error('[Examens API Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des examens' },
      { status: 500 }
    );
  }
}
