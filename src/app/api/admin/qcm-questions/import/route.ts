import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    if (lines.length < 2) {
      return NextResponse.json({ error: 'Le fichier est vide ou n\'a pas d\'en-tête' }, { status: 400 });
    }

    // Détecter le séparateur (point-virgule ou virgule)
    const header = lines[0];
    const separator = header.includes(';') ? ';' : ',';

    const headers = header.split(separator).map((h) => h.trim().toLowerCase());

    // Vérifier les colonnes requises
    const required = ['competence', 'niveau', 'question', 'choix_a', 'choix_b', 'reponse'];
    const missing = required.filter((r) => !headers.includes(r));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Colonnes manquantes : ${missing.join(', ')}. Colonnes trouvées : ${headers.join(', ')}` },
        { status: 400 }
      );
    }

    const getCol = (row: string[], colName: string): string => {
      const idx = headers.indexOf(colName);
      return idx >= 0 && idx < row.length ? row[idx].trim() : '';
    };

    const supabase = await createClient();
    const questionsToInsert: Record<string, unknown>[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Parser la ligne en respectant les guillemets
      const row = parseCsvLine(lines[i], separator);

      const competence = getCol(row, 'competence').toUpperCase();
      const niveau = getCol(row, 'niveau').toUpperCase();
      const question = getCol(row, 'question');
      const choixA = getCol(row, 'choix_a');
      const choixB = getCol(row, 'choix_b');
      const choixC = getCol(row, 'choix_c');
      const choixD = getCol(row, 'choix_d');
      const reponse = getCol(row, 'reponse').toUpperCase();
      const choixMultipleStr = getCol(row, 'choix_multiple').toLowerCase();
      const pointsStr = getCol(row, 'points');
      const audioUrl = getCol(row, 'audio_url');

      // Validation
      if (!competence || !['CE', 'CO'].includes(competence)) {
        errors.push(`Ligne ${i + 1}: compétence invalide "${competence}" (CE ou CO)`);
        continue;
      }
      if (!niveau || !['A0', 'A1', 'A2', 'B1', 'B2'].includes(niveau)) {
        errors.push(`Ligne ${i + 1}: niveau invalide "${niveau}"`);
        continue;
      }
      if (!question) {
        errors.push(`Ligne ${i + 1}: question vide`);
        continue;
      }
      if (!choixA || !choixB) {
        errors.push(`Ligne ${i + 1}: au moins 2 choix (A et B) sont requis`);
        continue;
      }
      if (!reponse) {
        errors.push(`Ligne ${i + 1}: réponse manquante`);
        continue;
      }

      const choixMultiple = ['oui', 'true', '1', 'yes'].includes(choixMultipleStr);
      const points = parseFloat(pointsStr) || 1;

      // Construire les choix (filtrer les vides)
      const choix = [choixA, choixB, choixC, choixD].filter(Boolean);

      // Vérifier que les lettres de réponse sont valides
      const reponseLettres = reponse.split(',').map((l) => l.trim()).filter(Boolean);
      const validLettres = ['A', 'B', 'C', 'D'].slice(0, choix.length);
      const invalidLettres = reponseLettres.filter((l) => !validLettres.includes(l));
      if (invalidLettres.length > 0) {
        errors.push(`Ligne ${i + 1}: réponse(s) invalide(s) "${invalidLettres.join(',')}"`);
        continue;
      }

      questionsToInsert.push({
        type_competence: competence,
        niveau,
        question,
        choix,
        reponse_correcte: choixMultiple ? reponseLettres[0] : reponseLettres[0],
        choix_multiple: choixMultiple,
        reponses_correctes: choixMultiple ? reponseLettres : [],
        media_url: audioUrl || null,
        points,
        actif: true,
        ordre: i,
      });
    }

    // Insérer en batch
    let inserted = 0;
    if (questionsToInsert.length > 0) {
      const { error: insertError, data } = await supabase
        .from('qcm_questions')
        .insert(questionsToInsert)
        .select('id');

      if (insertError) {
        return NextResponse.json(
          { error: `Erreur d'insertion : ${insertError.message}`, errors },
          { status: 500 }
        );
      }
      inserted = data?.length || 0;
    }

    return NextResponse.json({
      success: true,
      inserted,
      skipped: errors.length,
      total: lines.length - 1,
      errors: errors.slice(0, 10), // Max 10 erreurs retournées
    });
  } catch (error) {
    console.error('[POST import-qcm]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * Parse une ligne CSV en respectant les guillemets
 */
function parseCsvLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}
