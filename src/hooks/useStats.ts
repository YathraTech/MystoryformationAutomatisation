'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DashboardStats } from '@/types/admin';

export function useStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/stats', { cache: 'no-store' });
      if (!res.ok) throw new Error('Erreur réseau');
      const data = await res.json();
      setStats(data);
      setError('');
    } catch {
      setError('Impossible de charger les statistiques');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refresh = useCallback(() => fetchStats(true), [fetchStats]);

  return { stats, loading, refreshing, error, refresh };
}
