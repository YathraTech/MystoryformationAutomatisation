import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    id: user.id,
    email: user.email,
    role: user.role,
    nom: user.nom,
    prenom: user.prenom,
    lieu: user.lieu,
  });
}
