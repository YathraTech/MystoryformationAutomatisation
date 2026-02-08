import { NextResponse } from 'next/server';
import { getSafeUsers, createUser } from '@/lib/auth/users';
import type { UserRole, UserLieu } from '@/lib/auth/users';
import { getSessionUser } from '@/lib/auth/session';
import { z } from 'zod';

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
    const users = await getSafeUsers();
    return NextResponse.json(users);
  } catch {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

const createUserSchema = z.object({
  email: z.string().min(1).email(),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères').optional(),
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  role: z.enum(['admin', 'staff', 'commercial'] as const),
  lieu: z.enum(['Gagny', 'Sarcelles'] as const).nullable().optional(),
});

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const result = createUserSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }

    const user = await createUser(result.data as {
      email: string;
      password?: string;
      nom: string;
      prenom: string;
      role: UserRole;
      lieu?: UserLieu | null;
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
