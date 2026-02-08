import { NextRequest, NextResponse } from 'next/server';
import { restoreInscription, deleteInscriptionPermanently } from '@/lib/data/inscriptions';
import { getSessionUser } from '@/lib/auth/session';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') {
    return false;
  }
  return true;
}

// PATCH: Restore an archived inscription
export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const inscriptionId = parseInt(id, 10);

    if (isNaN(inscriptionId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    await restoreInscription(inscriptionId);
    return NextResponse.json({ success: true, message: 'Inscription restaurée' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Permanently delete an archived inscription
export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const inscriptionId = parseInt(id, 10);

    if (isNaN(inscriptionId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    await deleteInscriptionPermanently(inscriptionId);
    return NextResponse.json({ success: true, message: 'Inscription supprimée définitivement' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
