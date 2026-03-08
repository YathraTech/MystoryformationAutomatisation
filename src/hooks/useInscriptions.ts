'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Inscription, InscriptionFilters } from '@/types/admin';
import { ITEMS_PER_PAGE } from '@/lib/utils/admin-constants';

interface ExamStatusInfo {
  id: number;
  resultat: 'a_venir' | 'reussi' | 'echoue' | 'absent';
  diplome: string | null;
  dateExamen: string | null;
  lieu: string | null;
}

export function useInscriptions() {
  const [allInscriptions, setAllInscriptions] = useState<Inscription[]>([]);
  const [examStatuses, setExamStatuses] = useState<Record<string, ExamStatusInfo[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<InscriptionFilters>({
    search: '',
    status: 'all',
    formation: 'all',
    commercial: 'all',
    date: '',
    lieu: 'all',
    examen: 'all',
  });

  const fetchInscriptions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [insRes, examRes] = await Promise.all([
        fetch('/api/admin/inscriptions'),
        fetch('/api/admin/inscriptions/exam-statuses'),
      ]);
      if (!insRes.ok) throw new Error('Erreur réseau');
      const insData = await insRes.json();
      setAllInscriptions(insData.inscriptions);

      if (examRes.ok) {
        const examData = await examRes.json();
        setExamStatuses(examData.statuses ?? {});
      }
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

    if (filters.commercial !== 'all') {
      result = result.filter((ins) => ins.commercialId === filters.commercial);
    }

    if (filters.date) {
      result = result.filter((ins) => ins.timestamp.startsWith(filters.date));
    }

    if (filters.lieu !== 'all') {
      result = result.filter((ins) => ins.lieu === filters.lieu);
    }

    if (filters.examen !== 'all') {
      result = result.filter((ins) => {
        const examens = examStatuses[ins.email.toLowerCase()] || [];
        return examens.some((ex) =>
          ex.diplome ? ex.diplome.startsWith(filters.examen) : false
        );
      });
    }

    return result;
  }, [allInscriptions, filters, examStatuses]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const formations = useMemo(() => {
    const set = new Set(allInscriptions.map((i) => i.formationNom).filter(Boolean));
    return Array.from(set).sort();
  }, [allInscriptions]);

  const commercials = useMemo(() => {
    const map = new Map<string, string>();
    for (const ins of allInscriptions) {
      if (ins.commercialId && ins.commercialNom && !map.has(ins.commercialId)) {
        map.set(ins.commercialId, ins.commercialNom);
      }
    }
    return Array.from(map.entries())
      .map(([id, nom]) => ({ id, nom }))
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }, [allInscriptions]);

  const lieux = useMemo(() => {
    const set = new Set(allInscriptions.map((i) => i.lieu).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [allInscriptions]);

  const examTypes = useMemo(() => {
    const labels: Record<string, string> = {
      'CIVIQUE:carte_pluriannuelle': 'Civique CSP',
      'CIVIQUE:carte_residence': 'Civique CR',
      'CIVIQUE:naturalisation': 'Civique Naturalisation',
      'TEF_IRN': 'TEF IRN',
    };

    const seen = new Set<string>();
    const result: { value: string; label: string }[] = [];

    for (const examens of Object.values(examStatuses)) {
      for (const ex of examens) {
        if (!ex.diplome) continue;
        // Try exact match first (for CIVIQUE variants)
        if (labels[ex.diplome] && !seen.has(ex.diplome)) {
          seen.add(ex.diplome);
          result.push({ value: ex.diplome, label: labels[ex.diplome] });
        }
        // Also extract the type prefix (e.g. TEF_IRN from TEF_IRN:A1)
        const prefix = ex.diplome.split(':')[0];
        if (labels[prefix] && !seen.has(prefix)) {
          seen.add(prefix);
          result.push({ value: prefix, label: labels[prefix] });
        }
      }
    }

    return result.sort((a, b) => a.label.localeCompare(b.label));
  }, [examStatuses]);

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
    commercials,
    lieux,
    examTypes,
    examStatuses,
    refetch: fetchInscriptions,
  };
}
