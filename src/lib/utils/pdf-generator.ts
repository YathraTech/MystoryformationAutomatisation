import { jsPDF } from 'jspdf';
import type { Inscription } from '@/types/admin';
import type { Examen } from '@/lib/data/examens';

// Logo en base64 (sera chargé dynamiquement)
let logoBase64: string | null = null;

// Tampons/signatures en base64
let tamponGagnyBase64: string | null = null;
let tamponSarcellesBase64: string | null = null;

async function loadLogo(): Promise<string | null> {
  if (logoBase64) return logoBase64;

  try {
    const response = await fetch('/logo-mystory.png');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        logoBase64 = reader.result as string;
        resolve(logoBase64);
      };
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function loadTampon(lieu: string): Promise<string | null> {
  const lieuLower = lieu?.toLowerCase() || '';

  if (lieuLower === 'gagny') {
    if (tamponGagnyBase64) return tamponGagnyBase64;
    try {
      const response = await fetch('/tampon_gagny.png');
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          tamponGagnyBase64 = reader.result as string;
          resolve(tamponGagnyBase64);
        };
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  if (lieuLower === 'sarcelles') {
    if (tamponSarcellesBase64) return tamponSarcellesBase64;
    try {
      const response = await fetch('/tampon_sarcelles.png');
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          tamponSarcellesBase64 = reader.result as string;
          resolve(tamponSarcellesBase64);
        };
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  return null;
}

function formatDate(date: string | null | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateSlash(date: string | null | undefined): string {
  if (!date) return '____ / ____ / ______';
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day} / ${month} / ${year}`;
}

// Cache pour l'image Google Maps
let mapsImageCache: Record<string, string> = {};

async function loadGoogleMapsImage(lat: number, lng: number): Promise<string | null> {
  const cacheKey = `${lat},${lng}`;
  if (mapsImageCache[cacheKey]) return mapsImageCache[cacheKey];

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  if (!key) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=640x320&scale=2&markers=color:red%7C${lat},${lng}&key=${key}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        mapsImageCache[cacheKey] = result;
        resolve(result);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function formatDateLong(date: string | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Caractères pour les cases à cocher
const CHECKBOX_EMPTY = '☐';
const CHECKBOX_CHECKED = '☑';

// Constantes entreprise
const COMPANY_NAME = 'MyStoryFormation';
const COMPANY_ADDRESS = '123 Rue de la Formation, 75001 Paris';
const COMPANY_PHONE = '01 23 45 67 89';
const COMPANY_EMAIL = 'contact@mystoryformation.fr';
const COMPANY_SIRET = '123 456 789 00012';

// Centres d'examen
const EXAM_LOCATIONS: Record<string, {
  name: string;
  address: string;
  codePostal: string;
  ville: string;
  fullAddress: string;
  coordinates: { lat: number; lng: number };
  transport: { rer?: string; bus?: string; metro?: string; parking?: string };
  accessNotes?: string;
}> = {
  gagny: {
    name: 'Centre d\'examen de Gagny',
    address: '1 Avenue du Chemin de Fer',
    codePostal: '93220',
    ville: 'Gagny',
    fullAddress: '1 Avenue du Chemin de Fer, 93220 Gagny',
    coordinates: { lat: 48.8834, lng: 2.5354 },
    transport: {
      rer: 'RER E — Arrêt Gagny (5 min à pied)',
      bus: 'Bus 643, 621 — Arrêt Gagny Centre',
      parking: 'Parking gratuit disponible à proximité du centre',
    },
    accessNotes: 'Entrée principale par l\'avenue du Chemin de Fer. Accueil au rez-de-chaussée.',
  },
  sarcelles: {
    name: 'Centre d\'examen de Sarcelles',
    address: '15 Boulevard de la Gare',
    codePostal: '95200',
    ville: 'Sarcelles',
    fullAddress: '15 Boulevard de la Gare, 95200 Sarcelles',
    coordinates: { lat: 48.9955, lng: 2.3808 },
    transport: {
      rer: 'RER D — Arrêt Garges-Sarcelles (10 min à pied)',
      bus: 'Bus 268, 252 — Arrêt Sarcelles Gare',
      parking: 'Parking public disponible Boulevard de la Gare',
    },
    accessNotes: 'Entrée par le boulevard de la Gare. Salle d\'examen au 1er étage.',
  },
};

// Détails des épreuves par type d'examen
const EXAM_EPREUVES: Record<string, {
  titre: string;
  description: string;
  epreuves: { nom: string; code: string; duree: string; description: string }[];
  consignesGenerales: string[];
}> = {
  TEF_IRN: {
    titre: 'Test d\'Évaluation de Français — Intégration, Résidence et Nationalité',
    description: 'Le TEF IRN évalue vos compétences en français dans le cadre d\'une demande de carte de résident ou de nationalité française. L\'examen se déroule sur ordinateur.',
    epreuves: [
      {
        code: 'CO',
        nom: 'Compréhension Orale',
        duree: '40 min',
        description: 'Écoute de documents sonores (dialogues, annonces, extraits radio) suivie de questions à choix multiples.',
      },
      {
        code: 'CE',
        nom: 'Compréhension Écrite',
        duree: '60 min',
        description: 'Lecture de textes (articles, courriers, annonces) suivie de questions à choix multiples.',
      },
      {
        code: 'EE',
        nom: 'Expression Écrite',
        duree: '60 min',
        description: 'Rédaction de textes : rédiger un message, un courriel ou un texte argumentatif selon le niveau visé.',
      },
      {
        code: 'EO',
        nom: 'Expression Orale',
        duree: '15 min',
        description: 'Entretien individuel face à un examinateur : présentation personnelle, discussion sur un sujet donné.',
      },
    ],
    consignesGenerales: [
      'L\'examen se déroule intégralement sur ordinateur (sauf Expression Orale).',
      'Un casque audio vous sera fourni pour la Compréhension Orale.',
      'Aucun brouillon n\'est autorisé sauf feuille fournie par le centre.',
      'Les résultats sont disponibles sous 4 à 6 semaines après l\'examen.',
    ],
  },
  CIVIQUE: {
    titre: 'Test de Connaissances Civiques',
    description: 'L\'examen civique évalue vos connaissances sur les valeurs et principes de la République française, dans le cadre d\'une demande de titre de séjour ou de naturalisation.',
    epreuves: [
      {
        code: 'QCM',
        nom: 'Valeurs et Principes de la République',
        duree: '30 min',
        description: 'Questionnaire à choix multiples portant sur l\'histoire de France, les institutions, les droits et devoirs des citoyens, et les valeurs de la République.',
      },
    ],
    consignesGenerales: [
      'L\'examen se déroule sur ordinateur sous forme de QCM.',
      'Les questions portent sur les valeurs de la République, l\'histoire et les institutions françaises.',
      'Les résultats sont communiqués à l\'issue de l\'examen.',
    ],
  },
};

function addHeader(doc: jsPDF, title: string) {
  // En-tête entreprise
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_NAME, 20, 25);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_ADDRESS, 20, 32);
  doc.text(`Tél: ${COMPANY_PHONE} | Email: ${COMPANY_EMAIL}`, 20, 37);
  doc.text(`SIRET: ${COMPANY_SIRET}`, 20, 42);

  // Ligne de séparation
  doc.setLineWidth(0.5);
  doc.line(20, 48, 190, 48);

  // Titre du document
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 105, 60, { align: 'center' });

  // Date du document
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Paris, le ${today}`, 190, 70, { align: 'right' });
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function addFooter(doc: jsPDF) {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Document généré automatiquement - MyStoryFormation',
    105,
    pageHeight - 15,
    { align: 'center' }
  );
}

export async function generateAttestationPaiement(
  inscription: Inscription,
  examen: Examen,
  commercialNom?: string
): Promise<{ blob: Blob; fileName: string }> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Charger les assets
  const logo = await loadLogo();
  const tampon = await loadTampon(examen.lieuConfiguration || '');

  // ===== HEADER =====
  doc.setFillColor(30, 30, 30);
  doc.rect(0, 0, pageWidth, 5, 'F');
  doc.setFillColor(60, 60, 60);
  doc.rect(0, 5, pageWidth, 1, 'F');

  let headerY = 10;
  if (logo) {
    const logoWidth = 45;
    const logoHeight = logoWidth / 3.59;
    doc.addImage(logo, 'PNG', (pageWidth - logoWidth) / 2, headerY, logoWidth, logoHeight);
    headerY += logoHeight + 5;
  } else {
    headerY += 8;
  }

  // Titre
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text('ATTESTATION DE PAIEMENT', pageWidth / 2, headerY, { align: 'center' });
  headerY += 3;
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.6);
  doc.line(pageWidth / 2 - 35, headerY, pageWidth / 2 + 35, headerY);

  let y = headerY + 10;

  // ===== CANDIDAT =====
  doc.setFillColor(30, 30, 30);
  doc.roundedRect(margin, y, contentWidth, 6, 1, 1, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('CANDIDAT', margin + 3, y + 4.2);
  y += 10;

  const nomComplet = `${inscription.civilite || ''} ${inscription.prenom || ''} ${inscription.nom || ''}`.trim();
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(nomComplet || '___________________________________', margin, y);
  y += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Tél: ${inscription.telephone || ''}     Email: ${inscription.email || ''}`, margin, y);
  y += 10;

  // ===== EXAMEN =====
  doc.setFillColor(30, 30, 30);
  doc.roundedRect(margin, y, contentWidth, 6, 1, 1, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('EXAMEN', margin + 3, y + 4.2);
  y += 10;

  // Parse diplome
  const diplome = examen.diplome || '';
  const attestExamTypeLabels: Record<string, string> = { 'TEF_IRN': 'TEF IRN', 'CIVIQUE': 'Examen Civique' };
  const attestOptionLabels: Record<string, string> = {
    'A1': 'Niveau A1', 'A2': 'Niveau A2', 'B1': 'Niveau B1', 'B2': 'Niveau B2',
    'carte_pluriannuelle': 'Carte pluriannuelle', 'carte_residence': 'Carte de résident', 'naturalisation': 'Naturalisation',
  };
  let examTypeName = '';
  let mentionText = '';
  if (diplome) {
    const parts = diplome.split(':');
    if (parts.length === 2) {
      examTypeName = attestExamTypeLabels[parts[0]] || parts[0];
      mentionText = attestOptionLabels[parts[1]] || parts[1];
    } else {
      const code = diplome.toUpperCase();
      if (attestExamTypeLabels[code]) examTypeName = attestExamTypeLabels[code];
      else if (attestOptionLabels[diplome]) mentionText = attestOptionLabels[diplome];
      else examTypeName = diplome;
    }
  }

  const col3 = contentWidth / 3;

  // Ligne 1: Examen + Mention
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('EXAMEN', margin, y);
  doc.text('MENTION', margin + col3, y);
  y += 4;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(examTypeName || '—', margin, y);
  doc.text(mentionText || '—', margin + col3, y);
  y += 8;

  // Ligne 2: Date / Heure / Lieu (en gras)
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('DATE', margin, y);
  doc.text('HEURE', margin + col3, y);
  doc.text('LIEU', margin + col3 * 2, y);
  y += 4;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(examen.dateExamen ? formatDateSlash(examen.dateExamen) : '—', margin, y);
  doc.text(examen.heureExamen || '—', margin + col3, y);
  doc.text(examen.lieu || '—', margin + col3 * 2, y);
  y += 10;

  // ===== RÈGLEMENT =====
  doc.setFillColor(30, 30, 30);
  doc.roundedRect(margin, y, contentWidth, 6, 1, 1, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('RÈGLEMENT', margin + 3, y + 4.2);
  y += 10;

  // Montant + remise
  const prixBase = examen.prix;
  const remiseNote = examen.remises || '';

  doc.setFillColor(240, 240, 240);
  doc.roundedRect(margin, y - 1, contentWidth / 2 - 5, 12, 1.5, 1.5, 'F');
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  doc.text('MONTANT TOTAL', margin + 3, y + 2);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(prixBase !== null && prixBase !== undefined ? `${prixBase} €` : '_____ €', margin + 3, y + 9);

  // Remise (si présente)
  if (remiseNote) {
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('REMISE', margin + contentWidth / 2, y + 2);
    doc.setFontSize(9);
    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.text(remiseNote, margin + contentWidth / 2, y + 8, { maxWidth: contentWidth / 2 - 5 });
  }
  y += 16;

  // Mode de paiement
  const modePaiementLabels: Record<string, string> = {
    'carte_bancaire': 'Carte bancaire',
    'especes': 'Espèces',
    'cpf': 'CPF',
    'lien_paiement': 'Lien de paiement',
    'mixte': 'Mixte (Espèces + CB)',
    'autre': 'Autre',
  };
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('MODE DE PAIEMENT', margin, y);
  y += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(modePaiementLabels[examen.moyenPaiement || ''] || '—', margin, y);
  y += 8;

  // Détail paiement mixte
  if (examen.moyenPaiement === 'mixte' && (examen.montantEspeces || examen.montantCb)) {
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('DÉTAIL DU PAIEMENT', margin, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    const parts: string[] = [];
    if (examen.montantEspeces) parts.push(`${examen.montantEspeces} € en espèces`);
    if (examen.montantCb) parts.push(`${examen.montantCb} € par carte bancaire`);
    doc.text(parts.join(' + '), margin, y);
    y += 8;
  }

  // Date du paiement
  const datePaiement = examen.datePaiement
    ? formatDateSlash(examen.datePaiement)
    : formatDateSlash(examen.updatedAt || examen.createdAt);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('DATE DE PAIEMENT', margin, y);
  y += 4;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(datePaiement, margin, y);
  y += 10;

  // Vendu par
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('VENDU PAR', margin, y);
  y += 4;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(commercialNom || '___________________________________', margin, y);
  y += 12;

  // ===== FAIT À =====
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  const lieuFait = examen.lieuConfiguration || examen.lieu || '..............';
  const today = formatDateSlash(new Date().toISOString());
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(`Fait à ${lieuFait}, le ${today}`, margin, y);
  y += 10;

  // Cachet organisme
  const signatureBoxWidth = contentWidth / 2;
  const signatureBoxHeight = 35;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, y, signatureBoxWidth, signatureBoxHeight, 1.5, 1.5, 'S');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text("Cachet de l'organisme", margin + signatureBoxWidth / 2, y + 4, { align: 'center' });

  if (tampon) {
    const tamponWidth = 38;
    const tamponX = margin + (signatureBoxWidth - tamponWidth) / 2;
    doc.addImage(tampon, 'PNG', tamponX, y + 7, tamponWidth, 28);
  }

  y += signatureBoxHeight + 10;

  // ===== AVERTISSEMENT EN ROUGE EN BAS =====
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38); // Rouge
  doc.text('EXAMEN SUR ORDINATEUR', pageWidth / 2, y, { align: 'center' });
  y += 9;
  doc.text('NON REMBOURSABLE', pageWidth / 2, y, { align: 'center' });

  // ===== FOOTER =====
  doc.setFillColor(40, 40, 40);
  doc.rect(0, pageHeight - 5, pageWidth, 5, 'F');
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  doc.text('MyStoryFormation - Document officiel', pageWidth / 2, pageHeight - 1.5, { align: 'center' });

  const fileName = `attestation_paiement_${inscription.nom}_${inscription.prenom}.pdf`;
  const blob = doc.output('blob');
  return { blob, fileName };
}

export async function generateAttestationReussite(
  examen: Examen,
  diplomeLabel?: string
): Promise<{ blob: Blob; fileName: string }> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Charger les assets
  const logo = await loadLogo();
  const tampon = await loadTampon(examen.lieuConfiguration || '');

  // ===== HEADER =====
  doc.setFillColor(30, 30, 30);
  doc.rect(0, 0, pageWidth, 5, 'F');
  doc.setFillColor(60, 60, 60);
  doc.rect(0, 5, pageWidth, 1, 'F');

  let headerY = 10;
  if (logo) {
    const logoWidth = 45;
    const logoHeight = logoWidth / 3.59;
    doc.addImage(logo, 'PNG', (pageWidth - logoWidth) / 2, headerY, logoWidth, logoHeight);
    headerY += logoHeight + 5;
  } else {
    headerY += 8;
  }

  // Titre
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text('ATTESTATION DE RÉUSSITE', pageWidth / 2, headerY, { align: 'center' });
  headerY += 3;
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.6);
  doc.line(pageWidth / 2 - 35, headerY, pageWidth / 2 + 35, headerY);

  let y = headerY + 10;

  // ===== CANDIDAT =====
  doc.setFillColor(30, 30, 30);
  doc.roundedRect(margin, y, contentWidth, 6, 1, 1, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('CANDIDAT', margin + 3, y + 4.2);
  y += 10;

  const nomComplet = `${examen.civilite || ''} ${examen.prenom || ''} ${examen.nom || ''}`.trim();
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(nomComplet || '—', margin, y);
  y += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Né(e) le : ${examen.dateNaissance ? formatDateSlash(examen.dateNaissance) : '—'}`, margin, y);
  y += 12;

  // ===== EXAMEN =====
  doc.setFillColor(30, 30, 30);
  doc.roundedRect(margin, y, contentWidth, 6, 1, 1, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('EXAMEN', margin + 3, y + 4.2);
  y += 10;

  // Parse diplome
  const diplome = examen.diplome || '';
  const attestExamTypeLabels: Record<string, string> = { 'TEF_IRN': 'TEF IRN', 'CIVIQUE': 'Examen Civique' };
  const attestOptionLabels: Record<string, string> = {
    'A1': 'Niveau A1', 'A2': 'Niveau A2', 'B1': 'Niveau B1', 'B2': 'Niveau B2',
    'carte_pluriannuelle': 'Carte pluriannuelle', 'carte_residence': 'Carte de résident', 'naturalisation': 'Naturalisation',
  };
  let examTypeName = '';
  let mentionText = '';
  if (diplome) {
    const parts = diplome.split(':');
    if (parts.length === 2) {
      examTypeName = attestExamTypeLabels[parts[0]] || parts[0];
      mentionText = attestOptionLabels[parts[1]] || parts[1];
    } else {
      const code = diplome.toUpperCase();
      if (attestExamTypeLabels[code]) examTypeName = attestExamTypeLabels[code];
      else examTypeName = diplome;
    }
  }

  const col3 = contentWidth / 3;

  // Ligne 1: Examen + Diplôme
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('TYPE D\'EXAMEN', margin, y);
  doc.text('DIPLÔME / MENTION', margin + col3, y);
  y += 4;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(examTypeName || '—', margin, y);
  doc.text(diplomeLabel || mentionText || '—', margin + col3, y);
  y += 8;

  // Ligne 2: Date / Lieu
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('DATE DE L\'EXAMEN', margin, y);
  doc.text('LIEU', margin + col3, y);
  y += 4;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(examen.dateExamen ? formatDateSlash(examen.dateExamen) : '—', margin, y);
  doc.text(examen.lieu || '—', margin + col3, y);
  y += 12;

  // ===== RÉSULTAT =====
  doc.setFillColor(30, 30, 30);
  doc.roundedRect(margin, y, contentWidth, 6, 1, 1, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('RÉSULTAT', margin + 3, y + 4.2);
  y += 10;

  // Bandeau vert réussite
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('EXAMEN RÉUSSI', pageWidth / 2, y + 9, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(21, 128, 61);
  doc.text(
    `Nous certifions que ${nomComplet} a réussi l'examen mentionné ci-dessus.`,
    pageWidth / 2,
    y + 16,
    { align: 'center', maxWidth: contentWidth - 20 }
  );
  y += 30;

  // ===== FAIT À =====
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  const lieuFait = examen.lieuConfiguration || examen.lieu || '..............';
  const today = formatDateSlash(new Date().toISOString());
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(`Fait à ${lieuFait}, le ${today}`, margin, y);
  y += 10;

  // Cachet organisme
  const signatureBoxWidth = contentWidth / 2;
  const signatureBoxHeight = 35;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, y, signatureBoxWidth, signatureBoxHeight, 1.5, 1.5, 'S');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text("Cachet de l'organisme", margin + signatureBoxWidth / 2, y + 4, { align: 'center' });

  if (tampon) {
    const tamponWidth = 38;
    const tamponX = margin + (signatureBoxWidth - tamponWidth) / 2;
    doc.addImage(tampon, 'PNG', tamponX, y + 7, tamponWidth, 28);
  }

  // ===== FOOTER =====
  doc.setFillColor(40, 40, 40);
  doc.rect(0, pageHeight - 5, pageWidth, 5, 'F');
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  doc.text('MyStoryFormation - Document officiel', pageWidth / 2, pageHeight - 1.5, { align: 'center' });

  const fileName = `attestation_reussite_${examen.nom}_${examen.prenom}.pdf`;
  const blob = doc.output('blob');
  return { blob, fileName };
}

export async function generateFicheInscription(
  inscription: Inscription,
  examen: Examen,
  motivationLabels?: Record<string, string>
): Promise<{ blob: Blob; fileName: string }> {
  const doc = new jsPDF('p', 'mm', 'a4'); // Explicit A4
  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // Couleurs du design — thème noir et blanc
  const primaryColor: [number, number, number] = [30, 30, 30]; // Noir
  const secondaryColor: [number, number, number] = [60, 60, 60]; // Gris foncé
  const accentColor: [number, number, number] = [30, 30, 30]; // Noir (règlement)
  const darkText: [number, number, number] = [20, 20, 20]; // Noir texte
  const lightText: [number, number, number] = [100, 100, 100]; // Gris labels
  const bgLight: [number, number, number] = [240, 240, 240]; // Gris clair fond

  // Charger les assets
  const logo = await loadLogo();
  const tampon = await loadTampon(examen.lieuConfiguration || '');

  // ===== HEADER =====
  // Bande colorée en haut
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 6, 'F');
  doc.setFillColor(...secondaryColor);
  doc.rect(0, 6, pageWidth, 1.5, 'F');

  // Logo centré
  let headerY = 12;
  if (logo) {
    const logoWidth = 45;
    const logoHeight = logoWidth / 3.59;
    doc.addImage(logo, 'PNG', (pageWidth - logoWidth) / 2, headerY, logoWidth, logoHeight);
    headerY += logoHeight + 5;
  } else {
    headerY += 8;
  }

  // Titre
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text("FICHE D'INSCRIPTION EXAMEN", pageWidth / 2, headerY, { align: 'center' });

  // Ligne décorative
  headerY += 4;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.6);
  doc.line(pageWidth / 2 - 25, headerY, pageWidth / 2 + 25, headerY);

  // ===== INFO BAR =====
  headerY += 5;
  doc.setFillColor(...bgLight);
  doc.roundedRect(margin, headerY, contentWidth, 10, 1.5, 1.5, 'F');

  doc.setFontSize(8);
  doc.setTextColor(...lightText);
  doc.setFont('helvetica', 'normal');
  doc.text('Date de l\'examen :', margin + 4, headerY + 6);
  doc.setTextColor(...darkText);
  doc.setFont('helvetica', 'bold');
  doc.text(examen.dateExamen ? formatDateSlash(examen.dateExamen) : '__/__/____', margin + 38, headerY + 6);

  let y = headerY + 16;

  // ===== HELPER FUNCTIONS =====
  const drawSectionHeader = (title: string) => {
    doc.setFillColor(...primaryColor);
    doc.roundedRect(margin, y, contentWidth, 6, 1, 1, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(title, margin + 3, y + 4.2);
    y += 9;
  };

  const drawField = (label: string, value: string, x: number, width: number, highlight: boolean = false) => {
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...lightText);
    doc.text(label.toUpperCase(), x, y);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(highlight ? primaryColor[0] : darkText[0], highlight ? primaryColor[1] : darkText[1], highlight ? primaryColor[2] : darkText[2]);
    doc.text(value || '—', x, y + 4, { maxWidth: width - 3 });
  };

  const drawFieldRow = (fields: Array<{label: string, value: string, highlight?: boolean}>) => {
    const fieldWidth = contentWidth / fields.length;
    fields.forEach((field, index) => {
      drawField(field.label, field.value, margin + (fieldWidth * index), fieldWidth, field.highlight);
    });
    y += 10;
  };

  // ===== SECTION: IDENTITÉ =====
  drawSectionHeader('IDENTITÉ DU CANDIDAT');

  const nomComplet = `${inscription.civilite || ''} ${inscription.nom || ''} ${inscription.prenom || ''}`.trim();
  drawField('Civilité, Nom et Prénom', nomComplet, margin, contentWidth, true);
  y += 10;

  drawFieldRow([
    { label: 'Date de naissance', value: inscription.dateNaissance ? formatDateSlash(inscription.dateNaissance) : '' },
    { label: 'Ville de naissance', value: examen.villeNaissance || '' },
  ]);

  drawFieldRow([
    { label: 'Pays de naissance', value: examen.lieuNaissance || '' },
  ]);

  drawFieldRow([
    { label: 'Nationalité', value: examen.nationalite || '' },
    { label: 'Langue maternelle', value: examen.langueMaternelle || '' },
  ]);

  drawFieldRow([
    { label: 'N° Passeport', value: examen.numeroPasseport || '' },
    { label: 'N° Carte d\'identité', value: examen.numeroCni || '' },
  ]);

  y += 2;

  // ===== SECTION: COORDONNÉES =====
  drawSectionHeader('COORDONNÉES');

  const adresseComplete = inscription.adresse
    ? `${inscription.adresse}, ${inscription.codePostal} ${inscription.ville}`
    : '';
  drawField('Adresse complète', adresseComplete, margin, contentWidth);
  y += 10;

  drawFieldRow([
    { label: 'Téléphone', value: inscription.telephone || '' },
    { label: 'Email', value: inscription.email || '' },
  ]);

  y += 2;

  // ===== SECTION: EXAMEN =====
  drawSectionHeader('DÉTAILS DE L\'EXAMEN');

  // Labels pour les types d'examens souhaités
  const examTypeLabels: Record<string, string> = {
    'TEF_IRN': 'TEF IRN',
    'CIVIQUE': 'Examen Civique',
  };

  // Labels pour les niveaux/options
  const optionLabels: Record<string, string> = {
    'A1': 'Niveau A1',
    'A2': 'Niveau A2',
    'B1': 'Niveau B1',
    'B2': 'Niveau B2',
    'carte_pluriannuelle': 'Carte pluriannuelle',
    'carte_residence': 'Carte de résident',
    'naturalisation': 'Naturalisation',
  };

  // Parse le diplome (format: "TYPE_CODE:OPTION_CODE" ou juste "TYPE_CODE")
  let examTypeName = '';
  let optionName = '';

  if (examen.diplome) {
    const parts = examen.diplome.split(':');
    if (parts.length === 2) {
      // Nouveau format: TYPE_CODE:OPTION_CODE
      const typeCode = parts[0];
      const optionCode = parts[1];
      examTypeName = examTypeLabels[typeCode] || typeCode;
      optionName = optionLabels[optionCode] || optionCode;
    } else {
      // Ancien format ou juste le code
      const code = examen.diplome.toUpperCase();
      if (examTypeLabels[code]) {
        examTypeName = examTypeLabels[code];
      } else if (optionLabels[examen.diplome]) {
        optionName = optionLabels[examen.diplome];
      } else {
        examTypeName = examen.diplome;
      }
    }
  }

  // Afficher l'examen souhaité en premier
  drawField('Examen Souhaité', examTypeName || '—', margin, contentWidth, true);
  y += 10;

  // Afficher le niveau visé / mention visée
  drawField('Niveau visé / Mention visée', optionName || '—', margin, contentWidth, true);
  y += 10;

  const thirdWidth = contentWidth / 3;
  drawField('Date', examen.dateExamen ? formatDateSlash(examen.dateExamen) : '', margin, thirdWidth);
  drawField('Heure', examen.heureExamen || '', margin + thirdWidth, thirdWidth);
  drawField('Lieu', examen.lieu || '', margin + thirdWidth * 2, thirdWidth);
  y += 10;

  const sourceLabels: Record<string, string> = {
    'google': 'Google', 'bouche_a_oreille': 'Bouche-à-oreille',
    'reseaux_sociaux': 'Réseaux sociaux', 'autre': 'Autre',
  };
  drawFieldRow([
    { label: 'Mode', value: examen.distanciel ? 'À distance' : 'Présentiel' },
    { label: 'Source', value: sourceLabels[examen.sourceConnaissance || ''] || examen.sourceConnaissance || '' },
  ]);

  // Motivation du candidat
  const defaultMotivationLabels: Record<string, string> = {
    'nationalite_francaise': 'Accès à la nationalité française',
    'carte_resident': 'Demande de carte de résident',
    'titre_sejour': 'Demande de titre de séjour',
    'autre': 'Autre(s)',
  };
  const labels = motivationLabels || defaultMotivationLabels;
  const motivationValue = examen.motivation === 'autre' && examen.motivationAutre
    ? examen.motivationAutre
    : labels[examen.motivation || ''] || examen.motivation || '';
  drawField('Motivation', motivationValue, margin, contentWidth);
  y += 10;

  y += 2;

  // ===== SECTION: RÈGLEMENT =====
  doc.setFillColor(...accentColor);
  doc.roundedRect(margin, y, contentWidth, 6, 1, 1, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('RÈGLEMENT', margin + 3, y + 4.2);
  y += 9;

  const moyenPaiementLabels: Record<string, string> = {
    'carte_bancaire': 'Carte bancaire', 'lien_paiement': 'Lien de paiement', 'especes': 'Espèces', 'cpf': 'CPF', 'mixte': 'Mixte (Espèces + CB)', 'autre': 'Autre',
  };

  // Box montant
  doc.setFillColor(...bgLight);
  doc.roundedRect(margin, y - 1, contentWidth / 2 - 5, 12, 1.5, 1.5, 'F');
  doc.setFontSize(6);
  doc.setTextColor(...lightText);
  doc.text('MONTANT', margin + 3, y + 2);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text(examen.prix !== null && examen.prix !== undefined ? `${examen.prix} €` : '— €', margin + 3, y + 8);

  // Box moyen de paiement (même hauteur, à droite)
  const mpX = margin + contentWidth / 2;
  doc.setFillColor(...bgLight);
  doc.roundedRect(mpX, y - 1, contentWidth / 2, 12, 1.5, 1.5, 'F');
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...lightText);
  doc.text('MOYEN DE PAIEMENT', mpX + 3, y + 2);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text(moyenPaiementLabels[examen.moyenPaiement || ''] || '—', mpX + 3, y + 8);
  y += 14;

  // Détail paiement mixte
  if (examen.moyenPaiement === 'mixte' && (examen.montantEspeces || examen.montantCb)) {
    doc.setFillColor(...bgLight);
    doc.roundedRect(margin, y - 1, contentWidth, 10, 1.5, 1.5, 'F');
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...lightText);
    doc.text('DÉTAIL DU PAIEMENT', margin + 3, y + 2);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkText);
    const parts: string[] = [];
    if (examen.montantEspeces) parts.push(`${examen.montantEspeces} € en espèces`);
    if (examen.montantCb) parts.push(`${examen.montantCb} € par CB`);
    doc.text(parts.join(' + '), margin + 3, y + 7);
    y += 12;
  }

  // ===== SIGNATURES =====
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);
  y += 5;

  // Fait à
  const lieuFait = examen.lieuConfiguration || examen.lieu || '..............';
  const today = formatDateSlash(new Date().toISOString());
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkText);
  doc.text(`Fait à ${lieuFait}, le ${today}`, margin, y);

  y += 8;

  // Box cachet de l'organisme (sans signature candidat)
  const signatureBoxWidth = contentWidth / 2;
  const signatureBoxHeight = 38;

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, y, signatureBoxWidth, signatureBoxHeight, 1.5, 1.5, 'S');
  doc.setFontSize(7);
  doc.setTextColor(...lightText);
  doc.text("Cachet de l'organisme", margin + signatureBoxWidth / 2, y + 4, { align: 'center' });

  // Tampon
  if (tampon) {
    const tamponWidth = 38;
    const tamponX = margin + (signatureBoxWidth - tamponWidth) / 2;
    doc.addImage(tampon, 'PNG', tamponX, y + 7, tamponWidth, 28);
  }

  // ===== FOOTER =====
  doc.setFillColor(40, 40, 40);
  doc.rect(0, pageHeight - 5, pageWidth, 5, 'F');
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  doc.text('MyStoryFormation - Document officiel', pageWidth / 2, pageHeight - 1.5, { align: 'center' });

  const fileName = `fiche_inscription_${inscription.nom}_${inscription.prenom}.pdf`;
  const blob = doc.output('blob');
  return { blob, fileName };
}

export async function generateConvocation(
  inscription: Inscription,
  examen: Examen
): Promise<{ blob: Blob; fileName: string }> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const totalPages = 3;

  // Couleurs du thème
  const primaryColor: [number, number, number] = [30, 30, 30];
  const secondaryColor: [number, number, number] = [60, 60, 60];
  const darkText: [number, number, number] = [20, 20, 20];
  const lightText: [number, number, number] = [100, 100, 100];
  const bgLight: [number, number, number] = [240, 240, 240];

  // Charger les assets
  const logo = await loadLogo();
  const tampon = await loadTampon(examen.lieuConfiguration || '');

  // Lookup lieu
  const lieuKey = (examen.lieuConfiguration || examen.lieu || '').toLowerCase();
  const locationInfo = EXAM_LOCATIONS[lieuKey] || null;

  // Charger la carte Google Maps si on a les coordonnées
  let mapsImage: string | null = null;
  if (locationInfo) {
    mapsImage = await loadGoogleMapsImage(locationInfo.coordinates.lat, locationInfo.coordinates.lng);
  }

  // Lookup épreuves
  const diplomeCode = (examen.diplome || '').split(':')[0];
  const epreuvesInfo = EXAM_EPREUVES[diplomeCode] || null;

  // Parse diplome labels
  const examTypeLabels: Record<string, string> = { 'TEF_IRN': 'TEF IRN', 'CIVIQUE': 'Examen Civique' };
  const optionLabels: Record<string, string> = {
    'A1': 'Niveau A1', 'A2': 'Niveau A2', 'B1': 'Niveau B1', 'B2': 'Niveau B2',
    'carte_pluriannuelle': 'Carte pluriannuelle', 'carte_residence': 'Carte de résident', 'naturalisation': 'Naturalisation',
  };
  let examTypeName = '';
  let mentionText = '';
  if (examen.diplome) {
    const parts = examen.diplome.split(':');
    if (parts.length === 2) {
      examTypeName = examTypeLabels[parts[0]] || parts[0];
      mentionText = optionLabels[parts[1]] || parts[1];
    } else {
      examTypeName = examTypeLabels[examen.diplome.toUpperCase()] || examen.diplome;
    }
  }

  // ===== HELPER: draw page header =====
  const drawPageHeader = (title: string) => {
    // Bande noire + grise
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 5, 'F');
    doc.setFillColor(...secondaryColor);
    doc.rect(0, 5, pageWidth, 1, 'F');

    let hY = 10;
    if (logo) {
      const logoWidth = 45;
      const logoHeight = logoWidth / 3.59;
      doc.addImage(logo, 'PNG', (pageWidth - logoWidth) / 2, hY, logoWidth, logoHeight);
      hY += logoHeight + 5;
    } else {
      hY += 8;
    }

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkText);
    doc.text(title, pageWidth / 2, hY, { align: 'center' });
    hY += 3;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.6);
    doc.line(pageWidth / 2 - 35, hY, pageWidth / 2 + 35, hY);

    return hY + 8;
  };

  // ===== HELPER: draw section header bar =====
  const drawSectionHeader = (title: string, yPos: number): number => {
    doc.setFillColor(...primaryColor);
    doc.roundedRect(margin, yPos, contentWidth, 6, 1, 1, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(title, margin + 3, yPos + 4.2);
    return yPos + 9;
  };

  // ===== HELPER: draw footer =====
  const drawFooter = (pageNum: number) => {
    doc.setFillColor(40, 40, 40);
    doc.rect(0, pageHeight - 5, pageWidth, 5, 'F');
    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);
    doc.text(`MyStoryFormation - Convocation - Page ${pageNum}/${totalPages}`, pageWidth / 2, pageHeight - 1.5, { align: 'center' });
  };

  // ================================================================
  // PAGE 1 — CONVOCATION
  // ================================================================
  let y = drawPageHeader('CONVOCATION À L\'EXAMEN');

  // Section CANDIDAT
  y = drawSectionHeader('CANDIDAT', y);
  const nomComplet = `${inscription.civilite || ''} ${inscription.prenom || ''} ${inscription.nom || ''}`.trim();
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text(nomComplet || '—', margin, y + 1);
  y += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...lightText);
  const adresseCandidat = inscription.adresse
    ? `${inscription.adresse}, ${inscription.codePostal || ''} ${inscription.ville || ''}`.trim()
    : '';
  if (adresseCandidat) {
    doc.text(adresseCandidat, margin, y);
    y += 5;
  }
  doc.text(`Tél: ${inscription.telephone || '—'}     Email: ${inscription.email || '—'}`, margin, y);
  y += 10;

  // Section DÉTAILS DE L'EXAMEN
  y = drawSectionHeader('DÉTAILS DE L\'EXAMEN', y);

  const col3 = contentWidth / 3;

  // Examen + Mention
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...lightText);
  doc.text('EXAMEN', margin, y);
  doc.text('MENTION', margin + col3, y);
  y += 4;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text(examTypeName || '—', margin, y);
  doc.text(mentionText || '—', margin + col3, y);
  y += 8;

  // Date / Heure / Lieu
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...lightText);
  doc.text('DATE', margin, y);
  doc.text('HEURE', margin + col3, y);
  doc.text('LIEU', margin + col3 * 2, y);
  y += 4;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text(examen.dateExamen ? formatDateLong(examen.dateExamen) : '—', margin, y, { maxWidth: col3 - 5 });
  doc.text(examen.heureExamen || '—', margin + col3, y);
  doc.text(examen.lieu || '—', margin + col3 * 2, y);
  y += 8;

  // Adresse complète du centre
  if (locationInfo) {
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...lightText);
    doc.text('ADRESSE DU CENTRE', margin, y);
    y += 4;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkText);
    doc.text(locationInfo.fullAddress, margin, y);
    y += 8;
  } else {
    y += 4;
  }

  y += 2;

  // Section DOCUMENTS À APPORTER
  y = drawSectionHeader('DOCUMENTS À APPORTER', y);
  const documents = [
    'Une pièce d\'identité en cours de validité (carte d\'identité ou passeport)',
    'Cette convocation imprimée',
    'Un stylo noir',
  ];
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkText);
  documents.forEach((item) => {
    doc.text(`•  ${item}`, margin + 2, y);
    y += 6;
  });
  y += 4;

  // Section INFORMATIONS IMPORTANTES
  y = drawSectionHeader('INFORMATIONS IMPORTANTES', y);
  const infos = [
    'Veuillez vous présenter 15 minutes avant l\'heure de convocation.',
    'Tout retard pourra entraîner l\'exclusion de l\'examen.',
    'Les téléphones portables doivent être éteints et rangés.',
    'Aucun matériel non autorisé ne sera toléré dans la salle d\'examen.',
  ];
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkText);
  infos.forEach((item) => {
    doc.text(`•  ${item}`, margin + 2, y, { maxWidth: contentWidth - 5 });
    y += 6;
  });
  y += 6;

  // Signature — Fait à + cachet
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  const lieuFait = examen.lieuConfiguration || examen.lieu || '..............';
  const today = formatDateSlash(new Date().toISOString());
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkText);
  doc.text(`Fait à ${lieuFait}, le ${today}`, margin, y);
  y += 8;

  const signatureBoxWidth = contentWidth / 2;
  const signatureBoxHeight = 30;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, y, signatureBoxWidth, signatureBoxHeight, 1.5, 1.5, 'S');
  doc.setFontSize(7);
  doc.setTextColor(...lightText);
  doc.text("Cachet de l'organisme", margin + signatureBoxWidth / 2, y + 4, { align: 'center' });

  if (tampon) {
    const tamponWidth = 34;
    const tamponX = margin + (signatureBoxWidth - tamponWidth) / 2;
    doc.addImage(tampon, 'PNG', tamponX, y + 6, tamponWidth, 22);
  }

  y += signatureBoxHeight + 8;

  // Avertissement rouge
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text('EXAMEN SUR ORDINATEUR', pageWidth / 2, y, { align: 'center' });
  y += 7;
  doc.text('NON REMBOURSABLE', pageWidth / 2, y, { align: 'center' });

  // Footer page 1
  drawFooter(1);

  // ================================================================
  // PAGE 2 — LIEU DE L'EXAMEN & ACCÈS
  // ================================================================
  doc.addPage('a4', 'p');
  y = drawPageHeader('LIEU DE L\'EXAMEN & ACCÈS');

  // Section ADRESSE DU CENTRE
  y = drawSectionHeader('ADRESSE DU CENTRE D\'EXAMEN', y);

  if (locationInfo) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkText);
    doc.text(locationInfo.name, margin, y + 1);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(locationInfo.fullAddress, margin, y);
    y += 10;
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkText);
    doc.text(examen.lieu || 'Lieu non précisé', margin, y + 1);
    y += 10;
  }

  // Carte Google Maps
  if (mapsImage) {
    const mapWidth = 160;
    const mapHeight = 80;
    const mapX = (pageWidth - mapWidth) / 2;
    doc.addImage(mapsImage, 'PNG', mapX, y, mapWidth, mapHeight);
    y += mapHeight + 8;
  } else {
    // Placeholder gris
    const mapWidth = 160;
    const mapHeight = 80;
    const mapX = (pageWidth - mapWidth) / 2;
    doc.setFillColor(230, 230, 230);
    doc.roundedRect(mapX, y, mapWidth, mapHeight, 2, 2, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('Carte non disponible', pageWidth / 2, y + mapHeight / 2, { align: 'center' });
    doc.setFontSize(8);
    doc.text('Consultez l\'adresse sur Google Maps pour vous repérer', pageWidth / 2, y + mapHeight / 2 + 8, { align: 'center' });
    y += mapHeight + 8;
  }

  // Section ACCÈS & TRANSPORTS
  if (locationInfo) {
    y = drawSectionHeader('ACCÈS & TRANSPORTS', y);

    const transportEntries: { label: string; value: string }[] = [];
    if (locationInfo.transport.rer) transportEntries.push({ label: 'RER / TRAIN', value: locationInfo.transport.rer });
    if (locationInfo.transport.metro) transportEntries.push({ label: 'MÉTRO', value: locationInfo.transport.metro });
    if (locationInfo.transport.bus) transportEntries.push({ label: 'BUS', value: locationInfo.transport.bus });
    if (locationInfo.transport.parking) transportEntries.push({ label: 'PARKING', value: locationInfo.transport.parking });

    transportEntries.forEach((entry) => {
      // Pastille grise avec label
      doc.setFillColor(...bgLight);
      doc.roundedRect(margin, y - 3, contentWidth, 12, 1.5, 1.5, 'F');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text(entry.label, margin + 3, y + 1);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkText);
      doc.text(entry.value, margin + 3, y + 6);

      y += 15;
    });

    // Note d'accès
    if (locationInfo.accessNotes) {
      y += 2;
      // Encadré jaune
      doc.setFillColor(255, 251, 235);
      doc.setDrawColor(234, 179, 8);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, y, contentWidth, 16, 1.5, 1.5, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(161, 98, 7);
      doc.text('NOTE D\'ACCÈS', margin + 3, y + 5);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 53, 15);
      doc.text(locationInfo.accessNotes, margin + 3, y + 11, { maxWidth: contentWidth - 6 });
    }
  } else {
    // Pas d'info de lieu
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...lightText);
    doc.text('Les informations de transport ne sont pas disponibles pour ce centre d\'examen.', margin, y);
    doc.text('Veuillez consulter l\'adresse ci-dessus pour planifier votre trajet.', margin, y + 5);
  }

  // Footer page 2
  drawFooter(2);

  // ================================================================
  // PAGE 3 — ÉPREUVES & RÈGLEMENT
  // ================================================================
  doc.addPage('a4', 'p');
  y = drawPageHeader('ÉPREUVES & RÈGLEMENT');

  // Section DÉROULEMENT DES ÉPREUVES
  y = drawSectionHeader('DÉROULEMENT DES ÉPREUVES', y);

  if (epreuvesInfo) {
    // Titre de l'examen
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkText);
    doc.text(epreuvesInfo.titre, margin, y, { maxWidth: contentWidth });
    y += 7;

    // Description
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...lightText);
    const descLines = doc.splitTextToSize(epreuvesInfo.description, contentWidth);
    doc.text(descLines, margin, y);
    y += descLines.length * 4.5 + 5;

    // Cartes d'épreuves
    epreuvesInfo.epreuves.forEach((epreuve) => {
      // Carte grise
      const cardHeight = 20;
      doc.setFillColor(...bgLight);
      doc.roundedRect(margin, y, contentWidth, cardHeight, 1.5, 1.5, 'F');

      // Badge code noir
      const badgeWidth = 12;
      doc.setFillColor(...primaryColor);
      doc.roundedRect(margin + 3, y + 3, badgeWidth, 6, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(epreuve.code, margin + 3 + badgeWidth / 2, y + 7, { align: 'center' });

      // Nom + durée
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkText);
      doc.text(epreuve.nom, margin + badgeWidth + 6, y + 7);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...lightText);
      doc.text(epreuve.duree, margin + contentWidth - 3, y + 7, { align: 'right' });

      // Description de l'épreuve
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(epreuve.description, margin + 5, y + 14, { maxWidth: contentWidth - 10 });

      y += cardHeight + 4;
    });

    // Consignes générales
    if (epreuvesInfo.consignesGenerales.length > 0) {
      y += 2;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkText);
      doc.text('Consignes générales :', margin, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...lightText);
      epreuvesInfo.consignesGenerales.forEach((consigne) => {
        doc.text(`•  ${consigne}`, margin + 2, y, { maxWidth: contentWidth - 5 });
        y += 5;
      });
    }
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...lightText);
    doc.text('Les détails des épreuves ne sont pas disponibles pour ce type d\'examen.', margin, y);
    y += 8;
  }

  y += 6;

  // Section RÈGLEMENT INTÉRIEUR & ANTI-FRAUDE
  y = drawSectionHeader('RÈGLEMENT INTÉRIEUR & ANTI-FRAUDE', y);

  const regles = [
    'Présentation d\'une pièce d\'identité valide obligatoire à l\'entrée de la salle.',
    'Téléphones portables, montres connectées et tout appareil électronique doivent être éteints et déposés dans la zone prévue.',
    'Toute tentative de fraude ou de communication entre candidats entraînera l\'exclusion immédiate et l\'annulation de l\'examen sans remboursement.',
    'Aucun document, note ou support non autorisé ne peut être introduit dans la salle d\'examen.',
    'Il est interdit de quitter la salle d\'examen avant la fin de l\'épreuve sans autorisation du surveillant.',
    'Toute réclamation relative au déroulement de l\'examen doit être formulée par écrit dans un délai de 30 jours.',
  ];

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkText);

  regles.forEach((regle, index) => {
    // Numéro
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(`${index + 1}.`, margin + 1, y);

    // Texte
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkText);
    const regleLines = doc.splitTextToSize(regle, contentWidth - 10);
    doc.text(regleLines, margin + 8, y);
    y += regleLines.length * 4.5 + 3;
  });

  // Footer page 3
  drawFooter(3);

  const fileName = `convocation_${inscription.nom}_${inscription.prenom}_${formatDate(examen.dateExamen).replace(/\//g, '-')}.pdf`;
  const blob = doc.output('blob');
  return { blob, fileName };
}
