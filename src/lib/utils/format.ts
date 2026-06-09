export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(price);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Convertit une heure ("HH:MM:SS", "HH:MM", "9h30", "9:30", "9h") en minutes
 * depuis minuit. Renvoie null si la valeur est vide ou invalide.
 * Sert de base à formatHeure / addToHeure pour normaliser les colonnes TIME
 * de Postgres (qui renvoient "HH:MM:SS") et les saisies "9h30".
 */
export function parseHeureToMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = value.trim().match(/^(\d{1,2})\s*[:hH]\s*(\d{1,2})?/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  if (Number.isNaN(h) || Number.isNaN(min) || h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Formate une heure en "HH:MM" (24h, sans secondes). Renvoie '' si invalide. */
export function formatHeure(value: string | null | undefined): string {
  const total = parseHeureToMinutes(value);
  if (total === null) return '';
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Ajoute des minutes à une heure et formate en "HH:MM". Renvoie '' si invalide. */
export function addToHeure(value: string | null | undefined, minutesToAdd: number): string {
  const total = parseHeureToMinutes(value);
  if (total === null) return '';
  const t = (((total + minutesToAdd) % 1440) + 1440) % 1440;
  const h = Math.floor(t / 60);
  const m = t % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.startsWith('+33')) {
    const rest = cleaned.slice(3);
    return `+33 ${rest.replace(/(.{1})(.{2})(.{2})(.{2})(.{2})/, '$1 $2 $3 $4 $5')}`;
  }
  return cleaned.replace(/(.{2})(.{2})(.{2})(.{2})(.{2})/, '$1 $2 $3 $4 $5');
}
