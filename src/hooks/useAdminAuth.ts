'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AuthState {
  authenticated: boolean;
  id: string | null;
  email: string | null;
  role: string | null;
  lieu: string | null;
  nom: string | null;
  prenom: string | null;
  loading: boolean;
}

export function useAdminAuth() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>({
    authenticated: false,
    id: null,
    email: null,
    role: null,
    lieu: null,
    nom: null,
    prenom: null,
    loading: true,
  });

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/auth/me');
      if (res.ok) {
        const data = await res.json();
        setAuth({
          authenticated: true,
          id: data.id || null,
          email: data.email,
          role: data.role,
          lieu: data.lieu || null,
          nom: data.nom,
          prenom: data.prenom,
          loading: false,
        });
      } else {
        setAuth({ authenticated: false, id: null, email: null, role: null, lieu: null, nom: null, prenom: null, loading: false });
      }
    } catch {
      setAuth({ authenticated: false, id: null, email: null, role: null, lieu: null, nom: null, prenom: null, loading: false });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    setAuth({ authenticated: false, id: null, email: null, role: null, lieu: null, nom: null, prenom: null, loading: false });
    router.push('/login');
  }, [router]);

  return { ...auth, logout, checkAuth };
}
