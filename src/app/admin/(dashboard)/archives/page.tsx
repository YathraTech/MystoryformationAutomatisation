'use client';

import { useState, useEffect, useCallback } from 'react';
import { Archive, RotateCcw, Trash2, AlertCircle, Search, Lock } from 'lucide-react';
import type { Inscription } from '@/types/admin';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function ArchivesPage() {
  const { role, loading: authLoading } = useAdminAuth();
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [restoring, setRestoring] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const fetchArchives = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/archives');
      if (res.ok) {
        const data = await res.json();
        setInscriptions(data.inscriptions || []);
      } else {
        setError('Erreur lors du chargement des archives');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArchives();
  }, [fetchArchives]);

  const handleRestore = async (id: number) => {
    setRestoring(id);
    try {
      const res = await fetch(`/api/admin/archives/${id}`, { method: 'PATCH' });
      if (res.ok) {
        setInscriptions((prev) => prev.filter((i) => i.rowIndex !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de la restauration');
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setRestoring(null);
    }
  };

  const handleDeleteClick = (id: number) => {
    setConfirmDelete(id);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;

    setDeleting(confirmDelete);
    try {
      const res = await fetch(`/api/admin/archives/${confirmDelete}`, { method: 'DELETE' });
      if (res.ok) {
        setInscriptions((prev) => prev.filter((i) => i.rowIndex !== confirmDelete));
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmDelete(null);
  };

  const filteredInscriptions = inscriptions.filter((i) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      i.nom.toLowerCase().includes(q) ||
      i.prenom.toLowerCase().includes(q) ||
      i.email.toLowerCase().includes(q) ||
      i.formationNom.toLowerCase().includes(q)
    );
  });

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-3 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Accès restreint</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          Cette page est réservée aux administrateurs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
            <Archive className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Archives</h1>
            <p className="text-sm text-slate-500">
              {inscriptions.length} inscription{inscriptions.length !== 1 ? 's' : ''} archivée{inscriptions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, email ou formation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Inscrit</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Email</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Formation</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Date</th>
                <th className="text-right px-5 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInscriptions.map((i) => (
                <tr key={i.rowIndex} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-800">
                      {i.prenom} {i.nom}
                    </div>
                    <div className="text-xs text-slate-500">{i.telephone}</div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{i.email}</td>
                  <td className="px-5 py-3.5 text-slate-600">{i.formationNom || '-'}</td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{i.timestamp}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleRestore(i.rowIndex)}
                        disabled={restoring === i.rowIndex}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50"
                        title="Restaurer"
                      >
                        {restoring === i.rowIndex ? (
                          <span className="h-3 w-3 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                        Restaurer
                      </button>
                      <button
                        onClick={() => handleDeleteClick(i.rowIndex)}
                        disabled={deleting === i.rowIndex}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                        title="Supprimer définitivement"
                      >
                        {deleting === i.rowIndex ? (
                          <span className="h-3 w-3 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInscriptions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    {search ? 'Aucun résultat trouvé' : 'Aucune inscription archivée'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {confirmDelete && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={handleDeleteCancel} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <div className="bg-white rounded-xl shadow-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Supprimer définitivement ?</h3>
                  <p className="text-sm text-slate-500">Cette action est irréversible</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-6">
                Êtes-vous sûr de vouloir supprimer définitivement cette inscription ?
                Toutes les données associées seront perdues et ne pourront pas être récupérées.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting !== null}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  {deleting !== null ? (
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Supprimer définitivement
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
