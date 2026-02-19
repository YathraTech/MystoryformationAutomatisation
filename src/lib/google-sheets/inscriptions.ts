import { getSheetData, updateSheetCell, updateSheetRow, appendSheetRow } from './client';
import { SHEET_COLUMN_MAP } from '@/lib/utils/admin-constants';
import type { Inscription, InscriptionStatus, BadgeKey, BadgeColor } from '@/types/admin';

/** Order of columns in the Google Sheet (must match the headers in row 1) */
const SHEET_HEADERS = [
  'ID', 'Date', 'Civilité', 'Nom', 'Prénom', 'Email', 'Téléphone',
  'Date naissance', 'Adresse', 'Code postal', 'Ville',
  'N° CPF', 'N° Sécu', 'Financement', 'Langue', 'Niveau',
  'Objectif', 'Formation ID', 'Formation', 'Durée', 'Prix',
  'Session ID', 'Session début', 'Session fin', 'Horaires', 'Lieu',
  'Jours dispo', 'Créneaux', 'Date début souhaitée',
  'Commentaires', 'Statut', 'Relance date', 'Relance note',
  'Badge Contacté', 'Badge Payé', 'Badge Dossier',
];

const BADGE_HEADER_MAP: Record<BadgeKey, string> = {
  badgeContacte: 'Badge Contacté',
  badgePaye: 'Badge Payé',
  badgeDossier: 'Badge Dossier',
};

function parseRow(headers: string[], row: string[], rowIndex: number): Inscription {
  const obj: Record<string, string> = {};

  headers.forEach((header, i) => {
    const key = SHEET_COLUMN_MAP[header];
    if (key) {
      obj[key] = row[i] || '';
    }
  });

  return {
    rowIndex,
    timestamp: obj.timestamp || '',
    civilite: obj.civilite || '',
    nom: obj.nom || '',
    prenom: obj.prenom || '',
    email: obj.email || '',
    telephone: obj.telephone || '',
    dateNaissance: obj.dateNaissance || '',
    adresse: obj.adresse || '',
    codePostal: obj.codePostal || '',
    ville: obj.ville || '',
    numeroCPF: obj.numeroCPF || '',
    numeroSecuriteSociale: obj.numeroSecuriteSociale || '',
    modeFinancement: obj.modeFinancement || '',
    langue: obj.langue || '',
    niveauActuel: obj.niveauActuel || '',
    objectif: obj.objectif || '',
    formationId: obj.formationId || '',
    formationNom: obj.formationNom || '',
    formationDuree: obj.formationDuree || '',
    formationPrix: obj.formationPrix || '',
    joursDisponibles: obj.joursDisponibles || '',
    creneauxHoraires: obj.creneauxHoraires || '',
    dateDebutSouhaitee: obj.dateDebutSouhaitee || '',
    dateFormation: null,
    heureFormation: null,
    commentaires: obj.commentaires || '',
    statut: (obj.statut as InscriptionStatus) || 'En attente',
    relanceDate: obj.relanceDate || '',
    relanceNote: obj.relanceNote || '',
    badgeContacte: (obj.badgeContacte as BadgeColor) || 'orange',
    badgePaye: (obj.badgePaye as BadgeColor) || 'red',
    badgeDossier: (obj.badgeDossier as BadgeColor) || 'red',
    lieu: obj.lieu || null,
  };
}

export async function getAllInscriptions(): Promise<Inscription[]> {
  const data = await getSheetData('A1:AH1000');

  if (data.length < 2) return [];

  const headers = data[0];
  const inscriptions: Inscription[] = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i].length === 0 || !data[i].some((cell) => cell.trim())) continue;
    inscriptions.push(parseRow(headers, data[i], i + 1));
  }

  return inscriptions;
}

export async function getInscriptionByRow(
  rowIndex: number
): Promise<Inscription | null> {
  const data = await getSheetData('A1:AH1000');

  if (data.length < 2) return null;

  const headers = data[0];
  const dataRowIndex = rowIndex - 1;

  if (dataRowIndex < 1 || dataRowIndex >= data.length) return null;

  return parseRow(headers, data[dataRowIndex], rowIndex);
}

export async function updateInscriptionStatus(
  rowIndex: number,
  status: InscriptionStatus
): Promise<void> {
  const data = await getSheetData('A1:AH1');
  if (!data[0]) throw new Error('Headers not found');

  const headers = data[0];
  const statutCol = headers.indexOf('Statut');

  if (statutCol === -1) {
    throw new Error('Colonne "Statut" non trouvée dans le Google Sheet');
  }

  await updateSheetCell(rowIndex, statutCol, status);
}

export async function updateBadge(
  rowIndex: number,
  badge: BadgeKey,
  color: BadgeColor
): Promise<void> {
  const headerName = BADGE_HEADER_MAP[badge];
  const data = await getSheetData('A1:AH1');
  if (!data[0]) throw new Error('Headers not found');

  const headers = data[0];
  const col = headers.indexOf(headerName);

  if (col === -1) {
    throw new Error(`Colonne "${headerName}" non trouvée dans le Google Sheet`);
  }

  await updateSheetCell(rowIndex, col, color);
}

export async function addRelance(
  rowIndex: number,
  note: string
): Promise<void> {
  const data = await getSheetData('A1:AH1');
  if (!data[0]) throw new Error('Headers not found');

  const headers = data[0];
  const relanceDateCol = headers.indexOf('Relance date');
  const relanceNoteCol = headers.indexOf('Relance note');

  if (relanceDateCol === -1 || relanceNoteCol === -1) {
    throw new Error(
      'Colonnes "Relance date" / "Relance note" non trouvées dans le Google Sheet'
    );
  }

  const now = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  await updateSheetRow(rowIndex, relanceDateCol, [now, note]);
}

/** Convert an Inscription to a row array matching the sheet headers order */
function inscriptionToRow(ins: Inscription): string[] {
  const fieldMap: Record<string, string> = {
    'ID': String(ins.rowIndex),
    'Date': ins.timestamp,
    'Civilité': ins.civilite,
    'Nom': ins.nom,
    'Prénom': ins.prenom,
    'Email': ins.email,
    'Téléphone': ins.telephone,
    'Date naissance': ins.dateNaissance,
    'Adresse': ins.adresse,
    'Code postal': ins.codePostal,
    'Ville': ins.ville,
    'N° CPF': ins.numeroCPF,
    'N° Sécu': ins.numeroSecuriteSociale,
    'Financement': ins.modeFinancement,
    'Langue': ins.langue,
    'Niveau': ins.niveauActuel,
    'Objectif': ins.objectif,
    'Formation ID': ins.formationId,
    'Formation': ins.formationNom,
    'Durée': ins.formationDuree,
    'Prix': ins.formationPrix,
    'Jours dispo': ins.joursDisponibles,
    'Créneaux': ins.creneauxHoraires,
    'Date début souhaitée': ins.dateDebutSouhaitee,
    'Commentaires': ins.commentaires,
    'Statut': ins.statut,
    'Relance date': ins.relanceDate,
    'Relance note': ins.relanceNote,
    'Badge Contacté': ins.badgeContacte,
    'Badge Payé': ins.badgePaye,
    'Badge Dossier': ins.badgeDossier,
  };

  return SHEET_HEADERS.map((header) => fieldMap[header] || '');
}

/** Append a new inscription as a new row in the Google Sheet */
export async function addInscriptionRow(ins: Inscription): Promise<void> {
  await appendSheetRow(inscriptionToRow(ins));
}
