import type { StagiaireFormation } from '@/types/admin';

// ============================================================
// Helpers réutilisés depuis email-templates.ts
// ============================================================

function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function emailLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="background-color:#1e1e1e;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">MYSTORYFormation</h1>
              <p style="margin:6px 0 0;font-size:13px;color:#a1a1aa;">Centre de formation et d'examens</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px 20px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #e4e4e7;margin:12px 0;"></td>
          </tr>
          <tr>
            <td style="padding:20px 40px 32px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#3f3f46;">MYSTORYFormation</p>
              <p style="margin:0;font-size:12px;color:#71717a;">01 43 09 15 40 | contact@mystoryformation.fr</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:#71717a;width:40%;">${label}</td>
    <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1e1e1e;">${value}</td>
  </tr>`;
}

function infoTable(rows: string): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:20px 24px;margin:16px 0;">
    ${rows}
  </table>`;
}

// ============================================================
// MAIL 1: Inscription validée (Convention + docs)
// ============================================================
export function buildInscriptionFormationEmail(stagiaire: StagiaireFormation): {
  subject: string;
  html: string;
} {
  const subject = `Confirmation d'inscription - ${stagiaire.typePrestation} | MYSTORYFormation`;

  const body = `
    <div style="background-color:#dcfce7;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;font-weight:600;color:#166534;">Votre inscription est confirmée !</p>
    </div>

    <p style="font-size:14px;color:#3f3f46;line-height:1.6;">
      ${stagiaire.civilite} ${stagiaire.nom},
    </p>
    <p style="font-size:14px;color:#3f3f46;line-height:1.6;">
      Nous avons le plaisir de vous confirmer votre inscription à la formation
      <strong>${stagiaire.typePrestation}</strong> au centre <strong>${stagiaire.agence}</strong>.
    </p>

    ${infoTable(
      infoRow('Formation', stagiaire.typePrestation) +
      infoRow('Durée', `${stagiaire.heuresPrevues} heures`) +
      infoRow('Agence', stagiaire.agence) +
      infoRow('Date de début', formatDate(stagiaire.dateDebutFormation)) +
      infoRow('Horaires', stagiaire.horairesFormation || '-') +
      infoRow('Formatrice', stagiaire.formatriceNom || 'À confirmer')
    )}

    <p style="font-size:14px;color:#3f3f46;line-height:1.6;">
      Vous trouverez en pièces jointes les documents suivants :
    </p>
    <ul style="font-size:14px;color:#3f3f46;line-height:1.8;">
      <li>Convention de formation</li>
      <li>Livret d'accueil</li>
      <li>Règlement intérieur</li>
      <li>Conditions générales de vente</li>
      <li>Programme de formation</li>
      <li>Convocation à la première séance</li>
    </ul>

    <p style="font-size:13px;color:#71717a;margin-top:24px;">
      Pour toute question, n'hésitez pas à nous contacter.
    </p>
  `;

  return { subject, html: emailLayout(subject, body) };
}

// ============================================================
// MAIL 2: Rappel J-2 première séance
// ============================================================
export function buildRappelFormationEmail(stagiaire: StagiaireFormation): {
  subject: string;
  html: string;
} {
  const subject = `Rappel : Votre formation commence bientôt | MYSTORYFormation`;

  const body = `
    <div style="background-color:#dbeafe;border:1px solid #bfdbfe;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;font-weight:600;color:#1e40af;">Rappel de votre formation</p>
    </div>

    <p style="font-size:14px;color:#3f3f46;line-height:1.6;">
      ${stagiaire.civilite} ${stagiaire.nom},
    </p>
    <p style="font-size:14px;color:#3f3f46;line-height:1.6;">
      Nous vous rappelons que votre première séance de formation est prévue prochainement.
    </p>

    ${infoTable(
      infoRow('Date', formatDate(stagiaire.dateDebutFormation)) +
      infoRow('Horaire', stagiaire.horairesFormation || '-') +
      infoRow('Lieu', stagiaire.agence)
    )}

    <p style="font-size:14px;font-weight:600;color:#3f3f46;">Documents à apporter :</p>
    <ul style="font-size:14px;color:#3f3f46;line-height:1.8;">
      <li>Pièce d'identité en cours de validité</li>
      <li>Un stylo et un cahier de notes</li>
    </ul>

    <p style="font-size:13px;color:#71717a;margin-top:24px;">
      Nous vous attendons avec impatience !
    </p>
  `;

  return { subject, html: emailLayout(subject, body) };
}

// ============================================================
// MAIL 3: Absence formation (relance automatique)
// ============================================================
export function buildAbsenceFormationEmail(
  stagiaire: StagiaireFormation,
  dateAbsence: string
): {
  subject: string;
  html: string;
} {
  const subject = `Absence constatée le ${formatDate(dateAbsence)} | MYSTORYFormation`;

  const body = `
    <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;font-weight:600;color:#991b1b;">Absence constatée</p>
    </div>

    <p style="font-size:14px;color:#3f3f46;line-height:1.6;">
      ${stagiaire.civilite} ${stagiaire.nom},
    </p>
    <p style="font-size:14px;color:#3f3f46;line-height:1.6;">
      Nous avons constaté votre absence à la formation du <strong>${formatDate(dateAbsence)}</strong>.
    </p>
    <p style="font-size:14px;color:#3f3f46;line-height:1.6;">
      Merci de nous fournir un justificatif sous <strong>48 heures</strong> en répondant à cet email
      ou en contactant notre centre.
    </p>

    <p style="font-size:13px;color:#71717a;margin-top:24px;">
      Sans retour de votre part, cette absence sera considérée comme non justifiée.
    </p>
  `;

  return { subject, html: emailLayout(subject, body) };
}

// ============================================================
// MAIL 4: Attestation de fin de formation
// ============================================================
export function buildAttestationFinFormationEmail(stagiaire: StagiaireFormation): {
  subject: string;
  html: string;
} {
  const subject = `Votre attestation de fin de formation | MYSTORYFormation`;

  const body = `
    <div style="background-color:#dcfce7;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;font-weight:600;color:#166534;">Félicitations ! Votre formation est terminée</p>
    </div>

    <p style="font-size:14px;color:#3f3f46;line-height:1.6;">
      ${stagiaire.civilite} ${stagiaire.nom},
    </p>
    <p style="font-size:14px;color:#3f3f46;line-height:1.6;">
      Nous avons le plaisir de vous informer que votre formation
      <strong>${stagiaire.typePrestation}</strong> est terminée.
    </p>
    <p style="font-size:14px;color:#3f3f46;line-height:1.6;">
      Vous trouverez en pièce jointe votre <strong>attestation de fin de formation</strong>.
    </p>

    ${infoTable(
      infoRow('Formation', stagiaire.typePrestation) +
      infoRow('Durée effectuée', `${stagiaire.heuresEffectuees} heures`) +
      infoRow('Agence', stagiaire.agence)
    )}

    <p style="font-size:14px;color:#3f3f46;line-height:1.6;">
      Nous vous souhaitons plein succès dans vos démarches futures.
    </p>
  `;

  return { subject, html: emailLayout(subject, body) };
}

// ============================================================
// MAIL 5: Questionnaire satisfaction à froid (J+30)
// ============================================================
export function buildSatisfactionFroidEmail(
  stagiaire: StagiaireFormation,
  lienQuestionnaire: string
): {
  subject: string;
  html: string;
} {
  const subject = `Votre avis nous intéresse - Satisfaction formation | MYSTORYFormation`;

  const body = `
    <p style="font-size:14px;color:#3f3f46;line-height:1.6;">
      ${stagiaire.civilite} ${stagiaire.nom},
    </p>
    <p style="font-size:14px;color:#3f3f46;line-height:1.6;">
      Il y a 30 jours, vous avez terminé votre formation
      <strong>${stagiaire.typePrestation}</strong> chez MYSTORYFormation.
    </p>
    <p style="font-size:14px;color:#3f3f46;line-height:1.6;">
      Votre avis est précieux pour nous aider à améliorer nos formations.
      Pourriez-vous prendre <strong>2 minutes</strong> pour répondre à notre questionnaire ?
    </p>

    <div style="text-align:center;margin:28px 0;">
      <a href="${lienQuestionnaire}"
         style="display:inline-block;padding:14px 32px;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
        Répondre au questionnaire
      </a>
    </div>

    <p style="font-size:13px;color:#71717a;">
      Ce questionnaire est anonyme et ne prendra que quelques minutes.
    </p>
  `;

  return { subject, html: emailLayout(subject, body) };
}

// ============================================================
// MAIL 6: Relance paiement impayé
// ============================================================
export function buildRelancePaiementEmail(stagiaire: StagiaireFormation): {
  subject: string;
  html: string;
} {
  const subject = `Rappel de paiement - Formation ${stagiaire.typePrestation} | MYSTORYFormation`;

  const body = `
    <div style="background-color:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;font-weight:600;color:#92400e;">Rappel de paiement</p>
    </div>

    <p style="font-size:14px;color:#3f3f46;line-height:1.6;">
      ${stagiaire.civilite} ${stagiaire.nom},
    </p>
    <p style="font-size:14px;color:#3f3f46;line-height:1.6;">
      Nous nous permettons de vous rappeler qu'un paiement est en attente pour votre formation.
    </p>

    ${infoTable(
      infoRow('Formation', stagiaire.typePrestation) +
      infoRow('Montant', `${stagiaire.montantTotal || '-'} EUR`) +
      infoRow('Statut', stagiaire.statutPaiement)
    )}

    <p style="font-size:14px;color:#3f3f46;line-height:1.6;">
      Merci de régulariser votre situation dans les plus brefs délais.
      N'hésitez pas à nous contacter pour tout arrangement.
    </p>
  `;

  return { subject, html: emailLayout(subject, body) };
}
