'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, X, Check, BookOpen, Clock, BadgeEuro,
  AlertCircle, GraduationCap, Loader2,
} from 'lucide-react';
import type { Formation } from '@/types/admin';
import { formatPrice } from '@/lib/utils/format';

const NIVEAUX = ['A1', 'A2', 'B1', 'B2'];

// Génère un identifiant (slug) à partir du nom
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface FormState {
  id: string;
  nom: string;
  niveau: string;
  dureeHeures: number;
  prix: number;
  description: string;
  eligibleCpf: boolean;
}

const EMPTY_FORM: FormState = {
  id: '', nom: '', niveau: 'A1', dureeHeures: 60, prix: 0, description: '', eligibleCpf: true,
};

export default function FormationsPage() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [idEdited, setIdEdited] = useState(false); // l'utilisateur a-t-il modifié l'id manuellement ?
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchFormations = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/formations');
      const data = await res.json();
      setFormations(Array.isArray(data.formations) ? data.formations : []);
    } catch {
      setError('Impossible de charger les formations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFormations(); }, [fetchFormations]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setIdEdited(false);
    setForm(EMPTY_FORM);
  };

  const openNew = () => {
    setEditingId(null);
    setIdEdited(false);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (f: Formation) => {
    setEditingId(f.id);
    setIdEdited(true);
    setForm({
      id: f.id,
      nom: f.nom,
      niveau: f.niveau,
      dureeHeures: f.dureeHeures,
      prix: f.prix,
      description: f.description || '',
      eligibleCpf: f.eligibleCpf,
    });
    setShowForm(true);
  };

  // Auto-slug de l'id depuis le nom tant que l'id n'a pas été modifié à la main (création seulement)
  const setNom = (nom: string) => {
    setForm((prev) => ({
      ...prev,
      nom,
      id: !editingId && !idEdited ? slugify(nom) : prev.id,
    }));
  };

  const handleSave = async () => {
    setError('');
    if (!form.nom.trim()) { setError('Le nom est requis'); return; }
    if (!editingId && !form.id.trim()) { setError('L\'identifiant est requis'); return; }
    setSaving(true);
    try {
      let res: Response;
      if (editingId) {
        res = await fetch(`/api/admin/formations/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nom: form.nom.trim(),
            langue: 'Francais',
            niveau: form.niveau,
            dureeHeures: form.dureeHeures,
            prix: form.prix,
            description: form.description,
            eligibleCpf: form.eligibleCpf,
          }),
        });
      } else {
        res = await fetch('/api/admin/formations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: form.id.trim(),
            nom: form.nom.trim(),
            langue: 'Francais',
            niveau: form.niveau,
            dureeHeures: form.dureeHeures,
            prix: form.prix,
            description: form.description,
            eligibleCpf: form.eligibleCpf,
          }),
        });
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Erreur lors de l\'enregistrement');
        return;
      }
      resetForm();
      fetchFormations();
    } catch {
      setError('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (f: Formation) => {
    if (!confirm(`Supprimer la formation « ${f.nom} » ? Cette action est définitive.`)) return;
    try {
      const res = await fetch(`/api/admin/formations/${f.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Erreur lors de la suppression');
        return;
      }
      fetchFormations();
    } catch {
      setError('Erreur réseau');
    }
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catalogue des formations</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez les offres de formation proposées (durée, prix, éligibilité CPF). Ces formations
            alimentent le formulaire d&apos;inscription et l&apos;analyse de besoin.
          </p>
        </div>
        <button
          onClick={openNew}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Nouvelle formation
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Formulaire création / édition */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 overflow-hidden">
          <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-blue-800">
              {editingId ? 'Modifier la formation' : 'Nouvelle formation'}
            </span>
            <button onClick={resetForm}><X className="h-4 w-4 text-slate-400" /></button>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nom *</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Formation TEF IRN - 100h"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Identifiant {editingId ? '(non modifiable)' : '*'}
                </label>
                <input
                  type="text"
                  value={form.id}
                  disabled={!!editingId}
                  onChange={(e) => { setIdEdited(true); setForm({ ...form, id: slugify(e.target.value) }); }}
                  placeholder="ex: tef-irn-100h"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Niveau</label>
                <select
                  value={form.niveau}
                  onChange={(e) => setForm({ ...form, niveau: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {NIVEAUX.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Durée (heures)</label>
                <input
                  type="number" min={1} max={500} step={1}
                  value={form.dureeHeures}
                  onChange={(e) => setForm({ ...form, dureeHeures: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Prix (€)</label>
                <input
                  type="number" min={0} max={99999} step={0.01}
                  value={form.prix}
                  onChange={(e) => setForm({ ...form, prix: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={form.eligibleCpf}
                    onChange={(e) => setForm({ ...form, eligibleCpf: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  Éligible CPF
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Description courte de la formation (facultatif)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button onClick={resetForm}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving || !form.nom.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Créer la formation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des formations */}
      {formations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-slate-200 bg-white">
          <div className="rounded-full bg-slate-100 p-3 mb-3">
            <GraduationCap className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-sm text-slate-600">Aucune formation dans le catalogue.</p>
          <button onClick={openNew} className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800">
            <Plus className="h-4 w-4" /> Créer la première formation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {formations.map((f) => (
            <div key={f.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="h-4 w-4 text-blue-500 shrink-0" />
                  <h3 className="text-sm font-semibold text-slate-900 truncate">{f.nom}</h3>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                    <Pencil className="h-4 w-4 text-slate-400" />
                  </button>
                  <button onClick={() => handleDelete(f)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>
              {f.description && (
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">{f.description}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                  Niveau {f.niveau}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {f.dureeHeures}h
                </span>
                <span className="flex items-center gap-1 font-semibold text-blue-700">
                  <BadgeEuro className="h-3.5 w-3.5" /> {formatPrice(f.prix)}
                </span>
                {f.eligibleCpf && (
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700 border border-green-200">
                    Éligible CPF
                  </span>
                )}
              </div>
              <p className="mt-2 text-[10px] text-slate-300">{f.id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
