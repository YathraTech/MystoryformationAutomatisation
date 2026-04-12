'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  GraduationCap,
  Users,
  CheckCircle2,
  XCircle,
  Filter,
  ChevronRight,
} from 'lucide-react';
import type {
  StagiaireFormation,
  StagiaireStatut,
  Agence,
  FormationStats,
} from '@/types/admin';

const STATUT_LABELS: Record<StagiaireStatut, string> = {
  inscription: 'Inscription',
  test_initial: 'Test initial',
  analyse_besoin: 'Analyse besoin',
  evaluation_initiale: 'Éval. initiale',
  en_formation: 'En formation',
  test_final: 'Test final',
  evaluation_finale: 'Éval. finale',
  terminee: 'Terminée',
  abandonnee: 'Abandonnée',
};

const STATUT_COLORS: Record<StagiaireStatut, string> = {
  inscription: 'bg-gray-100 text-gray-700',
  test_initial: 'bg-blue-100 text-blue-700',
  analyse_besoin: 'bg-indigo-100 text-indigo-700',
  evaluation_initiale: 'bg-purple-100 text-purple-700',
  en_formation: 'bg-amber-100 text-amber-700',
  test_final: 'bg-cyan-100 text-cyan-700',
  evaluation_finale: 'bg-teal-100 text-teal-700',
  terminee: 'bg-green-100 text-green-700',
  abandonnee: 'bg-red-100 text-red-700',
};

const PAIEMENT_COLORS: Record<string, string> = {
  Payé: 'bg-green-100 text-green-700',
  'En attente': 'bg-yellow-100 text-yellow-700',
  Partiel: 'bg-orange-100 text-orange-700',
  Impayé: 'bg-red-100 text-red-700',
};

export default function SuiviFormationPage() {
  const [stagiaires, setStagiaires] = useState<StagiaireFormation[]>([]);
  const [stats, setStats] = useState<FormationStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<StagiaireStatut | 'all'>('all');
  const [filterAgence, setFilterAgence] = useState<Agence | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [stagRes, statsRes] = await Promise.all([
        fetch('/api/admin/stagiaires-formation'),
        fetch('/api/admin/stagiaires-formation?stats=true'),
      ]);
      const stagData = await stagRes.json();
      const statsData = await statsRes.json();
      setStagiaires(Array.isArray(stagData) ? stagData : []);
      setStats(statsData);
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtrage
  const filtered = stagiaires.filter((s) => {
    if (filterStatut !== 'all' && s.statut !== filterStatut) return false;
    if (filterAgence !== 'all' && s.agence !== filterAgence) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.nom.toLowerCase().includes(q) ||
        s.prenom.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.telephone.includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Suivi Formation</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestion des stagiaires et parcours formation Qualiopi
          </p>
        </div>
        <Link
          href="/admin/suivi-formation/nouveau"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouveau stagiaire
        </Link>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalStagiaires}</p>
                <p className="text-xs text-slate-500">Total stagiaires</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <GraduationCap className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.enFormation}</p>
                <p className="text-xs text-slate-500">En formation</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.terminees}</p>
                <p className="text-xs text-slate-500">Terminées</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.tauxSatisfaction}%
                </p>
                <p className="text-xs text-slate-500">Satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
              showFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtres
          </button>
        </div>

        {showFilters && (
          <div className="flex gap-3 mt-3 pt-3 border-t border-slate-100">
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value as StagiaireStatut | 'all')}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5"
            >
              <option value="all">Tous les statuts</option>
              {Object.entries(STATUT_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={filterAgence}
              onChange={(e) => setFilterAgence(e.target.value as Agence | 'all')}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5"
            >
              <option value="all">Toutes les agences</option>
              <option value="Gagny">Gagny</option>
              <option value="Sarcelles">Sarcelles</option>
              <option value="Rosny">Rosny</option>
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left py-3 px-4 font-medium text-slate-600">Stagiaire</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Agence</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Prestation</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Statut</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Heures</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Paiement</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Commerciale</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    {search || filterStatut !== 'all' || filterAgence !== 'all'
                      ? 'Aucun résultat pour ces filtres'
                      : 'Aucun stagiaire enregistré'}
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-slate-900">
                          {s.nom} {s.prenom}
                        </p>
                        <p className="text-xs text-slate-500">{s.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          s.agence === 'Gagny'
                            ? 'bg-blue-50 text-blue-700'
                            : s.agence === 'Sarcelles'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {s.agence}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{s.typePrestation}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          STATUT_COLORS[s.statut]
                        }`}
                      >
                        {STATUT_LABELS[s.statut]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-900 font-medium">
                          {s.heuresEffectuees}
                        </span>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-500">{s.heuresPrevues}h</span>
                      </div>
                      {s.heuresPrevues > 0 && (
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{
                              width: `${Math.min(
                                (s.heuresEffectuees / s.heuresPrevues) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          PAIEMENT_COLORS[s.statutPaiement] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {s.statutPaiement}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {s.commercialeNom || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/suivi-formation/${s.id}`}
                        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors inline-flex"
                      >
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
