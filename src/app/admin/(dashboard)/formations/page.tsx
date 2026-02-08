'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import type { Formation } from '@/types/admin';
import { LANGUES, NIVEAUX } from '@/lib/utils/constants';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function FormationsPage() {
  const { role } = useAdminAuth();
  const canEdit = role === 'admin' || role === 'commercial';
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [form, setForm] = useState({
    id: '',
    nom: '',
    langue: 'Francais',
    niveau: 'Debutant',
    dureeHeures: 30,
    prix: 1500,
    description: '',
    eligibleCpf: true,
  });

  const fetchFormations = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/formations');
      if (res.ok) {
        const data = await res.json();
        setFormations(data.formations);
      }
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFormations(); }, [fetchFormations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const url = editingId
        ? `/api/admin/formations/${editingId}`
        : '/api/admin/formations';
      const method = editingId ? 'PATCH' : 'POST';
      const body = editingId
        ? { nom: form.nom, langue: form.langue, niveau: form.niveau, dureeHeures: form.dureeHeures, prix: form.prix, description: form.description, eligibleCpf: form.eligibleCpf }
        : form;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        resetForm();
        await fetchFormations();
      } else {
        const data = await res.json();
        setFormError(data.error || 'Erreur');
      }
    } catch {
      setFormError('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette formation ?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/formations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchFormations();
      }
      else alert((await res.json()).error || 'Erreur');
    } catch { alert('Erreur réseau'); }
    finally { setDeleting(null); }
  };

  const startEdit = (f: Formation) => {
    setEditingId(f.id);
    setForm({ id: f.id, nom: f.nom, langue: f.langue, niveau: f.niveau, dureeHeures: f.dureeHeures, prix: f.prix, description: f.description, eligibleCpf: f.eligibleCpf });
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ id: '', nom: '', langue: 'Francais', niveau: 'Debutant', dureeHeures: 30, prix: 1500, description: '', eligibleCpf: true });
    setShowForm(false);
    setEditingId(null);
    setFormError('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-3 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Formations</h1>
        {canEdit && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouvelle formation
          </button>
        )}
      </div>

      {showForm && canEdit && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">
            {editingId ? 'Modifier la formation' : 'Nouvelle formation'}
          </h2>

          {formError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Identifiant *</label>
                  <input type="text" required value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="ex: fr-debutant-30h" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                </div>
              )}
              <div className={!editingId ? '' : 'sm:col-span-2'}>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
                <input type="text" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Français Débutant - 30h" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Langue *</label>
                <select value={form.langue} onChange={(e) => setForm({ ...form, langue: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none">
                  {LANGUES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Niveau *</label>
                <select value={form.niveau} onChange={(e) => setForm({ ...form, niveau: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none">
                  {NIVEAUX.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Durée (heures) *</label>
                <input type="number" required min="1" max="500" value={form.dureeHeures} onChange={(e) => setForm({ ...form, dureeHeures: parseInt(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prix (€) *</label>
                <input type="number" required min="0" step="0.01" value={form.prix} onChange={(e) => setForm({ ...form, prix: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.eligibleCpf} onChange={(e) => setForm({ ...form, eligibleCpf: e.target.checked })} className="rounded border-slate-300 text-blue-700" />
                  <span className="text-sm font-medium text-slate-700">Éligible CPF</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={submitting} className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors disabled:opacity-60">
                {submitting ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Créer'}
              </button>
              <button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className={`grid border-b border-slate-200 bg-slate-50 text-sm font-semibold text-slate-600 ${canEdit ? 'grid-cols-[1fr_100px_120px_80px_90px_60px_100px]' : 'grid-cols-[1fr_100px_120px_80px_90px_60px]'}`}>
          <div className="px-4 py-3">Formation</div>
          <div className="px-4 py-3">Langue</div>
          <div className="px-4 py-3">Niveau</div>
          <div className="px-4 py-3">Durée</div>
          <div className="px-4 py-3">Prix</div>
          <div className="px-4 py-3">CPF</div>
          {canEdit && <div className="px-4 py-3 text-right">Actions</div>}
        </div>

        {/* Body */}
        <div className="divide-y divide-slate-100">
          {formations.map((f) => (
            <div
              key={f.id}
              className={`grid hover:bg-slate-50 transition-colors ${canEdit ? 'grid-cols-[1fr_100px_120px_80px_90px_60px_100px]' : 'grid-cols-[1fr_100px_120px_80px_90px_60px]'}`}
            >
              <div className="px-4 py-3.5">
                <div className="font-medium text-slate-800 text-sm">{f.nom}</div>
                <div className="text-xs text-slate-500 mt-0.5">{f.id}</div>
              </div>
              <div className="px-4 py-3.5 text-sm text-slate-600 flex items-center">{f.langue}</div>
              <div className="px-4 py-3.5 text-sm text-slate-600 flex items-center">{f.niveau}</div>
              <div className="px-4 py-3.5 text-sm text-slate-600 flex items-center">{f.dureeHeures}h</div>
              <div className="px-4 py-3.5 text-sm text-slate-600 flex items-center">{f.prix} €</div>
              <div className="px-4 py-3.5 flex items-center">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${f.eligibleCpf ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                  {f.eligibleCpf ? 'Oui' : 'Non'}
                </span>
              </div>
              {canEdit && (
                <div className="px-4 py-3.5 flex items-center justify-end gap-1">
                  <button onClick={() => startEdit(f)} className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Modifier">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(f.id)} disabled={deleting === f.id} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40" title="Supprimer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {formations.length === 0 && (
            <div className="px-5 py-8 text-center text-slate-400">Aucune formation</div>
          )}
        </div>
      </div>
    </div>
  );
}
