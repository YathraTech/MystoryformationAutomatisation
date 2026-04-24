import { NextRequest, NextResponse } from 'next/server';
import {
  getStagiaireFormationById,
  getEmargementsByStagiaire,
  createCoursSession,
  upsertEmargement,
} from '@/lib/data/stagiaires-formation';
import { createAdminClient } from '@/lib/supabase/admin';

interface CreneauRow {
  id: number;
  jour: string;
  heure_debut: string;
  heure_fin: string;
  duree_heures: number;
  agence: string;
  places_max: number;
  actif: boolean;
}

interface CoursSessionRow {
  id: number;
  date_cours: string;
  horaire: string;
  agence: string;
}

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

    // Récupérer les créneaux actifs pour l'agence du stagiaire
    // pour connaître places_max par slot (jour + heures)
    const supabaseReadCre = createAdminClient();
    const { data: creneauxRows } = await supabaseReadCre
      .from('formation_creneaux')
      .select('id, jour, heure_debut, heure_fin, duree_heures, agence, places_max, actif')
      .eq('agence', stagiaire.agence)
      .eq('actif', true);
    const creneaux = (creneauxRows || []) as CreneauRow[];

    // Normalise "9h30" / "09:30" en "09:30" pour comparaison
    const normHM = (s: string): string => {
      const m = s.match(/(\d{1,2})[h:](\d{2})?/);
      if (!m) return s;
      const hh = String(parseInt(m[1])).padStart(2, '0');
      const mm = m[2] ? m[2] : '00';
      return `${hh}:${mm}`;
    };

    // Pour chaque slot, trouve la capacité du créneau correspondant
    function placesMaxForSlot(jourIdx: number, slotLabel: string): number {
      const slotM = slotLabel.match(/(\d{1,2})[h:](\d{2})?-(\d{1,2})[h:](\d{2})?/);
      if (!slotM) return 12; // défaut
      const slotStart = normHM(`${slotM[1]}:${slotM[2] || '00'}`);
      const slotEnd = normHM(`${slotM[3]}:${slotM[4] || '00'}`);
      const jourName = Object.keys(DAYS_MAP).find((k) => DAYS_MAP[k] === jourIdx);
      const c = creneaux.find(
        (x) =>
          x.jour.toLowerCase() === jourName
          && normHM(x.heure_debut) === slotStart
          && normHM(x.heure_fin) === slotEnd,
      );
      return c?.places_max ?? 12;
    }

    const totalNeeded = stagiaire.heuresPrevues;
    const maxIter = 366 * 2; // sécurité : 2 ans max

    let accumHours = 0;
    const currentDate = new Date(startDate);
    const createdSessions: { id: number; date: string; horaire: string }[] = [];
    const skippedFull: { date: string; horaire: string; count: number; max: number }[] = [];
    let iter = 0;

    while (accumHours < totalNeeded && iter < maxIter) {
      iter++;
      const dayIdx = currentDate.getDay();
      if (dayIndices.includes(dayIdx)) {
        for (const slot of slots) {
          if (accumHours >= totalNeeded) break;
          const dateStr = formatLocalDate(currentDate);
          const placesMax = placesMaxForSlot(dayIdx, slot.label);

          // Chercher une session existante sur date + horaire + agence
          const supabaseReadSess = createAdminClient();
          const { data: existSessRows } = await supabaseReadSess
            .from('cours_sessions')
            .select('id, date_cours, horaire, agence')
            .eq('date_cours', dateStr)
            .eq('horaire', slot.label)
            .eq('agence', stagiaire.agence)
            .limit(1);
          const existSess = (existSessRows?.[0] as CoursSessionRow | undefined);

          // Compter les émargements déjà présents (stagiaires déjà affectés)
          let count = 0;
          if (existSess) {
            const { count: c } = await supabaseReadSess
              .from('emargements')
              .select('id', { count: 'exact', head: true })
              .eq('cours_session_id', existSess.id);
            count = c ?? 0;

            // Si le stagiaire est déjà dans cette session, on saute
            const { data: mine } = await supabaseReadSess
              .from('emargements')
              .select('id')
              .eq('cours_session_id', existSess.id)
              .eq('stagiaire_id', stagiaireId)
              .limit(1);
            if (mine && mine.length > 0) {
              // déjà affecté, on ne double pas l'émargement
              // on comptabilise quand même les heures pour ne pas sur-planifier
              accumHours += slot.duration;
              continue;
            }
          }

          // Capacité saturée → on passe au slot/jour suivant
          if (existSess && count >= placesMax) {
            skippedFull.push({ date: dateStr, horaire: slot.label, count, max: placesMax });
            continue;
          }

          // Affecter : réutilise la session si elle existe, sinon en crée une nouvelle
          const sessionId = existSess
            ? existSess.id
            : (await createCoursSession({
                date_cours: dateStr,
                agence: stagiaire.agence,
                formatrice_id: stagiaire.formatriceId || null,
                formatrice_nom: stagiaire.formatriceNom || null,
                horaire: slot.label,
                duree_heures: slot.duration,
              })).id;

          await upsertEmargement(sessionId, stagiaireId, false);
          createdSessions.push({ id: sessionId, date: dateStr, horaire: slot.label });
          accumHours += slot.duration;
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json({
      sessionsCreated: createdSessions.length,
      totalHours: Math.round(accumHours * 10) / 10,
      heuresPrevues: totalNeeded,
      skippedFull,
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
