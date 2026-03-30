import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { buildPartenaireCredentialsEmail } from '@/lib/utils/email-templates';
import { createClient } from '@supabase/supabase-js';

function generatePassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { email, password, nom, prenom, organisation, userId } = await request.json();

    if (!email || !nom || !prenom) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    let finalPassword = password;

    // Si pas de mot de passe fourni mais un userId, générer un nouveau mdp et le mettre à jour
    if (!finalPassword && userId) {
      finalPassword = generatePassword();

      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: finalPassword,
      });

      if (updateError) {
        console.error('[Reset Password Error]', updateError);
        return NextResponse.json({ error: 'Erreur lors de la réinitialisation du mot de passe' }, { status: 500 });
      }
    }

    if (!finalPassword) {
      return NextResponse.json({ error: 'Mot de passe requis' }, { status: 400 });
    }

    const webhookUrl = process.env.MAKE_ATTESTATION_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook non configuré' }, { status: 500 });
    }

    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mystoryformation-admin.fr'}/partenaire/login`;

    const emailHtml = buildPartenaireCredentialsEmail(
      prenom,
      nom,
      email,
      finalPassword,
      loginUrl,
      organisation || undefined,
    );

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'partenaire_credentials',
        timestamp: new Date().toISOString(),
        candidat: {
          email,
          prenom,
          nom,
        },
        email_subject: 'MYSTORYFormation - Vos identifiants Espace Partenaire',
        email_html: emailHtml,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Send Partenaire Credentials Error]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
