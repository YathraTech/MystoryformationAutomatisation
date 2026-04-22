import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildSatisfactionChaudEmail } from '@/lib/utils/email-templates';

// ============================================================
// CRON : envoi auto du questionnaire de satisfaction à chaud
// ============================================================
// Planifié par Vercel Cron (quotidien — cf. vercel.json) et/ou
// déclenchable par Make avec le header x-cron-secret.
// Règle : stagiaire encore en formation avec (heures_prevues -
// heures_effectuees) < 6 et mail pas encore envoyé.

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true; // pas de secret configuré : endpoint ouvert (dev)
  // Mode 1 — Vercel Cron : Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${expected}`) return true;
  // Mode 2 — Make / manuel : x-cron-secret: <CRON_SECRET>
  const customHeader = request.headers.get('x-cron-secret');
  if (customHeader === expected) return true;
  return false;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    const { data: candidats, error } = await supabase
      .from('stagiaires_formation')
      .select('id, prenom, nom, email, heures_prevues, heures_effectuees, statut, mail_satisfaction_chaud_envoye')
      .eq('mail_satisfaction_chaud_envoye', false)
      .in('statut', ['en_formation', 'test_final', 'evaluation_finale']);

    if (error) throw new Error(error.message);

    const webhookUrl = process.env.MAKE_ATTESTATION_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'MAKE_ATTESTATION_WEBHOOK_URL non configuré' },
        { status: 503 },
      );
    }

    const origin = new URL(request.url).origin;
    const eligibles = (candidats || []).filter((c) => {
      const restant = Number(c.heures_prevues || 0) - Number(c.heures_effectuees || 0);
      return restant < 6 && restant >= 0 && !!c.email;
    });

    const results: { id: number; success: boolean }[] = [];

    // Si SATISFACTION_CHAUD_FORM_URL est défini (Typeform/Tally/Google Forms),
    // on l'utilise — sinon on génère un lien vers /satisfaction-chaud/[token]
    const externalFormUrl = process.env.SATISFACTION_CHAUD_FORM_URL;

    for (const c of eligibles) {
      try {
        const token = Buffer.from(c.id.toString()).toString('base64');
        const formUrl = externalFormUrl
          ? (externalFormUrl.includes('?')
              ? `${externalFormUrl}&stagiaire_id=${c.id}`
              : `${externalFormUrl}?stagiaire_id=${c.id}`)
          : `${origin}/satisfaction-chaud/${token}`;
        const emailHtml = buildSatisfactionChaudEmail(c.prenom, c.nom, formUrl);

        const webhookRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'satisfaction_chaud',
            timestamp: new Date().toISOString(),
            candidat: { email: c.email, prenom: c.prenom, nom: c.nom },
            email_subject: 'MYSTORYFormation - Votre avis sur votre formation',
            email_html: emailHtml,
            form_url: formUrl,
          }),
        });

        if (webhookRes.ok) {
          await supabase
            .from('stagiaires_formation')
            .update({ mail_satisfaction_chaud_envoye: true })
            .eq('id', c.id);
          results.push({ id: c.id, success: true });
        } else {
          results.push({ id: c.id, success: false });
        }
      } catch (err) {
        console.error('[cron satisfaction-chaud]', c.id, err);
        results.push({ id: c.id, success: false });
      }
    }

    return NextResponse.json({
      checked: candidats?.length || 0,
      eligible: eligibles.length,
      sent: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    });
  } catch (error) {
    console.error('[cron send-satisfaction-chaud]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET : utilisé par Vercel Cron (qui appelle toujours en GET).
// Si authentifié → déclenche l'envoi, comme POST.
// Si non authentifié → retourne uniquement une prévisualisation
// (pratique pour vérifier sans envoyer).
export async function GET(request: NextRequest) {
  if (isAuthorized(request)) {
    return POST(request);
  }
  try {
    const supabase = createAdminClient();
    const { data: candidats } = await supabase
      .from('stagiaires_formation')
      .select('id, prenom, nom, heures_prevues, heures_effectuees')
      .eq('mail_satisfaction_chaud_envoye', false)
      .in('statut', ['en_formation', 'test_final', 'evaluation_finale']);

    const eligibles = (candidats || []).filter((c) => {
      const restant = Number(c.heures_prevues || 0) - Number(c.heures_effectuees || 0);
      return restant < 6 && restant >= 0;
    });

    return NextResponse.json({ eligible: eligibles.length, list: eligibles });
  } catch (error) {
    console.error('[cron preview]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
