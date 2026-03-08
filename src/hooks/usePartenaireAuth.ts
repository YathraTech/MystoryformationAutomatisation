'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface PartenaireAuthState {
  authenticated: boolean;
  id: string | null;
  email: string | null;
  role: string | null;
  organisation: string | null;
  nom: string | null;
  prenom: string | null;
  loading: boolean;
}

export function usePartenaireAuth() {
  const router = useRouter();
  const [auth, setAuth] = useState<PartenaireAuthState>({
    authenticated: false,
    id: null,
    email: null,
    role: null,
    organisation: null,
    nom: null,
    prenom: null,
    loading: true,
  });

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/partenaire/auth/me');
      if (res.ok) {
        const data = await res.json();
        setAuth({
          authenticated: true,
          id: data.id || null,
          email: data.email,
          role: data.role,
          organisation: data.organisation || null,
          nom: data.nom,
          prenom: data.prenom,
          loading: false,
        });
      } else {
        setAuth({ authenticated: false, id: null, email: null, role: null, organisation: null, nom: null, prenom: null, loading: false });
      }
    } catch {
      setAuth({ authenticated: false, id: null, email: null, role: null, organisation: null, nom: null, prenom: null, loading: false });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    setAuth({ authenticated: false, id: null, email: null, role: null, organisation: null, nom: null, prenom: null, loading: false });
    router.push('/partenaire/login');
  }, [router]);

  return { ...auth, logout, checkAuth };
}
