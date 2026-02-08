import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getAllInscriptions, addInscription } from '@/lib/data/inscriptions';

const EXPECTED_HEADERS = [
  'Date', 'Civilité', 'Nom', 'Prénom', 'Email', 'Téléphone',
  'Date naissance', 'Adresse', 'Code postal', 'Ville',
  'N° CPF', 'N° Sécu', 'Financement', 'Langue', 'Niveau',
  'Objectif', 'Formation', 'Durée', 'Prix', 'Session début',
  'Session fin', 'Horaires', 'Lieu', 'Jours dispo', 'Créneaux',
  'Date début souhaitée', 'Commentaires',
];

const VALID_CIVILITES = ['M.', 'Mme', 'Autre'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTAL_REGEX = /^\d{5}$/;

function fixScientificNotation(val: string): string {
  if (!val) return '';
  // Detect scientific notation like 1.23457E+13
  if (/^\d+\.?\d*[eE][+\-]?\d+$/.test(val)) {
    try {
      const num = parseFloat(val);
      if (isFinite(num)) return num.toFixed(0);
    } catch { /* keep original */ }
  }
  return val;
}

function fixPhone(val: string): string {
  if (!val) return '';
  // Remove spaces, dots, dashes
  let phone = val.replace(/[\s.\-()]/g, '');
  // Fix scientific notation
  phone = fixScientificNotation(phone);
  // Add leading 0 if 9 digits (French mobile without 0)
  if (/^\d{9}$/.test(phone)) {
    phone = '0' + phone;
  }
  // Format +33 to 0
  if (phone.startsWith('+33')) {
    phone = '0' + phone.slice(3);
  }
  if (phone.startsWith('0033')) {
    phone = '0' + phone.slice(4);
  }
  return phone;
}

interface RowError {
  row: number;
  errors: string[];
}

function validateRow(
  row: Record<string, string>,
  rowNum: number,
  seenEmails: Set<string>,
  existingEmails: Set<string>,
): { errors: string[]; data: Record<string, string> | null } {
  const errors: string[] = [];

  const nom = (row['Nom'] || '').trim();
  const prenom = (row['Prénom'] || '').trim();
  const email = (row['Email'] || '').trim().toLowerCase();
  const telephone = fixPhone(row['Téléphone'] || '');
  const codePostal = (row['Code postal'] || '').trim();
  const civilite = (row['Civilité'] || '').trim();
  const dateNaissance = (row['Date naissance'] || '').trim();
  const numeroCPF = fixScientificNotation((row['N° CPF'] || '').trim());
  const numeroSecu = fixScientificNotation((row['N° Sécu'] || '').trim());
  const financement = (row['Financement'] || '').trim();
  const langue = (row['Langue'] || '').trim();
  const formation = (row['Formation'] || '').trim();

  // Required fields
  if (!nom) errors.push('Nom manquant');
  if (!prenom) errors.push('Prénom manquant');
  if (!email) {
    errors.push('Email manquant');
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push(`Email invalide : "${email}"`);
  }

  // Duplicates
  if (email && EMAIL_REGEX.test(email)) {
    if (existingEmails.has(email)) {
      errors.push(`Email déjà existant dans la base : "${email}"`);
    } else if (seenEmails.has(email)) {
      errors.push(`Email en doublon dans le fichier : "${email}"`);
    }
  }

  // Civilité
  if (civilite && !VALID_CIVILITES.includes(civilite)) {
    errors.push(`Civilité invalide : "${civilite}" (attendu : ${VALID_CIVILITES.join(', ')})`);
  }

  // Phone
  if (telephone && !/^0\d{9}$/.test(telephone)) {
    errors.push(`Téléphone invalide : "${telephone}" (attendu : 10 chiffres commençant par 0)`);
  }

  // Code postal
  if (codePostal && !POSTAL_REGEX.test(codePostal)) {
    errors.push(`Code postal invalide : "${codePostal}" (attendu : 5 chiffres)`);
  }

  // Date naissance
  if (dateNaissance) {
    const d = new Date(dateNaissance);
    if (isNaN(d.getTime())) {
      errors.push(`Date de naissance invalide : "${dateNaissance}"`);
    }
  }

  // Formation
  if (!formation) {
    errors.push('Formation manquante');
  }

  // Financement
  if (!financement) {
    errors.push('Mode de financement manquant');
  }

  // Langue
  if (!langue) {
    errors.push('Langue manquante');
  }

  if (errors.length > 0) {
    return { errors, data: null };
  }

  return {
    errors: [],
    data: {
      timestamp: row['Date'] || new Date().toISOString(),
      civilite,
      nom: nom.toUpperCase(),
      prenom,
      email,
      telephone,
      dateNaissance,
      adresse: (row['Adresse'] || '').trim(),
      codePostal,
      ville: (row['Ville'] || '').trim(),
      numeroCPF,
      numeroSecuriteSociale: numeroSecu,
      modeFinancement: financement,
      langue,
      niveauActuel: (row['Niveau'] || '').trim(),
      objectif: (row['Objectif'] || '').trim(),
      formationId: '',
      formationNom: formation,
      formationDuree: row['Durée'] ? `${row['Durée']}h` : '',
      formationPrix: row['Prix'] ? `${row['Prix']}€` : '',
      joursDisponibles: (row['Jours dispo'] || '').trim(),
      creneauxHoraires: (row['Créneaux'] || '').trim(),
      dateDebutSouhaitee: (row['Date début souhaitée'] || '').trim(),
      commentaires: (row['Commentaires'] || '').trim(),
    },
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json(
        { error: 'Le fichier ne contient aucune feuille' },
        { status: 400 }
      );
    }

    const sheet = workbook.Sheets[sheetName];
    const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, {
      defval: '',
      raw: false,
    });

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Le fichier ne contient aucune donnée' },
        { status: 400 }
      );
    }

    // Validate headers
    const fileHeaders = Object.keys(rows[0]);
    const missingHeaders = EXPECTED_HEADERS.filter(
      (h) => !fileHeaders.some((fh) => fh.trim().toLowerCase() === h.toLowerCase())
    );

    // Get existing emails
    const existing = await getAllInscriptions();
    const existingEmails = new Set(existing.map((i) => i.email.toLowerCase()));
    const seenEmails = new Set<string>();

    let imported = 0;
    const rowErrors: RowError[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because row 1 is headers, data starts at row 2

      // Skip completely empty rows
      const hasData = Object.values(row).some((v) => v && String(v).trim());
      if (!hasData) continue;

      const { errors, data } = validateRow(row, rowNum, seenEmails, existingEmails);

      if (errors.length > 0) {
        rowErrors.push({ row: rowNum, errors });
        continue;
      }

      if (data) {
        const email = data.email.toLowerCase();
        seenEmails.add(email);
        existingEmails.add(email);

        await addInscription({
          timestamp: data.timestamp,
          civilite: data.civilite,
          nom: data.nom,
          prenom: data.prenom,
          email: data.email,
          telephone: data.telephone,
          dateNaissance: data.dateNaissance,
          adresse: data.adresse,
          codePostal: data.codePostal,
          ville: data.ville,
          numeroCPF: data.numeroCPF,
          numeroSecuriteSociale: data.numeroSecuriteSociale,
          modeFinancement: data.modeFinancement,
          langue: data.langue,
          niveauActuel: data.niveauActuel,
          objectif: data.objectif,
          formationId: data.formationId,
          formationNom: data.formationNom,
          formationDuree: data.formationDuree,
          formationPrix: data.formationPrix,
          joursDisponibles: data.joursDisponibles,
          creneauxHoraires: data.creneauxHoraires,
          dateDebutSouhaitee: data.dateDebutSouhaitee,
          commentaires: data.commentaires,
        });

        imported++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      total: rows.length,
      errorsCount: rowErrors.length,
      errors: rowErrors,
      missingHeaders: missingHeaders.length > 0 ? missingHeaders : undefined,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'import du fichier' },
      { status: 500 }
    );
  }
}
