'use client';

import { useState, useEffect } from 'react';
import type { DashboardStats } from '@/types/admin';

export function useStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats');
        if (!res.ok) throw new Error('Erreur réseau');
        const data = await res.json();
        setStats(data);
      } catch {
        setError('Impossible de charger les statistiques');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return { stats, loading, error };
}
