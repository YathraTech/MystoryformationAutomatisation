'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import type { StagiaireFormation } from '@/types/admin';

interface Props {
  stagiaireId: number;
  stagiaire: StagiaireFormation;
  onSaved: () => void;
}

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const HORAIRES = ['9h30-12h30', '14h-17h', '9h30-12h30 / 14h-17h'];

export default function DesignationForm({ stagiaireId, stagiaire, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    formatriceId: stagiaire.formatriceId ?? '',
    formatriceNom: stagiaire.formatriceNom ?? '',
    agence: stagiaire.agence,
    joursFormation: stagiaire.joursFormation ?? [],
    horairesFormation: stagiaire.horairesFormation ?? '',
    heuresPrevues: stagiaire.heuresPrevues,
    dateDebutFormation: stagiaire.dateDebutFormation ?? '',
  });

  const toggleJour = (jour: string) => {
    setForm({
      ...form,
      joursFormation: form.joursFormation.includes(jour)
        ? form.joursFormation.filter((j) => j !== jour)
        : [...form.joursFormation, jour],
    });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/stagiaires-formation/${stagiaireId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          statut: 'en_formation',
        }),
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
      <h3 className="text-sm font-semibold text-slate-900 mb-3">
        Désignation formatrice & planning
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">
            Formatrice assignée <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Nom de la formatrice"
            value={form.formatriceNom}
            onChange={(e) => setForm({ ...form, formatriceNom: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Agence</label>
          <select
            value={form.agence}
            onChange={(e) => setForm({ ...form, agence: e.target.value as 'Gagny' | 'Sarcelles' | 'Rosny' })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          >
            <option value="Gagny">Gagny</option>
            <option value="Sarcelles">Sarcelles</option>
            <option value="Rosny">Rosny</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">
            Nombre d'heures prévues <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            value={form.heuresPrevues}
            onChange={(e) => setForm({ ...form, heuresPrevues: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Date de début</label>
          <input
            type="date"
            value={form.dateDebutFormation}
            onChange={(e) => setForm({ ...form, dateDebutFormation: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Horaires</label>
          <select
            value={form.horairesFormation}
            onChange={(e) => setForm({ ...form, horairesFormation: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          >
            <option value="">Sélectionner</option>
            {HORAIRES.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3">
        <label className="block text-xs text-slate-500 mb-1">
          Jours de formation <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {JOURS.map((jour) => (
            <button
              key={jour}
              type="button"
              onClick={() => toggleJour(jour)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                form.joursFormation.includes(jour)
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {jour}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          disabled={saving}
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
