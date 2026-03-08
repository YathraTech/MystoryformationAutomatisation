'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Users } from 'lucide-react';

interface Candidat {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  diplome: string | null;
  dateExamen: string | null;
  heureExamen: string | null;
  lieu: string | null;
  resultat: string;
  typeExamen: string | null;
  createdAt: string;
}

const RESULTAT_BADGES: Record<string, { label: string; color: string }> = {
  a_venir: { label: 'À venir', color: 'bg-blue-50 text-blue-700' },
  reussi: { label: 'Réussi', color: 'bg-green-50 text-green-700' },
  echoue: { label: 'Échoué', color: 'bg-red-50 text-red-700' },
  absent: { label: 'Absent', color: 'bg-slate-100 text-slate-600' },
};

export default function PartenaireCandidatsPage() {
  const [candidats, setCandidats] = useState<Candidat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCandidats = useCallback(async () => {
    try {
      const res = await fetch('/api/partenaire/candidats');
      if (res.ok) {
        const data = await res.json();
        setCandidats(data);
      } else {
        setError('Erreur lors du chargement');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidats();
  }, [fetchCandidats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-3 border-violet-200 border-t-violet-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Mes candidats</h1>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700 border border-violet-200">
          <Users className="h-4 w-4" />
          {candidats.length} candidat{candidats.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Nom</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Email</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Diplôme</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Date examen</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Lieu</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Résultat</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {candidats.map((c) => {
                const badge = RESULTAT_BADGES[c.resultat] || RESULTAT_BADGES.a_venir;
                return (
                  <tr
                    key={c.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-800">
                        {c.prenom} {c.nom}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{c.email}</td>
                    <td className="px-5 py-3.5 text-slate-600">{c.diplome || c.typeExamen || '-'}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {c.dateExamen
                        ? new Date(c.dateExamen).toLocaleDateString('fr-FR')
                        : 'Non planifié'}
                      {c.heureExamen && ` ${c.heureExamen.slice(0, 5)}`}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{c.lieu || '-'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                );
              })}
              {candidats.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    Aucun candidat inscrit
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
