import { createClient } from '@/lib/supabase/server';

export async function getSessionUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    id: user.id,
    email: profile.email,
    nom: profile.nom,
    prenom: profile.prenom,
    role: profile.role as 'admin' | 'staff' | 'commercial',
  };
}
