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

// Caractères pour les cases à cocher
const CHECKBOX_EMPTY = '☐';
const CHECKBOX_CHECKED = '☑';

// Constantes entreprise
const COMPANY_NAME = 'MyStoryFormation';
const COMPANY_ADDRESS = '123 Rue de la Formation, 75001 Paris';
const COMPANY_PHONE = '01 23 45 67 89';
const COMPANY_EMAIL = 'contact@mystoryformation.fr';
const COMPANY_SIRET = '123 456 789 00012';

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
): Promise<void> {
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
  doc.text(prixBase ? `${prixBase} €` : '_____ €', margin + 3, y + 9);

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

  // Mode de paiement - checkboxes (plusieurs possibles)
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('MODE DE PAIEMENT', margin, y);
  y += 5;

  const moyenActuel = examen.moyenPaiement || '';
  const paiementOptions = [
    { key: 'carte_bancaire', label: 'CB' },
    { key: 'especes', label: 'Espèces' },
    { key: 'cpf', label: 'CPF' },
  ];

  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  let xPos = margin;
  for (const opt of paiementOptions) {
    const checked = moyenActuel === opt.key;
    doc.setFont('helvetica', 'normal');
    doc.text(checked ? CHECKBOX_CHECKED : CHECKBOX_EMPTY, xPos, y);
    doc.setFont('helvetica', 'bold');
    doc.text(opt.label, xPos + 6, y);
    xPos += 35;
  }
  y += 8;

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
    doc.addImage(tampon, 'PNG', margin + 4, y + 7, 38, 28);
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

  // Téléchargement
  const fileName = `attestation_paiement_${inscription.nom}_${inscription.prenom}.pdf`;
  doc.save(fileName);
}

export async function generateFicheInscription(
  inscription: Inscription,
  examen: Examen,
  motivationLabels?: Record<string, string>
): Promise<void> {
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
  doc.text('Date:', margin + 4, headerY + 6);
  doc.setTextColor(...darkText);
  doc.setFont('helvetica', 'bold');
  doc.text(examen.dateExamen ? formatDateSlash(examen.dateExamen) : '__/__/____', margin + 14, headerY + 6);

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
    'carte_bancaire': 'Carte bancaire', 'especes': 'Espèces', 'cpf': 'CPF', 'autre': 'Autre',
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
  doc.text(examen.prix ? `${examen.prix} €` : '— €', margin + 3, y + 8);

  drawField('Moyen de paiement', moyenPaiementLabels[examen.moyenPaiement || ''] || '', margin + contentWidth / 2, contentWidth / 2);
  y += 14;

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
    doc.addImage(tampon, 'PNG', margin + 4, y + 7, 38, 28);
  }

  // ===== FOOTER =====
  doc.setFillColor(40, 40, 40);
  doc.rect(0, pageHeight - 5, pageWidth, 5, 'F');
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  doc.text('MyStoryFormation - Document officiel', pageWidth / 2, pageHeight - 1.5, { align: 'center' });

  // Téléchargement
  const fileName = `fiche_inscription_${inscription.nom}_${inscription.prenom}.pdf`;
  doc.save(fileName);
}

export function generateConvocation(
  inscription: Inscription,
  examen: Examen
): void {
  const doc = new jsPDF();

  addHeader(doc, 'CONVOCATION À L\'EXAMEN');

  let y = 85;

  // Informations du candidat
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Destinataire :', 20, y);

  doc.setFont('helvetica', 'normal');
  y += 8;
  doc.text(`${inscription.civilite} ${inscription.prenom} ${inscription.nom}`, 20, y);
  y += 6;
  doc.text(`${inscription.adresse}`, 20, y);
  y += 6;
  doc.text(`${inscription.codePostal} ${inscription.ville}`, 20, y);

  y += 20;

  // Objet
  doc.setFont('helvetica', 'bold');
  doc.text('Objet : Convocation à l\'examen', 20, y);

  y += 15;

  // Corps de la convocation
  doc.setFont('helvetica', 'normal');
  doc.text(`${inscription.civilite} ${inscription.prenom} ${inscription.nom},`, 20, y);

  y += 10;
  doc.text('Nous avons le plaisir de vous informer que vous êtes convoqué(e) pour passer votre examen', 20, y, { maxWidth: 170 });
  y += 6;
  doc.text('selon les modalités suivantes :', 20, y);

  y += 15;

  // Encadré avec les informations de l'examen
  doc.setFillColor(245, 250, 255);
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.rect(20, y, 170, 55, 'FD');

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('INFORMATIONS DE L\'EXAMEN', 105, y, { align: 'center' });

  y += 12;
  doc.setFontSize(11);

  const addInfoLine = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label} :`, 30, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '-', 80, y);
    y += 8;
  };

  // Parse le diplome pour la convocation
  let convocationExamText = '';
  const convocDiplome = examen.diplome || '';
  const convocExamTypeLabels: Record<string, string> = { 'TEF_IRN': 'TEF IRN', 'CIVIQUE': 'Examen Civique' };
  const convocOptionLabels: Record<string, string> = { 'A1': 'Niveau A1', 'A2': 'Niveau A2', 'B1': 'Niveau B1', 'B2': 'Niveau B2' };

  if (convocDiplome) {
    const parts = convocDiplome.split(':');
    if (parts.length === 2) {
      const typeName = convocExamTypeLabels[parts[0]] || parts[0];
      const optionName = convocOptionLabels[parts[1]] || parts[1];
      convocationExamText = `${typeName} - ${optionName}`;
    } else {
      convocationExamText = convocDiplome;
    }
  }

  addInfoLine('Examen', convocationExamText || 'Non défini');
  addInfoLine('Date', formatDate(examen.dateExamen));
  addInfoLine('Heure', examen.heureExamen || '-');
  addInfoLine('Lieu', examen.lieu || '-');

  y += 15;

  // Instructions
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Documents à apporter :', 20, y);

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text('• Une pièce d\'identité en cours de validité (carte d\'identité ou passeport)', 25, y);
  y += 6;
  doc.text('• Cette convocation imprimée', 25, y);
  y += 6;
  doc.text('• De quoi écrire (stylo noir)', 25, y);

  y += 15;

  doc.setFont('helvetica', 'bold');
  doc.text('Important :', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text('• Veuillez vous présenter 15 minutes avant l\'heure de convocation', 25, y);
  y += 6;
  doc.text('• Tout retard pourra entraîner l\'impossibilité de passer l\'examen', 25, y);
  y += 6;
  doc.text('• Les téléphones portables doivent être éteints pendant l\'examen', 25, y);

  y += 20;

  // Formule de politesse
  doc.text('Nous vous souhaitons bonne réussite pour votre examen.', 20, y);
  y += 10;
  doc.text('Cordialement,', 20, y);
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('L\'équipe MyStoryFormation', 20, y);

  addFooter(doc);

  // Téléchargement
  const fileName = `convocation_${inscription.nom}_${inscription.prenom}_${formatDate(examen.dateExamen).replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
}
