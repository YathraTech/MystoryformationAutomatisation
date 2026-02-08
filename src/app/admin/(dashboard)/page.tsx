'use client';

import { useStats } from '@/hooks/useStats';
import StatusBadge from '@/components/admin/StatusBadge';
import Link from 'next/link';

export default function DashboardPage() {
  const { stats, loading, error } = useStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-3 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">{error || 'Erreur de chargement'}</p>
      </div>
    );
  }

  const total = stats.totalInscriptions || 1;
  const enAttente = stats.byStatus['En attente'];
  const validees = stats.byStatus['Validee'];
  const refusees = stats.byStatus['Refusee'];

  const pctAttente = (enAttente / total) * 100;
  const pctValidees = (validees / total) * 100;
  const pctRefusees = (refusees / total) * 100;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Tableau de bord</h1>

      {/* Stats overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-6">
          {/* Total */}
          <div className="shrink-0">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Inscriptions</p>
            <p className="text-5xl font-extrabold text-slate-800 leading-none mt-1">
              {stats.totalInscriptions}
            </p>
          </div>

          {/* Breakdown */}
          <div className="flex-1 min-w-0">
            {/* Bar */}
            <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100">
              {pctAttente > 0 && (
                <div
                  className="bg-amber-400 transition-all"
                  style={{ width: `${pctAttente}%` }}
                />
              )}
              {pctValidees > 0 && (
                <div
                  className="bg-emerald-500 transition-all"
                  style={{ width: `${pctValidees}%` }}
                />
              )}
              {pctRefusees > 0 && (
                <div
                  className="bg-red-400 transition-all"
                  style={{ width: `${pctRefusees}%` }}
                />
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 mt-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="text-xs text-slate-500">En attente</span>
                <span className="text-sm font-bold text-slate-700">{enAttente}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-500">Validées</span>
                <span className="text-sm font-bold text-slate-700">{validees}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="text-xs text-slate-500">Refusées</span>
                <span className="text-sm font-bold text-slate-700">{refusees}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Par formation */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">
            Par formation
          </h2>
          {stats.byFormation.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune donnée</p>
          ) : (
            <div className="space-y-3">
              {stats.byFormation.map(({ formation, count }) => (
                <div key={formation} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 truncate mr-4">
                    {formation}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{
                          width: `${Math.max(5, (count / stats.totalInscriptions) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-800 w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dernières inscriptions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Dernières inscriptions
            </h2>
            <Link
              href="/admin/inscriptions"
              className="text-xs text-blue-700 hover:underline"
            >
              Voir tout
            </Link>
          </div>
          {stats.recentInscriptions.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune inscription</p>
          ) : (
            <div className="space-y-3">
              {stats.recentInscriptions.map((ins) => (
                <Link
                  key={ins.rowIndex}
                  href={`/admin/inscriptions/${ins.rowIndex}`}
                  className="flex items-center justify-between py-2 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {ins.prenom} {ins.nom}
                    </p>
                    <p className="text-xs text-slate-500 truncate max-w-[200px]">
                      {ins.formationNom}
                    </p>
                  </div>
                  <StatusBadge status={ins.statut} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
