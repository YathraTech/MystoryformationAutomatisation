import { NextResponse } from 'next/server';
import { getArchivedInscriptions } from '@/lib/data/inscriptions';
import { getSessionUser } from '@/lib/auth/session';

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') {
    return false;
  }
  return true;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
  }

  try {
    const inscriptions = await getArchivedInscriptions();
    return NextResponse.json({ inscriptions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
