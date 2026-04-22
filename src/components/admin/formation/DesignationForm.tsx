'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Save, Clock, MapPin, Users } from 'lucide-react';
import type { StagiaireFormation } from '@/types/admin';

interface Creneau {
  id: number;
  label: string;
  jour: string;
  heure_debut: string;
  heure_fin: string;
  duree_heures: number;
  agence: string;
  places_max: number;
  actif: boolean;
  ordre: number;
}

const DAY_CAP: Record<string, string> = {
  lundi: 'Lundi',
  mardi: 'Mardi',
  mercredi: 'Mercredi',
  jeudi: 'Jeudi',
  vendredi: 'Vendredi',
  samedi: 'Samedi',
  dimanche: 'Dimanche',
};

interface Props {
  stagiaireId: number;
  stagiaire: StagiaireFormation;
  onSaved: () => void;
}

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

  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [selectedCreneauIds, setSelectedCreneauIds] = useState<number[]>([]);

  useEffect(() => {
    fetch('/api/admin/formation-creneaux')
      .then((res) => (res.ok ? res.json() : { creneaux: [] }))
      .then((data) => {
        const list: Creneau[] = (data.creneaux || []).filter((c: Creneau) => c.actif);
        setCreneaux(list);
      })
      .catch(() => setCreneaux([]));
  }, []);

  const availableCreneaux = creneaux.filter((c) => c.agence === form.agence);

  const toggleCreneau = (c: Creneau) => {
    const already = selectedCreneauIds.includes(c.id);
    const nextIds = already
      ? selectedCreneauIds.filter((id) => id !== c.id)
      : [...selectedCreneauIds, c.id];
    setSelectedCreneauIds(nextIds);

    const nextSelected = creneaux.filter((x) => nextIds.includes(x.id));
    const nextDays = Array.from(
      new Set(nextSelected.map((x) => DAY_CAP[x.jour] || x.jour))
    );
    // Horaires : concatène les créneaux distincts avec " / "
    const nextHoraires = Array.from(
      new Set(nextSelected.map((x) => `${x.heure_debut}-${x.heure_fin}`))
    ).join(' / ');

    setForm((prev) => ({
      ...prev,
      joursFormation: nextDays,
      horairesFormation: nextHoraires || prev.horairesFormation,
    }));
  };

  // Champs requis → liste des champs manquants
  const missingFields: string[] = [];
  if (!form.formatriceNom.trim()) missingFields.push('Formatrice assignée');
  if (!form.agence) missingFields.push('Agence');
  if (!form.heuresPrevues || form.heuresPrevues <= 0) missingFields.push('Nombre d\'heures prévues');
  if (!form.dateDebutFormation) missingFields.push('Date de début');
  if (form.joursFormation.length === 0 || !form.horairesFormation) {
    missingFields.push('Rythme de formation (au moins un créneau)');
  }

  const canSave = missingFields.length === 0;

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
          <label className="block text-xs text-slate-500 mb-1">
            Agence <span className="text-red-500">*</span>
          </label>
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
            Nombre d&apos;heures prévues <span className="text-red-500">*</span>
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
          <label className="block text-xs text-slate-500 mb-1">
            Date de début <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={form.dateDebutFormation}
            onChange={(e) => setForm({ ...form, dateDebutFormation: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </div>
      </div>

      {/* Rythme de formation (créneaux définis dans Paramètres) */}
      <div className="mt-4">
        <label className="block text-xs text-slate-500 mb-1">
          Rythme de formation <span className="text-red-500">*</span>
          <span className="text-slate-400 font-normal"> — créneaux disponibles pour {form.agence}</span>
        </label>
        {availableCreneaux.length === 0 ? (
          <p className="text-xs text-slate-400 italic px-2 py-2 bg-slate-50 rounded-lg">
            Aucun créneau actif pour cette agence.{' '}
            <Link href="/admin/suivi-formation/parametres" className="text-blue-600 underline">
              Configurer les créneaux
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {availableCreneaux.map((c) => {
              const selected = selectedCreneauIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCreneau(c)}
                  className={`text-left p-2.5 rounded-lg border transition-colors ${
                    selected
                      ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className={`text-sm font-medium ${selected ? 'text-blue-800' : 'text-slate-700'}`}>
                    {c.label}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                    <span className="capitalize">{c.jour}</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {c.heure_debut}–{c.heure_fin} ({c.duree_heures}h)
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Users className="h-2.5 w-2.5" />
                      {c.places_max} pl.
                    </span>
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5" />
                      {c.agence}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>


      {!canSave && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <p className="font-semibold mb-1">
            Champs obligatoires à compléter avant d&apos;enregistrer :
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            {missingFields.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          disabled={saving || !canSave}
          onClick={handleSubmit}
          title={!canSave ? 'Complétez tous les champs obligatoires' : undefined}
          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
