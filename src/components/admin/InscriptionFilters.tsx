'use client';

import { Search, Filter } from 'lucide-react';
import type { InscriptionFilters as Filters } from '@/types/admin';
import { INSCRIPTION_STATUSES } from '@/lib/utils/admin-constants';

interface InscriptionFiltersProps {
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string) => void;
  formations: string[];
  totalCount: number;
  filteredCount: number;
}

export default function InscriptionFilters({
  filters,
  onFilterChange,
  formations,
  totalCount,
  filteredCount,
}: InscriptionFiltersProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Filter className="h-4 w-4" />
        <span>
          {filteredCount} / {totalCount} inscription(s)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Rechercher nom, email, tel..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          />
        </div>

        {/* Status */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
        >
          <option value="all">Tous les statuts</option>
          {INSCRIPTION_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Formation */}
        <select
          value={filters.formation}
          onChange={(e) => onFilterChange('formation', e.target.value)}
          className="text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
        >
          <option value="all">Toutes les formations</option>
          {formations.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        {/* Date from */}
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => onFilterChange('dateFrom', e.target.value)}
          className="text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
        />
      </div>
    </div>
  );
}
