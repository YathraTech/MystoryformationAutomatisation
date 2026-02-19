import { NextResponse } from 'next/server';
import { deleteUser, getUserById, sendPasswordResetEmail } from '@/lib/auth/users';
import { getSessionUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

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

// PATCH: Update user fields (objectif_ca)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const updateData: Record<string, number | null> = {};
    if ('objectifCa' in body) {
      const val = body.objectifCa;
      updateData.objectif_ca = (val !== null && val !== undefined && val !== '') ? Number(val) : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id);

    if (error) throw new Error(error.message);

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
