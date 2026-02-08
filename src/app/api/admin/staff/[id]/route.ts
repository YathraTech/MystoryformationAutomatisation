import { NextResponse } from 'next/server';
import { deleteUser, getUserById, sendPasswordResetEmail } from '@/lib/auth/users';
import { getSessionUser } from '@/lib/auth/session';

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') {
    return false;
  }
  return true;
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
  }

  try {
    const { id } = await params;

    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    await deleteUser(id);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

// POST: Send password reset email
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
  }

  try {
    const { id } = await params;

    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    await sendPasswordResetEmail(user.email);

    return NextResponse.json({
      success: true,
      message: `Email de réinitialisation envoyé à ${user.email}`
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
