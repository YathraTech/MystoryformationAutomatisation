import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { buildPartenaireCredentialsEmail } from '@/lib/utils/email-templates';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { email, password, nom, prenom, organisation } = await request.json();

    if (!email || !password || !nom || !prenom) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
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
      password,
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
        email_subject: 'MyStoryFormation - Vos identifiants Espace Partenaire',
        email_html: emailHtml,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Send Partenaire Credentials Error]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
