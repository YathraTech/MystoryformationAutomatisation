import { NextResponse } from 'next/server';
import { getFormationById, updateFormation, deleteFormation } from '@/lib/data/formations';
import { formationUpdateSchema } from '@/lib/validations/admin.schema';
import { getSessionUser } from '@/lib/auth/session';

async function canEdit() {
  const user = await getSessionUser();
  return user && (user.role === 'admin' || user.role === 'commercial');
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formation = await getFormationById(id);

    if (!formation) {
      return NextResponse.json({ error: 'Formation non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ formation });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await canEdit())) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const result = formationUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    await updateFormation(id, result.data);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await canEdit())) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
  }

  try {
    const { id } = await params;
    await deleteFormation(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
