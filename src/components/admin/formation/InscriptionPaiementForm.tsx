'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import type { StagiaireFormation } from '@/types/admin';

interface Props {
  stagiaireId: number;
  stagiaire: StagiaireFormation;
  onSaved: () => void;
}

export default function InscriptionPaiementForm({ stagiaireId, stagiaire, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    modePaiement: stagiaire.modePaiement ?? '',
    montantTotal: stagiaire.montantTotal ?? 0,
    paiementPlusieursFois: stagiaire.paiementPlusieursFois,
    nombreEcheances: stagiaire.nombreEcheances ?? 2,
    numeroDossierCpf: stagiaire.numeroDossierCpf ?? '',
    statutPaiement: stagiaire.statutPaiement,
  });

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/stagiaires-formation/${stagiaireId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Inscription & Paiement</h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Mode de paiement</label>
          <select
            value={form.modePaiement}
            onChange={(e) => setForm({ ...form, modePaiement: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          >
            <option value="">Sélectionner</option>
            {['CB', 'Espèces', 'Virement', 'CPF', 'Mixte'].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Montant total (EUR)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={form.montantTotal}
            onChange={(e) => setForm({ ...form, montantTotal: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Statut paiement</label>
          <select
            value={form.statutPaiement}
            onChange={(e) => setForm({ ...form, statutPaiement: e.target.value as 'Payé' | 'En attente' | 'Partiel' | 'Impayé' })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          >
            {['Payé', 'En attente', 'Partiel', 'Impayé'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm cursor-pointer mt-6">
            <input
              type="checkbox"
              checked={form.paiementPlusieursFois}
              onChange={(e) => setForm({ ...form, paiementPlusieursFois: e.target.checked })}
              className="rounded border-slate-300"
            />
            Paiement en plusieurs fois
          </label>
        </div>
        {form.paiementPlusieursFois && (
          <div>
            <label className="block text-xs text-slate-500 mb-1">Nombre d'échéances</label>
            <select
              value={form.nombreEcheances}
              onChange={(e) => setForm({ ...form, nombreEcheances: parseInt(e.target.value) })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              {[2, 3, 4].map((n) => (
                <option key={n} value={n}>{n}x</option>
              ))}
            </select>
          </div>
        )}
        {(form.modePaiement === 'CPF' || form.modePaiement === 'Mixte') && (
          <div>
            <label className="block text-xs text-slate-500 mb-1">N° dossier CPF/EDOF</label>
            <input
              type="text"
              value={form.numeroDossierCpf}
              onChange={(e) => setForm({ ...form, numeroDossierCpf: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          disabled={saving}
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Enregistrement...' : 'Enregistrer paiement'}
        </button>
      </div>
    </div>
  );
}
