import { appendSheetRow, getSheetData, updateSheetCell } from './client';
import type { Examen, UpdateExamenFields } from '@/lib/data/examens';

const EXAMENS_SHEET_NAME = 'Examens';

const EXAM_SHEET_HEADERS = [
  'ID', 'Token', 'Date création', 'Civilité', 'Nom', 'Prénom', 'Email', 'Téléphone',
  'Date naissance', 'Adresse', 'Code postal', 'Ville',
  'Nationalité', 'Ville naissance', 'Lieu naissance', 'Langue maternelle',
  'Type pièce identité', 'N° Passeport', 'N° CNI',
  'Type examen', 'Diplôme', 'Date examen', 'Heure examen', 'Lieu', 'Distanciel',
  'Résultat', 'Prix', 'Moyen paiement', 'Date paiement', 'Remises',
  'Objectif administratif', 'Source connaissance', 'Motivation', 'Motivation autre',
  'Résultat email envoyé',
];

// Mapping des champs UpdateExamenFields vers les headers du Sheet
const FIELD_TO_HEADER: Record<string, string> = {
  dateExamen: 'Date examen',
  heureExamen: 'Heure examen',
  resultat: 'Résultat',
  prix: 'Prix',
  moyenPaiement: 'Moyen paiement',
  typeExamen: 'Type examen',
  lieu: 'Lieu',
  remises: 'Remises',
  distanciel: 'Distanciel',
  datePaiement: 'Date paiement',
  resultatEmailSent: 'Résultat email envoyé',
};

function examenToRow(ex: Examen): string[] {
  const typePiece = ex.numeroPasseport ? 'passeport' : ex.numeroCni ? 'cni' : '';

  const fieldMap: Record<string, string> = {
    'ID': String(ex.id),
    'Token': ex.token,
    'Date création': ex.createdAt,
    'Civilité': ex.civilite,
    'Nom': ex.nom,
    'Prénom': ex.prenom,
    'Email': ex.email,
    'Téléphone': ex.telephone,
    'Date naissance': ex.dateNaissance,
    'Adresse': ex.adresse,
    'Code postal': ex.codePostal,
    'Ville': ex.ville,
    'Nationalité': ex.nationalite || '',
    'Ville naissance': ex.villeNaissance || '',
    'Lieu naissance': ex.lieuNaissance || '',
    'Langue maternelle': ex.langueMaternelle || '',
    'Type pièce identité': typePiece,
    'N° Passeport': ex.numeroPasseport || '',
    'N° CNI': ex.numeroCni || '',
    'Type examen': ex.typeExamen || '',
    'Diplôme': ex.diplome || '',
    'Date examen': ex.dateExamen || '',
    'Heure examen': ex.heureExamen || '',
    'Lieu': ex.lieu || '',
    'Distanciel': ex.distanciel ? 'Oui' : 'Non',
    'Résultat': ex.resultat,
    'Prix': ex.prix != null ? String(ex.prix) : '',
    'Moyen paiement': ex.moyenPaiement || '',
    'Date paiement': ex.datePaiement || '',
    'Remises': ex.remises || '',
    'Objectif administratif': ex.objectifAdministratif || '',
    'Source connaissance': ex.sourceConnaissance || '',
    'Motivation': ex.motivation || '',
    'Motivation autre': ex.motivationAutre || '',
    'Résultat email envoyé': ex.resultatEmailSent ? 'Oui' : 'Non',
  };

  return EXAM_SHEET_HEADERS.map((header) => fieldMap[header] || '');
}

/** Find the row number of an examen by its ID in the Examens sheet */
async function findExamenRow(examenId: number): Promise<number | null> {
  const data = await getSheetData('A1:A1000', EXAMENS_SHEET_NAME);
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === String(examenId)) {
      return i + 1; // Row numbers are 1-based, +1 for header
    }
  }
  return null;
}

/** Append a new examen as a new row in the Examens sheet */
export async function addExamenRow(ex: Examen): Promise<void> {
  await appendSheetRow(examenToRow(ex), EXAMENS_SHEET_NAME);
}

/** Update specific fields of an examen in the Examens sheet */
export async function updateExamenInSheet(
  examenId: number,
  fields: UpdateExamenFields
): Promise<void> {
  const rowNum = await findExamenRow(examenId);
  if (!rowNum) {
    console.warn(`[Google Sheets] Examen #${examenId} non trouvé dans le sheet`);
    return;
  }

  // Get headers to find column indices
  const headerData = await getSheetData('A1:AI1', EXAMENS_SHEET_NAME);
  if (!headerData[0]) return;
  const headers = headerData[0];

  for (const [field, value] of Object.entries(fields)) {
    if (value === undefined) continue;

    const headerName = FIELD_TO_HEADER[field];
    if (!headerName) continue;

    const colIndex = headers.indexOf(headerName);
    if (colIndex === -1) continue;

    let cellValue: string;
    if (typeof value === 'boolean') {
      cellValue = value ? 'Oui' : 'Non';
    } else if (value === null) {
      cellValue = '';
    } else {
      cellValue = String(value);
    }

    await updateSheetCell(rowNum, colIndex, cellValue, EXAMENS_SHEET_NAME);
  }
}

/** Update the resultat of an examen in the Examens sheet */
export async function updateExamenResultatInSheet(
  examenId: number,
  resultat: string
): Promise<void> {
  await updateExamenInSheet(examenId, { resultat: resultat as Examen['resultat'] });
}

/** Mark resultat email as sent in the Examens sheet */
export async function markResultatEmailSentInSheet(
  examenIds: number[]
): Promise<void> {
  for (const id of examenIds) {
    await updateExamenInSheet(id, { resultatEmailSent: true });
  }
}
