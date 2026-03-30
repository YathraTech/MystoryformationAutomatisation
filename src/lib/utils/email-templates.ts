import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Résout le code diplôme (ex: "TEF_IRN:A1") en label lisible (ex: "TEF IRN - A1")
 */
export async function resolveDiplomeLabel(diplome: string | null): Promise<string> {
  if (!diplome) return '-';

  try {
    const supabase = createAdminClient();
    const parts = diplome.split(':');
    const typeCode = parts[0];
    const optionCode = parts.length > 1 ? parts[1] : null;

    // Récupérer le label du type d'examen
    const { data: typeData } = await supabase
      .from('exam_types')
      .select('label')
      .eq('code', typeCode)
      .maybeSingle();

    const typeLabel = typeData?.label || typeCode;

    if (!optionCode) return typeLabel;

    // Récupérer le label de l'option
    const { data: optionData } = await supabase
      .from('exam_options')
      .select('label')
      .eq('code', optionCode)
      .maybeSingle();

    const optionLabel = optionData?.label || optionCode;

    return `${typeLabel} - ${optionLabel}`;
  } catch (err) {
    console.error('[resolveDiplomeLabel] Error:', err);
    return diplome;
  }
}

function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatPrix(prix: number | null): string {
  if (prix === null || prix === undefined) return '-';
  return `${prix.toFixed(2)} €`;
}

function emailLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if !mso]><!-->
  <style>
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .email-padding { padding-left: 24px !important; padding-right: 24px !important; }
      .email-header { padding: 24px 24px !important; }
      .cta-btn { padding: 14px 24px !important; font-size: 14px !important; }
    }
  </style>
  <!--<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" class="email-container" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td class="email-header" style="background-color:#1e1e1e;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">MYSTORYFormation</h1>
              <p style="margin:6px 0 0;font-size:13px;color:#a1a1aa;">Centre de formation et d'examens</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-padding" style="padding:36px 40px 20px;">
              ${body}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td class="email-padding" style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e4e4e7;margin:12px 0;">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-padding" style="padding:20px 40px 32px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#3f3f46;">MYSTORYFormation</p>
              <p style="margin:0 0 4px;font-size:12px;color:#71717a;">01 43 09 15 40</p>
              <p style="margin:0 0 4px;font-size:12px;color:#71717a;">
                <a href="mailto:contact@mystoryformation.fr" style="color:#71717a;text-decoration:underline;">contact@mystoryformation.fr</a>
              </p>
              <p style="margin:0;font-size:12px;color:#71717a;">
                <a href="https://mystoryformation.fr" style="color:#71717a;text-decoration:underline;">mystoryformation.fr</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function recapRow(label: string, value: string, isFirst: boolean): string {
  const borderStyle = isFirst ? '' : 'border-top:1px solid #e4e4e7;';
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:#71717a;${borderStyle}width:35%;">${label}</td>
    <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1e1e1e;${borderStyle}">${value}</td>
  </tr>`;
}

function recapTable(rows: string): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fafafa;border:1px solid #e4e4e7;border-radius:8px;margin-bottom:28px;">
    <tr>
      <td style="padding:20px 24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          ${rows}
        </table>
      </td>
    </tr>
  </table>`;
}

function sectionBlock(title: string, rows: string): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:8px;overflow:hidden;margin-bottom:16px;">
    <tr>
      <td style="background-color:#1e1e1e;padding:12px 20px;">
        <h2 style="color:#ffffff;font-size:14px;margin:0;font-weight:600;text-transform:uppercase;letter-spacing:1px;">${title}</h2>
      </td>
    </tr>
    <tr>
      <td style="background-color:#f8fafc;padding:20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          ${rows}
        </table>
      </td>
    </tr>
  </table>`;
}

function sectionRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#64748b;font-size:13px;width:40%;">${label}</td>
    <td style="padding:6px 0;color:#1e1e1e;font-size:13px;font-weight:600;">${value}</td>
  </tr>`;
}

function confirmationBanner(message: string, detail: string): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;margin-bottom:16px;">
    <tr>
      <td style="padding:20px;text-align:center;">
        <p style="color:#166534;font-size:14px;margin:0;font-weight:600;">${message}</p>
        <p style="color:#15803d;font-size:13px;margin:8px 0 0;">${detail}</p>
      </td>
    </tr>
  </table>`;
}

function ctaButton(url: string, label: string): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <a href="${url}" target="_blank" class="cta-btn" style="display:inline-block;background-color:#1e1e1e;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:8px;letter-spacing:0.3px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>
  <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;text-align:center;">
    Ce lien est valide pendant 7 jours.
  </p>`;
}

export function buildPreinscriptionFormationEmail(
  prenom: string,
  nom: string,
  formationNom: string,
  formationDuree: string,
  formationPrix: string,
  modeFinancement: string,
  langue: string,
  niveauActuel: string,
): string {
  const body = `
    <p style="margin:0 0 20px;font-size:16px;color:#1e1e1e;">Bonjour <strong>${prenom} ${nom}</strong>,</p>
    <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">
      Nous avons bien reçu votre demande de pré-inscription. Voici un récapitulatif de votre demande :
    </p>
    ${recapTable(
      recapRow('Formation', formationNom || '-', true) +
      recapRow('Durée', formationDuree || '-', false) +
      recapRow('Prix', formationPrix || '-', false) +
      recapRow('Financement', modeFinancement || '-', false) +
      recapRow('Langue', langue || '-', false) +
      recapRow('Niveau actuel', niveauActuel || '-', false)
    )}
    <p style="margin:0 0 8px;font-size:15px;color:#3f3f46;line-height:1.6;">
      Notre équipe vous contactera prochainement pour finaliser votre inscription.
    </p>
    <p style="margin:0;font-size:14px;color:#71717a;line-height:1.5;">
      Si vous avez des questions, n'hésitez pas à nous contacter par email ou par téléphone.
    </p>`;
  return emailLayout('Confirmation de pré-inscription', body);
}

export interface PreinscriptionExamenData {
  civilite: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  dateNaissance: string;
  adresse: string;
  codePostal: string;
  ville: string;
  nationalite: string;
  villeNaissance: string;
  lieuNaissance: string;
  langueMaternelle: string;
  numeroPasseport: string;
  numeroCni: string;
  diplomeLabel: string;
  typeExamen: string;
  lieu: string;
  motivation: string;
  motivationAutre: string;
}

export function buildPreinscriptionExamenEmail(data: PreinscriptionExamenData): string {
  // Informations personnelles
  let personalRows =
    sectionRow('Civilité', data.civilite) +
    sectionRow('Nom', data.nom) +
    sectionRow('Prénom', data.prenom) +
    sectionRow('Email', data.email) +
    sectionRow('Téléphone', data.telephone) +
    sectionRow('Date de naissance', data.dateNaissance) +
    sectionRow('Adresse', `${data.adresse}, ${data.codePostal} ${data.ville}`);

  if (data.nationalite) personalRows += sectionRow('Nationalité', data.nationalite);
  if (data.villeNaissance) personalRows += sectionRow('Ville de naissance', data.villeNaissance);
  if (data.lieuNaissance) personalRows += sectionRow('Pays de naissance', data.lieuNaissance);
  if (data.langueMaternelle) personalRows += sectionRow('Langue maternelle', data.langueMaternelle);

  // Examen
  let examRows = '';
  if (data.typeExamen) examRows += sectionRow("Type d'examen", data.typeExamen);
  examRows += sectionRow('Diplôme / Option', data.diplomeLabel || '-');
  if (data.lieu) examRows += sectionRow("Centre d'examen", data.lieu);
  if (data.motivation) examRows += sectionRow('Motivation', data.motivation);
  if (data.motivationAutre) examRows += sectionRow('Précision', data.motivationAutre);

  // Pièce d'identité
  let idRows = '';
  if (data.numeroPasseport) idRows += sectionRow('N° Passeport', data.numeroPasseport);
  if (data.numeroCni) idRows += sectionRow('N° CNI', data.numeroCni);

  const body = `
    <p style="margin:0 0 20px;font-size:16px;color:#1e1e1e;">Bonjour <strong>${data.civilite} ${data.prenom} ${data.nom}</strong>,</p>
    <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">
      Nous avons bien reçu votre pré-inscription à l'examen. Voici le récapitulatif de vos informations.
    </p>
    ${sectionBlock('Informations personnelles', personalRows)}
    ${sectionBlock('Examen sélectionné', examRows)}
    ${idRows ? sectionBlock("Pièce d'identité", idRows) : ''}
    ${confirmationBanner(
      "Votre pré-inscription à l'examen a bien été enregistrée",
      "Vous recevrez prochainement votre convocation avec la date, l'heure et le lieu de votre examen."
    )}`;
  return emailLayout("Confirmation de pré-inscription à l'examen", body);
}

export function buildAttestationEmail(
  prenom: string,
  nom: string,
  typeExamen: string | null,
  dateExamen: string | null,
  prix: number | null,
  url: string,
): string {
  const body = `
    <p style="margin:0 0 20px;font-size:16px;color:#1e1e1e;">Bonjour <strong>${prenom} ${nom}</strong>,</p>
    <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">
      Veuillez trouver ci-dessous votre attestation de paiement concernant votre inscription à l'examen.
    </p>
    ${recapTable(
      recapRow("Type d'examen", typeExamen || '-', true) +
      recapRow("Date d'examen", formatDate(dateExamen), false) +
      recapRow('Montant payé', formatPrix(prix), false)
    )}
    ${ctaButton(url, "Télécharger l'attestation")}`;
  return emailLayout('Attestation de paiement', body);
}

export function buildFicheEmail(
  prenom: string,
  nom: string,
  typeExamen: string | null,
  dateExamen: string | null,
  url: string,
): string {
  const body = `
    <p style="margin:0 0 20px;font-size:16px;color:#1e1e1e;">Bonjour <strong>${prenom} ${nom}</strong>,</p>
    <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">
      Veuillez trouver ci-dessous votre fiche d'inscription concernant votre examen.
    </p>
    ${recapTable(
      recapRow("Type d'examen", typeExamen || '-', true) +
      recapRow("Date d'examen", formatDate(dateExamen), false)
    )}
    ${ctaButton(url, "Télécharger la fiche d'inscription")}`;
  return emailLayout("Fiche d'inscription", body);
}

export function buildResultatReussiEmail(
  prenom: string,
  nom: string,
  diplomeLabel: string,
  dateExamen: string | null,
  downloadUrl: string,
): string {
  const body = `
    <p style="margin:0 0 20px;font-size:16px;color:#1e1e1e;">Bonjour <strong>${prenom} ${nom}</strong>,</p>

    ${confirmationBanner(
      'Félicitations, vous avez réussi votre examen !',
      'Nous sommes heureux de vous annoncer que vous avez obtenu votre certification.'
    )}

    <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">
      Voici le récapitulatif de votre examen :
    </p>

    ${recapTable(
      recapRow('Diplôme', diplomeLabel || '-', true) +
      recapRow("Date d'examen", formatDate(dateExamen), false) +
      recapRow('Résultat', 'Réussi', false)
    )}

    <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">
      Vous pouvez télécharger votre attestation de réussite en cliquant sur le bouton ci-dessous :
    </p>

    ${ctaButton(downloadUrl, "Télécharger l'attestation de réussite")}

    <p style="margin:24px 0 0;font-size:14px;color:#71717a;line-height:1.5;">
      Toute l'équipe MYSTORYFormation vous félicite et vous souhaite le meilleur pour la suite de vos démarches.
    </p>`;
  return emailLayout('Résultat de votre examen - Réussite', body);
}

export function buildResultatAbsentEmail(
  prenom: string,
  nom: string,
  diplomeLabel: string,
  dateExamen: string | null,
): string {
  const body = `
    <p style="margin:0 0 20px;font-size:16px;color:#1e1e1e;">Bonjour <strong>${prenom} ${nom}</strong>,</p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fef2f2;border-radius:8px;border:1px solid #fecaca;margin-bottom:16px;">
      <tr>
        <td style="padding:20px;text-align:center;">
          <p style="color:#991b1b;font-size:14px;margin:0;font-weight:600;">Absence constatée à votre examen</p>
          <p style="color:#b91c1c;font-size:13px;margin:8px 0 0;">Votre absence a été enregistrée pour l'examen ci-dessous.</p>
        </td>
      </tr>
    </table>

    ${recapTable(
      recapRow('Diplôme', diplomeLabel || '-', true) +
      recapRow("Date d'examen", formatDate(dateExamen), false) +
      recapRow('Résultat', 'Absent(e)', false)
    )}

    <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
      <strong style="color:#dc2626;">Il est urgent de reprendre contact avec nous</strong> afin de reprogrammer votre examen dans les meilleurs délais.
    </p>

    <p style="margin:0 0 8px;font-size:15px;color:#3f3f46;line-height:1.6;">
      Contactez-nous dès que possible :
    </p>

    ${recapTable(
      recapRow('Téléphone', '<a href="tel:+33143091540" style="color:#1e1e1e;text-decoration:none;font-weight:600;">01 43 09 15 40</a>', true) +
      recapRow('Email', '<a href="mailto:contact@mystoryformation.fr" style="color:#1e1e1e;text-decoration:underline;font-weight:600;">contact@mystoryformation.fr</a>', false)
    )}

    <p style="margin:0;font-size:14px;color:#71717a;line-height:1.5;">
      Notre équipe reste à votre disposition pour toute question.
    </p>`;
  return emailLayout("Résultat de votre examen - Absence", body);
}

export function buildResultatEchoueEmail(
  prenom: string,
  nom: string,
  diplomeLabel: string,
  dateExamen: string | null,
): string {
  const body = `
    <p style="margin:0 0 20px;font-size:16px;color:#1e1e1e;">Bonjour <strong>${prenom} ${nom}</strong>,</p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fffbeb;border-radius:8px;border:1px solid #fde68a;margin-bottom:16px;">
      <tr>
        <td style="padding:20px;text-align:center;">
          <p style="color:#92400e;font-size:14px;margin:0;font-weight:600;">Résultat de votre examen</p>
          <p style="color:#a16207;font-size:13px;margin:8px 0 0;">Malheureusement, vous n'avez pas obtenu le résultat attendu cette fois-ci.</p>
        </td>
      </tr>
    </table>

    ${recapTable(
      recapRow('Diplôme', diplomeLabel || '-', true) +
      recapRow("Date d'examen", formatDate(dateExamen), false) +
      recapRow('Résultat', 'Non obtenu', false)
    )}

    <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
      Ne vous découragez pas ! Avec une bonne préparation, vous pouvez réussir lors de votre prochaine tentative.
    </p>

    <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
      <strong>MYSTORYFormation</strong> vous recommande <strong>PrepCivique.fr</strong>, notre plateforme partenaire spécialisée dans la préparation aux examens :
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f9ff;border-radius:8px;border:1px solid #bae6fd;margin-bottom:24px;">
      <tr>
        <td style="padding:20px;">
          <p style="color:#0c4a6e;font-size:15px;margin:0 0 12px;font-weight:700;">PrepCivique.fr — Préparez votre réussite</p>
          <p style="color:#0369a1;font-size:13px;margin:0 0 6px;">• <strong>Examens blancs</strong> dans les conditions réelles</p>
          <p style="color:#0369a1;font-size:13px;margin:0 0 6px;">• <strong>Cours structurés</strong> pour progresser efficacement</p>
          <p style="color:#0369a1;font-size:13px;margin:0 0 12px;">• <strong>Entraînements illimités</strong> pour s'exercer à son rythme</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td align="center">
                <a href="https://prepcivique.fr" target="_blank" class="cta-btn" style="display:inline-block;background-color:#0284c7;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
                  Découvrir PrepCivique.fr
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:14px;color:#71717a;line-height:1.5;">
      N'hésitez pas à nous contacter pour reprogrammer un examen. Nous sommes là pour vous accompagner.
    </p>`;
  return emailLayout("Résultat de votre examen", body);
}

export function buildRelanceEmail(
  prenom: string,
  nom: string,
): string {
  const body = `
    <p style="margin:0 0 20px;font-size:16px;color:#1e1e1e;">Bonjour <strong>${prenom} ${nom}</strong>,</p>

    <p style="margin:0 0 20px;font-size:15px;color:#3f3f46;line-height:1.6;">
      Suite à votre examen, nous souhaitons vous informer que <strong>MYSTORYFormation</strong> propose, via sa plateforme partenaire <strong>PrepCivique.fr</strong>, des outils pour vous accompagner dans votre réussite.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f9ff;border-radius:8px;border:1px solid #bae6fd;margin-bottom:24px;">
      <tr>
        <td style="padding:20px;">
          <p style="color:#0c4a6e;font-size:15px;margin:0 0 12px;font-weight:700;">PrepCivique.fr — Préparez votre réussite</p>
          <p style="color:#0369a1;font-size:13px;margin:0 0 6px;">• <strong>Examens blancs</strong> dans les conditions réelles</p>
          <p style="color:#0369a1;font-size:13px;margin:0 0 6px;">• <strong>Cours structurés</strong> pour progresser efficacement</p>
          <p style="color:#0369a1;font-size:13px;margin:0 0 12px;">• <strong>Entraînements illimités</strong> pour s'exercer à son rythme</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td align="center">
                <a href="https://prepcivique.fr" target="_blank" class="cta-btn" style="display:inline-block;background-color:#0284c7;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
                  Découvrir PrepCivique.fr
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:14px;color:#71717a;line-height:1.5;">
      Si vous avez des questions ou souhaitez reprogrammer un examen, n'hésitez pas à nous contacter.
    </p>`;
  return emailLayout('PrepCivique.fr — Promotions et entraînements', body);
}

export function buildConvocationEmail(
  prenom: string,
  nom: string,
  typeExamen: string | null,
  dateExamen: string | null,
  heureExamen: string | null,
  lieu: string | null,
  url: string,
): string {
  const body = `
    <p style="margin:0 0 20px;font-size:16px;color:#1e1e1e;">Bonjour <strong>${prenom} ${nom}</strong>,</p>
    <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">
      Veuillez trouver ci-dessous votre convocation pour votre examen.
    </p>
    ${recapTable(
      recapRow("Type d'examen", typeExamen || '-', true) +
      recapRow("Date d'examen", formatDate(dateExamen), false) +
      recapRow("Heure", heureExamen || '-', false) +
      recapRow("Lieu", lieu || '-', false)
    )}
    ${ctaButton(url, 'Télécharger la convocation')}`;
  return emailLayout('Convocation', body);
}

export function buildPartenaireCredentialsEmail(
  prenom: string,
  nom: string,
  email: string,
  password: string,
  loginUrl: string,
  organisation?: string,
): string {
  const body = `
    <p style="margin:0 0 20px;font-size:16px;color:#1e1e1e;">Bonjour <strong>${prenom} ${nom}</strong>,</p>
    <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">
      Votre accès à l'espace partenaire MYSTORYFormation a été créé${organisation ? ` pour <strong>${organisation}</strong>` : ''}. Voici vos identifiants de connexion :
    </p>
    ${recapTable(
      recapRow('Email', email, true) +
      recapRow('Mot de passe', `<code style="background:#f4f4f5;padding:2px 8px;border-radius:4px;font-family:monospace;font-size:14px;">${password}</code>`, false)
    )}
    <p style="margin:0 0 16px;font-size:14px;color:#71717a;line-height:1.5;">
      Depuis votre espace, vous pouvez :
    </p>
    <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#3f3f46;line-height:1.8;">
      <li>Consulter le planning et les places disponibles</li>
      <li>Inscrire vos candidats aux sessions d'examen</li>
      <li>Suivre vos candidats et leurs résultats</li>
    </ul>
    <p style="margin:0 0 24px;font-size:13px;color:#ef4444;">
      Pour des raisons de sécurité, nous vous recommandons de changer votre mot de passe après votre première connexion.
    </p>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${loginUrl}" style="display:inline-block;background-color:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.3px;" class="cta-btn">
        Se connecter à l'espace partenaire
      </a>
    </div>`;
  return emailLayout('Accès Espace Partenaire', body);
}
