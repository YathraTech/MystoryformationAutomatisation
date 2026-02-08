import { NextResponse } from 'next/server';
import { getAllFormations, createFormation } from '@/lib/data/formations';
import { formationCreateSchema } from '@/lib/validations/admin.schema';
import { getSessionUser } from '@/lib/auth/session';

async function canEdit() {
  const user = await getSessionUser();
  return user && (user.role === 'admin' || user.role === 'commercial');
}

export async function GET() {
  try {
    const formations = await getAllFormations();
    return NextResponse.json({ formations });
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des formations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await canEdit())) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const result = formationCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }

    const formation = await createFormation(result.data);
    return NextResponse.json({ formation }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
