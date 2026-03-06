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
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">MyStoryFormation</h1>
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
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#3f3f46;">MyStoryFormation</p>
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
    <td style="padding:6px 0;font-size:13px;color:#71717a;${borderStyle}width:140px;">${label}</td>
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
