import { NextRequest, NextResponse } from 'next/server';
import {
  getStagiaireFormationById,
  getEmargementsByStagiaire,
  createCoursSession,
  upsertEmargement,
} from '@/lib/data/stagiaires-formation';
import { createAdminClient } from '@/lib/supabase/admin';

// ============================================================
// Génération automatique du planning de formation
// ============================================================
// À partir des champs de la désignation (date_debut, jours_formation,
// horaires_formation, heures_prevues, agence, formatrice), crée les
// cours_sessions + emargements jusqu'à atteindre les heures prévues.
//
// Idempotent : ne fait rien si des émargements existent déjà, sauf si
// ?force=true est passé (supprime alors les émargements existants).
// ============================================================

const DAYS_MAP: Record<string, number> = {
  dimanche: 0, lundi: 1, mardi: 2, mercredi: 3,
  jeudi: 4, vendredi: 5, samedi: 6,
};

interface Slot {
  label: string;
  duration: number;
}

function parseHoraires(h: string): Slot[] {
  // Format possibles : "9h30-12h30", "09:30-12:30", "9h30-12h30 / 14h-17h"
  return h
    .split(/\s*\/\s*/)
    .map((raw) => {
      const m = raw.match(/(\d{1,2})[h:](\d{2})?-(\d{1,2})[h:](\d{2})?/);
      if (!m) return null;
      const h1 = parseInt(m[1]);
      const min1 = m[2] ? parseInt(m[2]) : 0;
      const h2 = parseInt(m[3]);
      const min2 = m[4] ? parseInt(m[4]) : 0;
      const duration = (h2 + min2 / 60) - (h1 + min1 / 60);
      if (duration <= 0 || !Number.isFinite(duration)) return null;
      return { label: raw.trim(), duration };
    })
    .filter((s): s is Slot => s !== null);
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stagiaireId = parseInt(id);
    if (isNaN(stagiaireId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const url = new URL(request.url);
    const force = url.searchParams.get('force') === 'true';

    const stagiaire = await getStagiaireFormationById(stagiaireId);
    if (!stagiaire) {
      return NextResponse.json({ error: 'Stagiaire non trouvé' }, { status: 404 });
    }

    // Validation planning
    if (
      !stagiaire.dateDebutFormation
      || !stagiaire.joursFormation
      || stagiaire.joursFormation.length === 0
      || !stagiaire.horairesFormation
      || !stagiaire.heuresPrevues
      || stagiaire.heuresPrevues <= 0
      || !stagiaire.agence
    ) {
      return NextResponse.json(
        { error: 'Planning incomplet (date, jours, horaires, heures, agence requis)' },
        { status: 400 },
      );
    }

    // Check existing
    const existing = await getEmargementsByStagiaire(stagiaireId);
    if (existing.length > 0 && !force) {
      return NextResponse.json({
        skipped: true,
        reason: 'Des émargements existent déjà. Passez ?force=true pour régénérer.',
        existingCount: existing.length,
      });
    }

    // Supprime les émargements existants si force=true (ne touche pas aux cours_sessions)
    if (force && existing.length > 0) {
      const supabase = createAdminClient();
      const { error: delError } = await supabase
        .from('emargements')
        .delete()
        .eq('stagiaire_id', stagiaireId);
      if (delError) throw new Error(delError.message);
    }

    // Parsing planning
    const startDate = new Date(stagiaire.dateDebutFormation);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json({ error: 'Date de début invalide' }, { status: 400 });
    }
    const dayIndices = stagiaire.joursFormation
      .map((j) => DAYS_MAP[j.toLowerCase()])
      .filter((i) => i !== undefined);
    if (dayIndices.length === 0) {
      return NextResponse.json({ error: 'Aucun jour valide dans le planning' }, { status: 400 });
    }
    const slots = parseHoraires(stagiaire.horairesFormation);
    if (slots.length === 0) {
      return NextResponse.json({ error: 'Horaires illisibles' }, { status: 400 });
    }

    const totalNeeded = stagiaire.heuresPrevues;
    const maxIter = 366 * 2; // sécurité : 2 ans max

    let accumHours = 0;
    const currentDate = new Date(startDate);
    const createdSessions: { id: number; date: string; horaire: string }[] = [];
    let iter = 0;

    while (accumHours < totalNeeded && iter < maxIter) {
      iter++;
      const dayIdx = currentDate.getDay();
      if (dayIndices.includes(dayIdx)) {
        for (const slot of slots) {
          if (accumHours >= totalNeeded) break;
          const dateStr = formatLocalDate(currentDate);
          const session = await createCoursSession({
            date_cours: dateStr,
            agence: stagiaire.agence,
            formatrice_id: stagiaire.formatriceId || null,
            formatrice_nom: stagiaire.formatriceNom || null,
            horaire: slot.label,
            duree_heures: slot.duration,
          });
          await upsertEmargement(session.id, stagiaireId, false);
          createdSessions.push({ id: session.id, date: dateStr, horaire: slot.label });
          accumHours += slot.duration;
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json({
      sessionsCreated: createdSessions.length,
      totalHours: Math.round(accumHours * 10) / 10,
      heuresPrevues: totalNeeded,
      sessions: createdSessions,
    });
  } catch (error) {
    console.error('[planning/generate]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 },
    );
  }
}
