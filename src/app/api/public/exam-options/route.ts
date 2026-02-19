import { NextResponse } from 'next/server';
import { getPublicExamOptions, getPackItems } from '@/lib/data/exam-options';

// Fallback options if database table doesn't exist yet
const FALLBACK_OPTIONS = [
  { id: 1, code: 'A1', label: 'Diplôme A1', description: null, categorie: 'niveau', estPack: false, visiblePublic: true, ordre: 1, createdAt: '', updatedAt: '' },
  { id: 2, code: 'A2', label: 'Diplôme A2', description: null, categorie: 'niveau', estPack: false, visiblePublic: true, ordre: 2, createdAt: '', updatedAt: '' },
  { id: 3, code: 'B1', label: 'Diplôme B1', description: null, categorie: 'niveau', estPack: false, visiblePublic: true, ordre: 3, createdAt: '', updatedAt: '' },
  { id: 4, code: 'B2', label: 'Diplôme B2', description: null, categorie: 'niveau', estPack: false, visiblePublic: true, ordre: 4, createdAt: '', updatedAt: '' },
  { id: 5, code: 'carte_pluriannuelle', label: 'Carte de séjour pluriannuelle', description: null, categorie: 'carte', estPack: false, visiblePublic: true, ordre: 10, createdAt: '', updatedAt: '' },
  { id: 6, code: 'carte_residence', label: 'Carte de résident', description: null, categorie: 'carte', estPack: false, visiblePublic: true, ordre: 11, createdAt: '', updatedAt: '' },
  { id: 7, code: 'naturalisation', label: 'Naturalisation', description: null, categorie: 'carte', estPack: false, visiblePublic: true, ordre: 12, createdAt: '', updatedAt: '' },
];

export async function GET() {
  try {
    const options = await getPublicExamOptions();

    // If no options from DB, use fallback
    if (!options || options.length === 0) {
      console.log('[Public Exam Options] Using fallback options');
      return NextResponse.json({ options: FALLBACK_OPTIONS });
    }

    // Load pack items for pack options
    for (const option of options) {
      if (option.estPack) {
        try {
          option.packItems = await getPackItems(option.id);
        } catch (packError) {
          console.error('[Public Exam Options] Error loading pack items:', packError);
          option.packItems = [];
        }
      }
    }

    return NextResponse.json({ options });
  } catch (error) {
    console.error('[Public Exam Options Error]', error);
    // Return fallback options instead of error
    console.log('[Public Exam Options] Using fallback options due to error');
    return NextResponse.json({ options: FALLBACK_OPTIONS });
  }
}
