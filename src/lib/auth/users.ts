import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type UserRole = 'admin' | 'staff' | 'commercial';
export type UserLieu = 'Gagny' | 'Sarcelles';

export interface SafeUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: UserRole;
  lieu: UserLieu | null;
  objectifCa: number | null;
  createdAt: string;
}

export async function getSafeUsers(): Promise<SafeUser[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);

  return (data || []).map((p) => ({
    id: p.id,
    email: p.email,
    nom: p.nom,
    prenom: p.prenom,
    role: p.role as UserRole,
    lieu: p.lieu as UserLieu | null,
    objectifCa: p.objectif_ca ?? null,
    createdAt: p.created_at,
  }));
}

export async function getUserByEmail(email: string): Promise<SafeUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email,
    nom: data.nom,
    prenom: data.prenom,
    role: data.role as UserRole,
    lieu: data.lieu as UserLieu | null,
    objectifCa: data.objectif_ca ?? null,
    createdAt: data.created_at,
  };
}

export async function getUserById(id: string): Promise<SafeUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email,
    nom: data.nom,
    prenom: data.prenom,
    role: data.role as UserRole,
    lieu: data.lieu as UserLieu | null,
    objectifCa: data.objectif_ca ?? null,
    createdAt: data.created_at,
  };
}

export async function createUser(data: {
  email: string;
  password?: string;
  nom: string;
  prenom: string;
  role: UserRole;
  lieu?: UserLieu | null;
}): Promise<SafeUser> {
  const admin = createAdminClient();
  const emailLower = data.email.toLowerCase();

  if (data.password) {
    // Cas 1: Mot de passe défini par l'admin
    const { data: authData, error } = await admin.auth.admin.createUser({
      email: emailLower,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        nom: data.nom,
        prenom: data.prenom,
        role: data.role,
        lieu: data.lieu || null,
      },
    });

    if (error || !authData.user) {
      throw new Error(error?.message || 'Erreur lors de la création');
    }

    return {
      id: authData.user.id,
      email: emailLower,
      nom: data.nom,
      prenom: data.prenom,
      role: data.role,
      lieu: data.lieu || null,
      objectifCa: null,
      createdAt: authData.user.created_at,
    };
  } else {
    // Cas 2: Pas de mot de passe - inviter l'utilisateur à le définir
    const { data: authData, error } = await admin.auth.admin.createUser({
      email: emailLower,
      email_confirm: true,
      user_metadata: {
        nom: data.nom,
        prenom: data.prenom,
        role: data.role,
        lieu: data.lieu || null,
      },
    });

    if (error || !authData.user) {
      throw new Error(error?.message || 'Erreur lors de la création');
    }

    // Envoyer l'email d'invitation pour définir le mot de passe
    await admin.auth.resetPasswordForEmail(emailLower, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/reset-password`,
    });

    return {
      id: authData.user.id,
      email: emailLower,
      nom: data.nom,
      prenom: data.prenom,
      role: data.role,
      lieu: data.lieu || null,
      objectifCa: null,
      createdAt: authData.user.created_at,
    };
  }
}

export async function deleteUser(id: string): Promise<void> {
  const supabase = await createClient();

  // Check not last admin
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin');

  if (admins && admins.length <= 1 && admins[0]?.id === id) {
    throw new Error('Impossible de supprimer le dernier administrateur');
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);

  if (error) throw new Error(error.message);
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/reset-password`,
  });

  if (error) throw new Error(error.message);
}

export async function seedAdminUser(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const admin = createAdminClient();
  const { data: existing } = await admin.from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1);

  if (existing && existing.length > 0) return;

  try {
    await createUser({
      email,
      password,
      nom: 'Admin',
      prenom: 'MSF',
      role: 'admin',
    });
    console.log('Admin user seeded:', email);
  } catch (err) {
    console.error('Seed admin error:', err);
  }
}
