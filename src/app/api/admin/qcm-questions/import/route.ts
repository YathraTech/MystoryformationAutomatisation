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

      const typeTestRaw = getCol(row, 'type_test').toLowerCase();
      const typeTest = typeTestRaw === 'final' ? 'final' : 'initial';
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
      // Sujet partagé (optionnel) : les lignes au même sujet_titre sont regroupées
      const sujetTitre = getCol(row, 'sujet_titre');
      const sujetContenu = getCol(row, 'sujet_contenu');
      const sujetAudioUrl = getCol(row, 'sujet_audio_url');

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
        type_test: typeTest,
        type_competence: competence,
        niveau,
        question,
        choix,
        reponse_correcte: reponseLettres[0],
        choix_multiple: choixMultiple,
        reponses_correctes: choixMultiple ? reponseLettres : [],
        media_url: audioUrl || null,
        points,
        actif: true,
        ordre: i,
        // Champs transitoires (retirés avant insertion) pour le regroupement par sujet
        __sujetKey: sujetTitre ? `${competence}|${typeTest}|${sujetTitre.toLowerCase()}` : '',
        __sujetTitre: sujetTitre,
        __sujetContenu: sujetContenu,
        __sujetAudioUrl: sujetAudioUrl,
      });
    }

    // ---- Sujets partagés : créer (ou réutiliser) un qcm_sujets par sujet_titre ----
    const sujetDefs = new Map<string, Record<string, unknown>>();
    for (const q of questionsToInsert) {
      const key = q.__sujetKey as string;
      if (!key) continue;
      if (!sujetDefs.has(key)) {
        sujetDefs.set(key, {
          type_competence: q.type_competence,
          type_test: q.type_test,
          niveau: q.niveau,
          titre: q.__sujetTitre,
          contenu: (q.__sujetContenu as string) || null,
          media_url: (q.__sujetAudioUrl as string) || null,
          actif: true,
          ordre: 0,
        });
      } else {
        const def = sujetDefs.get(key)!;
        if (!def.contenu && q.__sujetContenu) def.contenu = q.__sujetContenu;
        if (!def.media_url && q.__sujetAudioUrl) def.media_url = q.__sujetAudioUrl;
      }
    }

    const keyToSujetId = new Map<string, number>();
    for (const [key, def] of sujetDefs) {
      // Réutiliser un sujet identique existant (titre + compétence + test)
      const { data: existing } = await supabase
        .from('qcm_sujets')
        .select('id')
        .eq('type_competence', def.type_competence as string)
        .eq('type_test', def.type_test as string)
        .eq('titre', def.titre as string)
        .limit(1)
        .maybeSingle();

      if (existing) {
        keyToSujetId.set(key, existing.id);
      } else {
        const { data: created, error: sujetErr } = await supabase
          .from('qcm_sujets')
          .insert(def)
          .select('id')
          .single();
        if (sujetErr || !created) {
          errors.push(`Sujet "${def.titre}" : ${sujetErr?.message || 'échec de création'}`);
          continue;
        }
        keyToSujetId.set(key, created.id);
      }
    }

    // Affecter sujet_id et retirer les champs transitoires avant insertion
    for (const q of questionsToInsert) {
      const key = q.__sujetKey as string;
      q.sujet_id = key ? keyToSujetId.get(key) ?? null : null;
      delete q.__sujetKey;
      delete q.__sujetTitre;
      delete q.__sujetContenu;
      delete q.__sujetAudioUrl;
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
