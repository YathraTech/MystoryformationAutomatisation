'use client';

import { Search, Filter, X } from 'lucide-react';
import type { InscriptionFilters as Filters } from '@/types/admin';
import { INSCRIPTION_STATUSES } from '@/lib/utils/admin-constants';

interface InscriptionFiltersProps {
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string) => void;
  formations: string[];
  commercials: { id: string; nom: string }[];
  lieux: string[];
  examTypes: { value: string; label: string }[];
  totalCount: number;
  filteredCount: number;
}

export default function InscriptionFilters({
  filters,
  onFilterChange,
  formations,
  commercials,
  lieux,
  examTypes,
  totalCount,
  filteredCount,
}: InscriptionFiltersProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Filter className="h-4 w-4" />
        <span>
          {filteredCount} / {totalCount} client(s)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
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

        {/* Commercial */}
        <select
          value={filters.commercial}
          onChange={(e) => onFilterChange('commercial', e.target.value)}
          className="text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
        >
          <option value="all">Tous les commerciaux</option>
          {commercials.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>

        {/* Agence */}
        <select
          value={filters.lieu}
          onChange={(e) => onFilterChange('lieu', e.target.value)}
          className="text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
        >
          <option value="all">Toutes les agences</option>
          {lieux.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>

        {/* Examen */}
        <select
          value={filters.examen}
          onChange={(e) => onFilterChange('examen', e.target.value)}
          className="text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
        >
          <option value="all">Tous les examens</option>
          {examTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {/* Date */}
        <div className="relative">
          <input
            type="date"
            value={filters.date}
            onChange={(e) => onFilterChange('date', e.target.value)}
            className={`w-full text-sm rounded-lg border border-slate-300 px-3 py-2 pr-8 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none ${!filters.date ? '[color:transparent]' : ''}`}
          />
          {!filters.date && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              Sélectionner une date
            </span>
          )}
          {filters.date && (
            <button
              onClick={() => onFilterChange('date', '')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Effacer la date"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
