import { NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validations/auth.schema';
import { createClient } from '@/lib/supabase/server';
import { seedAdminUser } from '@/lib/auth/users';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // Seed admin on first login attempt if no admin exists
    try {
      await seedAdminUser();
    } catch {
      // Continue even if seed fails
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
