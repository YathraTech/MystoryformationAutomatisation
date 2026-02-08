'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Inscription, InscriptionFilters } from '@/types/admin';
import { ITEMS_PER_PAGE } from '@/lib/utils/admin-constants';

export function useInscriptions() {
  const [allInscriptions, setAllInscriptions] = useState<Inscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<InscriptionFilters>({
    search: '',
    status: 'all',
    formation: 'all',
    dateFrom: '',
    dateTo: '',
  });

  const fetchInscriptions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/inscriptions');
      if (!res.ok) throw new Error('Erreur réseau');
      const data = await res.json();
      setAllInscriptions(data.inscriptions);
    } catch {
      setError('Impossible de charger les inscriptions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInscriptions();
  }, [fetchInscriptions]);

  const filtered = useMemo(() => {
    let result = [...allInscriptions];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (ins) =>
          ins.nom.toLowerCase().includes(q) ||
          ins.prenom.toLowerCase().includes(q) ||
          ins.email.toLowerCase().includes(q) ||
          ins.telephone.includes(q)
      );
    }

    if (filters.status === 'all') {
      // By default, hide archived inscriptions
      result = result.filter((ins) => ins.statut !== 'Archivee');
    } else {
      result = result.filter((ins) => ins.statut === filters.status);
    }

    if (filters.formation !== 'all') {
      result = result.filter((ins) => ins.formationNom === filters.formation);
    }

    if (filters.dateFrom) {
      result = result.filter((ins) => ins.timestamp >= filters.dateFrom);
    }
    if (filters.dateTo) {
      result = result.filter((ins) => ins.timestamp <= filters.dateTo);
    }

    return result;
  }, [allInscriptions, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const formations = useMemo(() => {
    const set = new Set(allInscriptions.map((i) => i.formationNom).filter(Boolean));
    return Array.from(set).sort();
  }, [allInscriptions]);

  const updateFilter = useCallback(
    (key: keyof InscriptionFilters, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPage(1);
    },
    []
  );

  return {
    inscriptions: paginated,
    allCount: allInscriptions.length,
    filteredCount: filtered.length,
    loading,
    error,
    page,
    totalPages,
    setPage,
    filters,
    updateFilter,
    formations,
    refetch: fetchInscriptions,
  };
}
