import { jsPDF } from 'jspdf';
import type {
  StagiaireFormation,
  TestFormation,
  AnalyseBesoin,
  Evaluation,
} from '@/types/admin';

// ============================================================
// CONSTANTES
// ============================================================
const COMPANY = {
  name: 'MYSTORYFormation',
  siret: '123 456 789 00012',
  nda: '11 93 XXXXX 93',
  gagny: { address: '1 Rue de la Gare, 93220 Gagny', tel: '01 XX XX XX XX' },
  sarcelles: { address: '5 Avenue de la Division Leclerc, 95200 Sarcelles', tel: '01 XX XX XX XX' },
  rosny: { address: 'Adresse Rosny', tel: '01 XX XX XX XX' },
  email: 'contact@mystoryformation.fr',
};

const CHECKBOX_EMPTY = '\u2610';
const CHECKBOX_CHECKED = '\u2611';

// Logo chargé dynamiquement
let logoBase64: string | null = null;

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

function formatDateFr(date: string | null): string {
  if (!date) return '__/__/____';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function formatDateLong(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function getAgenceInfo(agence: string) {
  const key = agence.toLowerCase() as 'gagny' | 'sarcelles' | 'rosny';
  return COMPANY[key] || COMPANY.gagny;
}

function addHeader(doc: jsPDF, logo: string | null, title: string) {
  if (logo) {
    doc.addImage(logo, 'PNG', 15, 10, 40, 15);
  }
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 105, 20, { align: 'center' });
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(15, 30, 195, 30);
  return 35;
}

function addFooter(doc: jsPDF, page: number, total: number) {
  const y = 285;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150);
  doc.text(`${COMPANY.name} - SIRET: ${COMPANY.siret} - NDA: ${COMPANY.nda}`, 105, y, { align: 'center' });
  doc.text(`Page ${page}/${total}`, 195, y, { align: 'right' });
  doc.setTextColor(0);
}

// ============================================================
// PDF: Rapport Test Initial / Final
// ============================================================
export async function generateTestReportPdf(
  stagiaire: StagiaireFormation,
  test: TestFormation,
  type: 'initial' | 'final'
): Promise<jsPDF> {
  const doc = new jsPDF();
  const logo = await loadLogo();
  let y = addHeader(doc, logo, `RAPPORT DE TEST ${type.toUpperCase()}`);

  // Infos stagiaire
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  y += 5;
  doc.text(`Stagiaire : ${stagiaire.civilite} ${stagiaire.nom} ${stagiaire.prenom}`, 15, y);
  y += 6;
  doc.text(`Date de naissance : ${formatDateFr(stagiaire.dateNaissance)}`, 15, y);
  y += 6;
  doc.text(`Date du test : ${formatDateFr(test.dateTest)}`, 15, y);
  y += 6;
  doc.text(`Profil pédagogique : ${test.profilPedagogique || '-'}`, 15, y);
  y += 10;

  // Tableau des scores
  doc.setFont('helvetica', 'bold');
  doc.text('Résultats par épreuve', 15, y);
  y += 6;

  const scores = [
    { label: 'Compréhension Écrite (CE)', score: test.scoreCe, mode: 'Correction automatique' },
    { label: 'Compréhension Orale (CO)', score: test.scoreCo, mode: 'Correction automatique' },
    { label: 'Expression Écrite (EE)', score: test.scoreEe, mode: 'Correction manuelle' },
    { label: 'Expression Orale (EO)', score: test.scoreEo, mode: 'Correction manuelle' },
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y, 180, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Épreuve', 17, y + 5);
  doc.text('Score', 120, y + 5);
  doc.text('Mode', 150, y + 5);
  y += 8;

  doc.setFont('helvetica', 'normal');
  scores.forEach((s) => {
    doc.text(s.label, 17, y + 5);
    doc.text(`${s.score} / 20`, 120, y + 5);
    doc.text(s.mode, 150, y + 5);
    doc.setDrawColor(226, 232, 240);
    doc.line(15, y + 7, 195, y + 7);
    y += 8;
  });

  // Score global
  y += 5;
  doc.setFillColor(219, 234, 254);
  doc.rect(15, y, 180, 15, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Score global : ${test.scoreGlobal} / 80`, 20, y + 7);
  doc.text(`Niveau estimé : ${test.niveauEstime}`, 120, y + 7);
  y += 20;

  // Barème
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Barème d\'équivalence :', 15, y);
  y += 5;
  const bareme = [
    { range: '0 - 5', level: 'A0 / A1.1 non atteint' },
    { range: '5 - 9', level: 'A1' },
    { range: '10 - 14', level: 'A2' },
    { range: '15 - 18', level: 'B1' },
    { range: '19 et +', level: 'B2 et +' },
  ];
  bareme.forEach((b) => {
    doc.text(`${b.range} → ${b.level}`, 20, y);
    y += 5;
  });

  y += 10;
  doc.text(`Fait à ${stagiaire.agence}, le ${formatDateFr(test.dateTest)}`, 15, y);
  y += 10;
  doc.text('Signature de l\'intervenant(e) :', 15, y);

  addFooter(doc, 1, 1);
  return doc;
}

// ============================================================
// PDF: Fiche d'analyse de besoin
// ============================================================
export async function generateAnalyseBesoinPdf(
  stagiaire: StagiaireFormation,
  analyse: AnalyseBesoin,
  testInitial: TestFormation | null
): Promise<jsPDF> {
  const doc = new jsPDF();
  const logo = await loadLogo();
  let y = addHeader(doc, logo, 'FICHE D\'ANALYSE DE BESOIN');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Section 1: Infos bénéficiaire
  y += 3;
  doc.setFont('helvetica', 'bold');
  doc.text('1. Informations du bénéficiaire', 15, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Nom : ${stagiaire.nom}    Prénom : ${stagiaire.prenom}`, 20, y); y += 5;
  doc.text(`Date de naissance : ${formatDateFr(stagiaire.dateNaissance)}`, 20, y); y += 5;
  doc.text(`Contact : ${stagiaire.email} / ${stagiaire.telephone}`, 20, y); y += 8;

  // Section 2: Objectif
  doc.setFont('helvetica', 'bold');
  doc.text('2. Objectif de la formation', 15, y); y += 6;
  doc.setFont('helvetica', 'normal');
  analyse.objectifFormation.forEach((obj) => {
    doc.text(`${CHECKBOX_CHECKED} ${obj}`, 20, y); y += 5;
  });
  y += 3;

  // Section 3: Niveau
  doc.setFont('helvetica', 'bold');
  doc.text('3. Niveau actuel et prérequis', 15, y); y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Niveau estimé : ${analyse.niveauEstime || testInitial?.niveauEstime || '-'}`, 20, y); y += 5;
  doc.text(`Méthode de positionnement : ${analyse.methodePositionnement}`, 20, y); y += 8;

  // Section 4: Situation
  doc.setFont('helvetica', 'bold');
  doc.text('4. Situation du bénéficiaire', 15, y); y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Situation professionnelle : ${analyse.situationProfessionnelle}`, 20, y); y += 5;
  doc.text(`Disponibilités : ${analyse.disponibilites.join(', ')}`, 20, y); y += 5;
  doc.text(`Situation de handicap : ${analyse.situationHandicap ? 'Oui' : 'Non'}${analyse.situationHandicapDetail ? ' - ' + analyse.situationHandicapDetail : ''}`, 20, y); y += 8;

  // Section 5: Analyse
  doc.setFont('helvetica', 'bold');
  doc.text('5. Analyse du besoin', 15, y); y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Durée estimée : ${analyse.dureeEstimeeFormation} heures`, 20, y); y += 5;
  doc.text(`Niveau visé : ${analyse.niveauVise}`, 20, y); y += 5;
  doc.text(`Certification visée : ${analyse.typeCertificationVisee.join(', ')}`, 20, y); y += 5;
  doc.text(`Mode de financement : ${analyse.modeFinancement}`, 20, y); y += 5;
  if (analyse.commentaires) {
    doc.text(`Commentaires : ${analyse.commentaires}`, 20, y); y += 5;
  }

  y += 10;
  doc.text(`Date : ${formatDateFr(analyse.dateRemplissage)}`, 15, y);
  doc.text(`Commerciale : ${analyse.commercialeNom || '-'}`, 100, y);

  addFooter(doc, 1, 1);
  return doc;
}

// ============================================================
// PDF: Évaluation Initiale
// ============================================================
// Mapping scores -> niveaux CECRL (A0-C2)
function niveauFromScoreInitiale(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'A0';
  if (score >= 19) return 'C2';
  if (score >= 17) return 'C1';
  if (score >= 15) return 'B2';
  if (score >= 12) return 'B1';
  if (score >= 8) return 'A2';
  if (score >= 4) return 'A1';
  return 'A0';
}

export async function generateEvaluationInitialePdf(
  stagiaire: StagiaireFormation,
  evaluation: Evaluation,
  testInitial: TestFormation | null
): Promise<jsPDF> {
  const doc = new jsPDF();
  const logo = await loadLogo();
  let y = addHeader(doc, logo, 'ÉVALUATION INITIALE');

  const marginX = 15;
  const pageW = 210;
  const contentW = pageW - marginX * 2;

  // Helper : bandeau titre de section (fond noir, texte blanc)
  const drawSection = (title: string, yPos: number): number => {
    doc.setFillColor(30, 30, 30);
    doc.rect(marginX, yPos, contentW, 6, 'F');
    doc.setTextColor(255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(title, marginX + 2, yPos + 4);
    doc.setTextColor(0);
    return yPos + 8;
  };

  // Helper : case à cocher (OUI/NON)
  const drawCheckLine = (label: string, value: boolean | null, yPos: number): number => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(label, marginX + 2, yPos + 4);
    // OUI
    doc.setDrawColor(0);
    doc.rect(marginX + 95, yPos + 1, 4, 4);
    if (value === true) {
      doc.setFont('helvetica', 'bold');
      doc.text('X', marginX + 96.2, yPos + 4.2);
      doc.setFont('helvetica', 'normal');
    }
    doc.text('OUI', marginX + 101, yPos + 4);
    // NON
    doc.rect(marginX + 140, yPos + 1, 4, 4);
    if (value === false) {
      doc.setFont('helvetica', 'bold');
      doc.text('X', marginX + 141.2, yPos + 4.2);
      doc.setFont('helvetica', 'normal');
    }
    doc.text('NON', marginX + 146, yPos + 4);
    return yPos + 7;
  };

  // Helper : ligne label + valeur texte
  const drawLabelValue = (label: string, value: string, yPos: number, labelW = 50): number => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(label, marginX + 2, yPos + 4);
    doc.setFont('helvetica', 'bold');
    const text = value || '—';
    const wrapped = doc.splitTextToSize(text, contentW - labelW - 4);
    doc.text(wrapped, marginX + labelW, yPos + 4);
    doc.setFont('helvetica', 'normal');
    return yPos + 4 + wrapped.length * 4;
  };

  // ===== Identification (1 champ par ligne, label + valeur) =====
  y = drawLabelValue('Nom :', stagiaire.nom || '', y, 20);
  y = drawLabelValue('Nom de jeune fille :', stagiaire.nomJeuneFille || '—', y, 40);
  y = drawLabelValue('Prénom :', stagiaire.prenom || '', y, 25);
  y = drawLabelValue(
    'Formateur :',
    stagiaire.formatriceNom || stagiaire.commercialeNom || '—',
    y,
    25,
  );
  y += 2;

  // ===== FORMATION =====
  y = drawSection('FORMATION', y);
  y = drawCheckLine('Scolarisation en France', evaluation.scolarisationFrance, y);
  y = drawCheckLine("Scolarisation à l'étranger", evaluation.scolarisationEtranger, y);
  y = drawLabelValue('Où :', evaluation.scolarisationOu || '', y, 18);
  y = drawLabelValue('Quand :', evaluation.scolarisationQuand || '', y, 22);
  y += 2;

  // ===== FORMATION LINGUISTIQUE =====
  y = drawSection('FORMATION LINGUISTIQUE', y);
  y = drawCheckLine('Cours dans la langue étudiée', evaluation.coursFrancais, y);
  if (evaluation.coursFrancaisDetail) {
    y = drawLabelValue('Précisez (où/quand) :', evaluation.coursFrancaisDetail, y, 40);
  }
  y = drawLabelValue('Langues parlée(s) / écrite(s) :', evaluation.languesParlees || '', y, 55);
  y += 2;

  // ===== OUTILS INFORMATIQUES ET NUMÉRIQUES =====
  y = drawSection('OUTILS INFORMATIQUES ET NUMÉRIQUES', y);
  y = drawCheckLine('Smartphone / tablette', evaluation.smartphoneTablette, y);
  y = drawCheckLine('Ordinateur à la maison', evaluation.ordinateurMaison, y);
  y = drawCheckLine('Accès à internet', evaluation.accesInternet, y);
  y = drawCheckLine('Utilisation boîte mail', evaluation.utilisationBoiteMail, y);
  y += 2;

  // ===== MOTIVATION ET OBJECTIF DE L'APPRENTISSAGE =====
  y = drawSection("MOTIVATION ET OBJECTIF DE L'APPRENTISSAGE", y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Pourquoi voulez-vous apprendre ?', marginX + 2, y + 4);
  y += 7;
  if (evaluation.motivation) {
    const wrapped = doc.splitTextToSize(evaluation.motivation, contentW - 4);
    doc.setFont('helvetica', 'bold');
    doc.text(wrapped, marginX + 2, y + 4);
    doc.setFont('helvetica', 'normal');
    y += wrapped.length * 4 + 3;
  } else {
    doc.line(marginX + 2, y + 4, marginX + contentW - 2, y + 4);
    y += 7;
  }

  // Échelles 0-5
  const drawScale = (label: string, value: number | null, yPos: number): number => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(label, marginX + 2, yPos + 4);
    const startX = marginX + 85;
    const cellW = 7;
    for (let i = 0; i <= 5; i++) {
      const cellX = startX + i * cellW;
      if (value === i) {
        doc.setFillColor(30, 30, 30);
        doc.rect(cellX, yPos + 0.5, cellW - 1, 5, 'F');
        doc.setTextColor(255);
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setDrawColor(0);
        doc.rect(cellX, yPos + 0.5, cellW - 1, 5);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'normal');
      }
      doc.text(String(i), cellX + cellW / 2 - 0.5, yPos + 4, { align: 'center' });
    }
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    return yPos + 7;
  };
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('Besoins :', marginX + 2, y + 3);
  doc.setFont('helvetica', 'normal');
  y += 5;
  y = drawScale('Vie quotidienne', evaluation.besoinsVieQuotidienne, y);
  y = drawScale('Vie professionnelle', evaluation.besoinsVieProfessionnelle, y);
  y = drawLabelValue('Certificat visé :', evaluation.certificationViseeDetail || '', y, 32);
  y += 2;

  // ===== Besoins spécifiques =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Besoins spécifiques :', marginX + 2, y + 4);
  y += 6;
  doc.setFont('helvetica', 'normal');
  if (evaluation.besoinsSpecifiques) {
    const wrapped = doc.splitTextToSize(evaluation.besoinsSpecifiques, contentW - 4);
    doc.text(wrapped, marginX + 2, y + 4);
    y += wrapped.length * 4 + 3;
  } else {
    doc.line(marginX + 2, y + 4, marginX + contentW - 2, y + 4); y += 5;
    doc.line(marginX + 2, y + 4, marginX + contentW - 2, y + 4); y += 5;
  }
  y += 3;

  // ===== Grille des résultats (tableau A0-C2 × CE/CO/EE/EO) =====
  const niveaux = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
  const competences = [
    { label: 'Compréhension écrite', key: 'CE' as const },
    { label: 'Compréhension orale', key: 'CO' as const },
    { label: 'Expression écrite', key: 'EE' as const },
    { label: 'Expression orale', key: 'EO' as const },
  ];
  // Toujours recalculer le niveau depuis les scores du test initial (source de vérité)
  // plutôt que de se reposer sur grille_niveaux qui peut être obsolète ou au mauvais format.
  const grille: Record<string, string> = testInitial
    ? {
        CE: niveauFromScoreInitiale(testInitial.scoreCe),
        CO: niveauFromScoreInitiale(testInitial.scoreCo),
        EE: niveauFromScoreInitiale(testInitial.scoreEe),
        EO: niveauFromScoreInitiale(testInitial.scoreEo),
      }
    : (evaluation.grilleNiveaux as Record<string, string> | null) || {};
  const colLabelW = 60;
  const colNivW = (contentW - colLabelW) / niveaux.length;

  // Si on déborde, saut de page
  if (y > 230) { doc.addPage(); y = 20; }

  // En-tête : "Résultats évaluation" + niveaux
  doc.setFillColor(240, 240, 240);
  doc.rect(marginX, y, contentW, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Résultats évaluation', marginX + 2, y + 5.5);
  niveaux.forEach((n, i) => {
    const x = marginX + colLabelW + i * colNivW + colNivW / 2;
    doc.text(n, x, y + 5.5, { align: 'center' });
  });
  // Bordures
  doc.setDrawColor(150);
  doc.rect(marginX, y, contentW, 8);
  y += 8;

  competences.forEach(({ label, key }) => {
    const niveauAttendu = grille[key];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(label, marginX + 2, y + 5);
    niveaux.forEach((n, i) => {
      const cellX = marginX + colLabelW + i * colNivW;
      doc.setDrawColor(150);
      doc.rect(cellX, y, colNivW, 8);
      if (niveauAttendu === n) {
        // Remplir la cellule entière pour que ce soit bien visible
        doc.setFillColor(30, 30, 30);
        doc.rect(cellX + 0.3, y + 0.3, colNivW - 0.6, 7.4, 'F');
        doc.setTextColor(255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('X', cellX + colNivW / 2, y + 5.5, { align: 'center' });
        doc.setTextColor(0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
      }
    });
    doc.setDrawColor(150);
    doc.rect(marginX, y, colLabelW, 8);
    y += 8;
  });
  y += 3;

  // ===== Remarques =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Remarques :', marginX + 2, y + 4);
  y += 6;
  doc.setFont('helvetica', 'normal');
  if (evaluation.remarques) {
    const wrapped = doc.splitTextToSize(evaluation.remarques, contentW - 4);
    doc.text(wrapped, marginX + 2, y + 4);
    y += wrapped.length * 4 + 3;
  } else {
    doc.line(marginX + 2, y + 4, marginX + contentW - 2, y + 4); y += 5;
    doc.line(marginX + 2, y + 4, marginX + contentW - 2, y + 4); y += 5;
  }

  addFooter(doc, 1, 1);
  return doc;
}

// ============================================================
// PDF: Évaluation Finale
// ============================================================
export async function generateEvaluationFinalePdf(
  stagiaire: StagiaireFormation,
  evaluation: Evaluation,
  testInitial: TestFormation | null,
  testFinal: TestFormation | null
): Promise<jsPDF> {
  const doc = new jsPDF();
  const logo = await loadLogo();
  let y = addHeader(doc, logo, 'ÉVALUATION FINALE');

  doc.setFontSize(10);
  y += 3;
  doc.setFont('helvetica', 'normal');
  doc.text(`Stagiaire : ${stagiaire.civilite} ${stagiaire.nom} ${stagiaire.prenom}`, 15, y); y += 5;
  doc.text(`Formation : ${stagiaire.typePrestation}`, 15, y); y += 8;

  // Grille finale
  doc.setFont('helvetica', 'bold');
  doc.text('Niveaux par compétence', 15, y); y += 6;

  if (evaluation.grilleNiveaux) {
    doc.setFont('helvetica', 'normal');
    Object.entries(evaluation.grilleNiveaux).forEach(([comp, niveau]) => {
      doc.text(`${comp} : ${niveau}`, 25, y); y += 5;
    });
  }

  // Comparaison
  if (evaluation.comparaisonInitialeFinale) {
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Comparaison initiale vs finale', 15, y); y += 8;

    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 180, 8, 'F');
    doc.setFontSize(9);
    doc.text('Compétence', 20, y + 5);
    doc.text('Initial', 80, y + 5);
    doc.text('Final', 110, y + 5);
    doc.text('Progression', 140, y + 5);
    y += 8;

    doc.setFont('helvetica', 'normal');
    Object.entries(evaluation.comparaisonInitialeFinale).forEach(([comp, scores]) => {
      const s = scores as { initial: number; final: number };
      const diff = s.final - s.initial;
      doc.text(comp, 20, y + 5);
      doc.text(`${s.initial}/20`, 80, y + 5);
      doc.text(`${s.final}/20`, 110, y + 5);
      doc.text(`${diff >= 0 ? '+' : ''}${diff}`, 140, y + 5);
      doc.line(15, y + 7, 195, y + 7);
      y += 8;
    });
  }

  // Axes de progression
  if (evaluation.axesProgression && evaluation.axesProgression.length > 0) {
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Axes de progression', 15, y); y += 6;
    doc.setFont('helvetica', 'normal');
    evaluation.axesProgression.forEach((axe) => {
      doc.text(`- ${axe}`, 20, y); y += 5;
    });
  }

  if (evaluation.remarques) {
    y += 5;
    doc.text(`Remarques : ${evaluation.remarques}`, 15, y); y += 5;
  }

  y += 10;
  doc.text(`Signature : ${evaluation.signatureIntervenant || '-'}`, 15, y);
  doc.text(`Date : ${formatDateFr(evaluation.createdAt)}`, 120, y);

  addFooter(doc, 1, 1);
  return doc;
}

// ============================================================
// PDF: Convention de Formation
// ============================================================
export async function generateConventionPdf(
  stagiaire: StagiaireFormation,
  analyse: AnalyseBesoin | null
): Promise<jsPDF> {
  const doc = new jsPDF();
  const logo = await loadLogo();
  let y = addHeader(doc, logo, 'CONVENTION DE FORMATION PROFESSIONNELLE');
  const agenceInfo = getAgenceInfo(stagiaire.agence);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  y += 3;
  doc.text('Entre :', 15, y); y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY.name, 20, y); y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Adresse : ${agenceInfo.address}`, 20, y); y += 5;
  doc.text(`SIRET : ${COMPANY.siret} | NDA : ${COMPANY.nda}`, 20, y); y += 8;

  doc.text('Et :', 15, y); y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`${stagiaire.civilite} ${stagiaire.nom} ${stagiaire.prenom}`, 20, y); y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Adresse : ${stagiaire.adressePostale}`, 20, y); y += 5;
  doc.text(`Email : ${stagiaire.email} | Tél : ${stagiaire.telephone}`, 20, y); y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Article 1 — Objet', 15, y); y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(
    `La présente convention a pour objet la réalisation d'une formation de type :`,
    20, y
  ); y += 5;
  doc.text(`${stagiaire.typePrestation}`, 20, y); y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Article 2 — Durée et dates', 15, y); y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Durée : ${stagiaire.heuresPrevues || analyse?.dureeEstimeeFormation || '-'} heures`, 20, y); y += 5;
  doc.text(`Date de début : ${formatDateFr(stagiaire.dateDebutFormation)}`, 20, y); y += 5;
  doc.text(`Lieu : ${stagiaire.agence} - ${agenceInfo.address}`, 20, y); y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Article 3 — Prix', 15, y); y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Montant : ${stagiaire.montantTotal || '-'} EUR TTC`, 20, y); y += 5;
  doc.text(`Mode de paiement : ${stagiaire.modePaiement || '-'}`, 20, y); y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Article 4 — Programme', 15, y); y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text('Le programme détaillé est annexé à la présente convention.', 20, y); y += 15;

  // Signatures
  doc.text('Fait en deux exemplaires à ' + stagiaire.agence, 15, y); y += 5;
  doc.text(`Le ${formatDateLong(new Date().toISOString())}`, 15, y); y += 12;

  doc.text('Pour l\'organisme de formation :', 15, y);
  doc.text('Le stagiaire :', 120, y);
  y += 20;
  doc.setDrawColor(200);
  doc.line(15, y, 80, y);
  doc.line(120, y, 190, y);

  addFooter(doc, 1, 1);
  return doc;
}

// ============================================================
// PDF: Convocation
// ============================================================
export async function generateConvocationPdf(
  stagiaire: StagiaireFormation
): Promise<jsPDF> {
  const doc = new jsPDF();
  const logo = await loadLogo();
  let y = addHeader(doc, logo, 'CONVOCATION À LA FORMATION');
  const agenceInfo = getAgenceInfo(stagiaire.agence);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  y += 5;
  doc.text(`${stagiaire.civilite} ${stagiaire.nom} ${stagiaire.prenom}`, 15, y); y += 5;
  doc.text(stagiaire.adressePostale, 15, y); y += 10;

  doc.text(`Objet : Convocation à votre première séance de formation`, 15, y); y += 10;

  doc.text(`${stagiaire.civilite} ${stagiaire.nom},`, 15, y); y += 8;
  doc.text('Nous avons le plaisir de vous informer que votre inscription à la formation', 15, y); y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(`"${stagiaire.typePrestation}"`, 15, y); y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text('a été validée.', 15, y); y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Votre première séance aura lieu :', 15, y); y += 8;
  doc.setFont('helvetica', 'normal');

  const details = [
    { label: 'Date', value: formatDateLong(stagiaire.dateDebutFormation) },
    { label: 'Horaire', value: stagiaire.horairesFormation || '-' },
    { label: 'Lieu', value: `${stagiaire.agence} - ${agenceInfo.address}` },
    { label: 'Formatrice', value: stagiaire.formatriceNom || '-' },
  ];

  details.forEach(({ label, value }) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label} : `, 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 55, y);
    y += 6;
  });

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Documents à apporter :', 15, y); y += 6;
  doc.setFont('helvetica', 'normal');
  ['Pièce d\'identité en cours de validité', 'Un stylo', 'Un cahier de notes'].forEach((item) => {
    doc.text(`- ${item}`, 20, y); y += 5;
  });

  y += 10;
  doc.text('Nous vous souhaitons une excellente formation.', 15, y); y += 10;
  doc.text('Cordialement,', 15, y); y += 5;
  doc.text(`L'équipe ${COMPANY.name}`, 15, y);

  addFooter(doc, 1, 1);
  return doc;
}

// ============================================================
// PDF: Attestation de fin de formation
// ============================================================
export async function generateAttestationFinFormationPdf(
  stagiaire: StagiaireFormation,
  testFinal: TestFormation | null
): Promise<jsPDF> {
  const doc = new jsPDF();
  const logo = await loadLogo();
  let y = addHeader(doc, logo, 'ATTESTATION DE FIN DE FORMATION');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  y += 5;
  doc.text('Je soussigné(e), responsable de l\'organisme de formation', 15, y); y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY.name, 15, y); y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`SIRET : ${COMPANY.siret} | NDA : ${COMPANY.nda}`, 15, y); y += 10;

  doc.text('Atteste que :', 15, y); y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text(`${stagiaire.civilite} ${stagiaire.nom} ${stagiaire.prenom}`, 20, y); y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Né(e) le ${formatDateFr(stagiaire.dateNaissance)}`, 20, y); y += 5;
  doc.text(`Nationalité : ${stagiaire.nationalite}`, 20, y); y += 10;

  doc.text('A suivi la formation suivante :', 15, y); y += 8;

  const infos = [
    { label: 'Formation', value: stagiaire.typePrestation },
    { label: 'Durée', value: `${stagiaire.heuresEffectuees} heures (sur ${stagiaire.heuresPrevues} prévues)` },
    { label: 'Période', value: `Du ${formatDateFr(stagiaire.dateDebutFormation)} au ${formatDateFr(stagiaire.dateFinFormation)}` },
    { label: 'Lieu', value: stagiaire.agence },
  ];

  infos.forEach(({ label, value }) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label} : `, 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 55, y);
    y += 6;
  });

  if (testFinal) {
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Résultats :', 15, y); y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Score global : ${testFinal.scoreGlobal} / 80`, 20, y); y += 5;
    doc.text(`Niveau atteint : ${testFinal.niveauEstime}`, 20, y); y += 5;
  }

  y += 15;
  doc.text(`Fait à ${stagiaire.agence}, le ${formatDateLong(new Date().toISOString())}`, 15, y);
  y += 15;
  doc.text('Cachet et signature', 15, y);

  addFooter(doc, 1, 1);
  return doc;
}

// ============================================================
// PDF: Feuille d'émargement
// ============================================================
export async function generateEmargementPdf(
  dateCours: string,
  agence: string,
  formatrice: string,
  horaire: string,
  stagiaires: { nom: string; prenom: string; present: boolean }[]
): Promise<jsPDF> {
  const doc = new jsPDF();
  const logo = await loadLogo();
  let y = addHeader(doc, logo, 'FEUILLE D\'ÉMARGEMENT');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  y += 3;
  doc.text(`Date : ${formatDateLong(dateCours)}`, 15, y); y += 5;
  doc.text(`Agence : ${agence}`, 15, y);
  doc.text(`Formatrice : ${formatrice}`, 100, y); y += 5;
  doc.text(`Horaire : ${horaire}`, 15, y); y += 10;

  // Tableau
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y, 180, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('N°', 18, y + 5);
  doc.text('Nom', 30, y + 5);
  doc.text('Prénom', 80, y + 5);
  doc.text('Signature matin', 120, y + 5);
  doc.text('Signature après-midi', 160, y + 5);
  y += 8;

  doc.setFont('helvetica', 'normal');
  stagiaires.forEach((s, idx) => {
    doc.text(`${idx + 1}`, 18, y + 5);
    doc.text(s.nom, 30, y + 5);
    doc.text(s.prenom, 80, y + 5);
    // Zone signature vide
    doc.setDrawColor(200);
    doc.rect(115, y, 35, 8);
    doc.rect(155, y, 35, 8);
    doc.line(15, y + 8, 195, y + 8);
    y += 8;

    if (y > 260) {
      doc.addPage();
      y = 20;
    }
  });

  y += 10;
  doc.text('Signature du formateur :', 15, y);
  doc.rect(15, y + 3, 60, 20);

  addFooter(doc, 1, 1);
  return doc;
}

// ============================================================
// PDF: Programme de formation
// ============================================================
export async function generateProgrammePdf(
  stagiaire: StagiaireFormation,
  analyse: AnalyseBesoin | null
): Promise<jsPDF> {
  const doc = new jsPDF();
  const logo = await loadLogo();
  let y = addHeader(doc, logo, 'PROGRAMME DE FORMATION');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  y += 3;
  doc.setFont('helvetica', 'bold');
  doc.text(`Formation : ${stagiaire.typePrestation}`, 15, y); y += 5;
  doc.text(`Durée : ${stagiaire.heuresPrevues || analyse?.dureeEstimeeFormation || '-'} heures`, 15, y); y += 5;
  doc.text(`Niveau visé : ${analyse?.niveauVise || '-'}`, 15, y); y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Objectifs pédagogiques :', 15, y); y += 6;
  doc.setFont('helvetica', 'normal');

  const objectifs = [
    'Développer les compétences en compréhension orale et écrite',
    'Améliorer les capacités d\'expression orale et écrite',
    `Atteindre le niveau ${analyse?.niveauVise || 'B1'} du CECRL`,
    'Préparer aux épreuves du TEF IRN',
    'Maîtriser les situations de communication quotidienne en français',
  ];

  objectifs.forEach((obj) => {
    doc.text(`- ${obj}`, 20, y); y += 5;
  });

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Contenu de la formation :', 15, y); y += 6;
  doc.setFont('helvetica', 'normal');

  const modules = [
    { title: 'Module 1 — Compréhension orale', desc: 'Écoute, dialogues, exercices de compréhension' },
    { title: 'Module 2 — Compréhension écrite', desc: 'Lecture de textes, QCM, analyse documentaire' },
    { title: 'Module 3 — Expression écrite', desc: 'Rédaction, lettre formelle, email, argumentation' },
    { title: 'Module 4 — Expression orale', desc: 'Présentation, argumentation, entretien, débat' },
    { title: 'Module 5 — Préparation TEF IRN', desc: 'Examens blancs, méthodologie, gestion du temps' },
  ];

  modules.forEach(({ title, desc }) => {
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, y); y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(desc, 25, y); y += 7;
  });

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Moyens pédagogiques :', 15, y); y += 6;
  doc.setFont('helvetica', 'normal');
  ['Supports numériques (PasseTonTEF, PrepCivique, PrepMyFuture)',
    'Manuels et fiches de travail',
    'Exercices pratiques et mises en situation',
    'Examens blancs réguliers',
  ].forEach((m) => {
    doc.text(`- ${m}`, 20, y); y += 5;
  });

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Modalités d\'évaluation :', 15, y); y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text('- Test initial de positionnement', 20, y); y += 5;
  doc.text('- Évaluations continues en cours de formation', 20, y); y += 5;
  doc.text('- Test final comparatif', 20, y); y += 5;
  doc.text('- Attestation de fin de formation', 20, y);

  addFooter(doc, 1, 1);
  return doc;
}
