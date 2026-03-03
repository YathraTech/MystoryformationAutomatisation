/**
 * Deadline dynamique pour les feuilles d'appel.
 *
 * Règles :
 *  - Examen matin   (heureExamen < 13:00) → deadline le jour même à 20h00
 *  - Examen après-midi (heureExamen >= 13:00 ou null) → deadline le lendemain à 12h00
 */

/** Deadline d'un examen individuel */
export function getExamDeadline(dateExamen: string, heureExamen: string | null): Date {
  const hour = heureExamen ? parseInt(heureExamen.split(':')[0], 10) : 14;
  if (hour < 13) {
    // Matin → même jour 20h00
    return new Date(dateExamen + 'T20:00:00');
  } else {
    // Après-midi (ou pas d'heure) → lendemain 12h00
    const d = new Date(dateExamen + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    return d;
  }
}

/** Deadline la plus tardive d'un groupe d'examens (pour l'affichage feuille) */
export function computeFeuilleDeadline(
  examens: { heureExamen: string | null }[],
  dateExamen: string,
): Date {
  let latest: Date | null = null;
  for (const ex of examens) {
    const dl = getExamDeadline(dateExamen, ex.heureExamen);
    if (!latest || dl > latest) {
      latest = dl;
    }
  }
  // Fallback : si pas d'examens, utiliser la règle après-midi
  return latest ?? getExamDeadline(dateExamen, null);
}

/** Vérifie si la deadline est passée (en heure Paris) */
export function isDeadlinePassed(dateExamen: string, heureExamen: string | null): boolean {
  const deadline = getExamDeadline(dateExamen, heureExamen);
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  return now >= deadline;
}
