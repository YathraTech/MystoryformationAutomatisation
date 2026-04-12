'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Clock,
  ChevronDown,
  ChevronRight,
  MapPin,
  Users,
  DoorOpen,
  BookOpen,
  Euro,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

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

interface FormationType {
  id: number;
  code: string;
  label: string;
  description: string | null;
  niveau_cible: string | null;
  duree_heures_min: number | null;
  duree_heures_max: number | null;
  prix_horaire: number | null;
  prix_forfait: number | null;
  eligible_cpf: boolean;
  visible: boolean;
  ordre: number;
}

interface Salle {
  id: number;
  nom: string;
  agence: string;
  capacite: number;
  equipements: string[];
  actif: boolean;
}

const JOURS = [
  { value: 'lundi', label: 'Lundi' },
  { value: 'mardi', label: 'Mardi' },
  { value: 'mercredi', label: 'Mercredi' },
  { value: 'jeudi', label: 'Jeudi' },
  { value: 'vendredi', label: 'Vendredi' },
  { value: 'samedi', label: 'Samedi' },
];

const AGENCES = ['Gagny', 'Sarcelles', 'Rosny'];

const EQUIPEMENTS = [
  'Vidéoprojecteur',
  'Ordinateurs',
  'Tableau blanc',
  'Système audio',
  'WiFi',
  'Climatisation',
];

export default function ParametresFormationPage() {
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [types, setTypes] = useState<FormationType[]>([]);
  const [salles, setSalles] = useState<Salle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sections collapsibles
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };
  const isSectionCollapsed = (id: string) => collapsedSections.has(id);

  // Créneau form
  const [showCreneauForm, setShowCreneauForm] = useState(false);
  const [editingCreneau, setEditingCreneau] = useState<Creneau | null>(null);
  const [creneauForm, setCreneauForm] = useState({
    label: '', jour: 'lundi', heureDebut: '09:30', heureFin: '12:30',
    dureeHeures: 3, agence: 'Gagny', placesMax: 15, actif: true, ordre: 0,
  });

  // Type form
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editingType, setEditingType] = useState<FormationType | null>(null);
  const [typeForm, setTypeForm] = useState({
    code: '', label: '', description: '', niveauCible: '',
    dureeHeuresMin: 0, dureeHeuresMax: 0, prixHoraire: 0, prixForfait: 0,
    eligibleCpf: true, visible: true, ordre: 0,
  });

  // Salle form
  const [showSalleForm, setShowSalleForm] = useState(false);
  const [editingSalle, setEditingSalle] = useState<Salle | null>(null);
  const [salleForm, setSalleForm] = useState({
    nom: '', agence: 'Gagny', capacite: 15, equipements: [] as string[], actif: true,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, tRes, sRes] = await Promise.all([
        fetch('/api/admin/formation-creneaux'),
        fetch('/api/admin/formation-types'),
        fetch('/api/admin/formation-salles'),
      ]);
      if (cRes.ok) { const d = await cRes.json(); setCreneaux(d.creneaux || []); }
      if (tRes.ok) { const d = await tRes.json(); setTypes(d.types || []); }
      if (sRes.ok) { const d = await sRes.json(); setSalles(d.salles || []); }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // === CRENEAUX CRUD ===
  const saveCreneau = async () => {
    try {
      const method = editingCreneau ? 'PATCH' : 'POST';
      const body = editingCreneau ? { id: editingCreneau.id, ...creneauForm } : creneauForm;
      const res = await fetch('/api/admin/formation-creneaux', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (res.ok) { resetCreneauForm(); fetchData(); }
    } catch { setError('Erreur lors de la sauvegarde'); }
  };
  const deleteCreneau = async (id: number) => {
    if (!confirm('Supprimer ce créneau ?')) return;
    await fetch(`/api/admin/formation-creneaux?id=${id}`, { method: 'DELETE' });
    fetchData();
  };
  const editCreneau = (c: Creneau) => {
    setEditingCreneau(c);
    setCreneauForm({
      label: c.label, jour: c.jour, heureDebut: c.heure_debut, heureFin: c.heure_fin,
      dureeHeures: c.duree_heures, agence: c.agence, placesMax: c.places_max, actif: c.actif, ordre: c.ordre,
    });
    setShowCreneauForm(true);
  };
  const resetCreneauForm = () => {
    setShowCreneauForm(false); setEditingCreneau(null);
    setCreneauForm({ label: '', jour: 'lundi', heureDebut: '09:30', heureFin: '12:30', dureeHeures: 3, agence: 'Gagny', placesMax: 15, actif: true, ordre: 0 });
  };

  // === TYPES CRUD ===
  const saveType = async () => {
    try {
      const method = editingType ? 'PATCH' : 'POST';
      const body = editingType ? { id: editingType.id, ...typeForm } : typeForm;
      const res = await fetch('/api/admin/formation-types', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (res.ok) { resetTypeForm(); fetchData(); }
    } catch { setError('Erreur lors de la sauvegarde'); }
  };
  const deleteType = async (id: number) => {
    if (!confirm('Supprimer ce type ?')) return;
    await fetch(`/api/admin/formation-types?id=${id}`, { method: 'DELETE' });
    fetchData();
  };
  const editType = (t: FormationType) => {
    setEditingType(t);
    setTypeForm({
      code: t.code, label: t.label, description: t.description || '', niveauCible: t.niveau_cible || '',
      dureeHeuresMin: t.duree_heures_min || 0, dureeHeuresMax: t.duree_heures_max || 0,
      prixHoraire: t.prix_horaire || 0, prixForfait: t.prix_forfait || 0,
      eligibleCpf: t.eligible_cpf, visible: t.visible, ordre: t.ordre,
    });
    setShowTypeForm(true);
  };
  const resetTypeForm = () => {
    setShowTypeForm(false); setEditingType(null);
    setTypeForm({ code: '', label: '', description: '', niveauCible: '', dureeHeuresMin: 0, dureeHeuresMax: 0, prixHoraire: 0, prixForfait: 0, eligibleCpf: true, visible: true, ordre: 0 });
  };

  // === SALLES CRUD ===
  const saveSalle = async () => {
    try {
      const method = editingSalle ? 'PATCH' : 'POST';
      const body = editingSalle ? { id: editingSalle.id, ...salleForm } : salleForm;
      const res = await fetch('/api/admin/formation-salles', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (res.ok) { resetSalleForm(); fetchData(); }
    } catch { setError('Erreur lors de la sauvegarde'); }
  };
  const deleteSalle = async (id: number) => {
    if (!confirm('Supprimer cette salle ?')) return;
    await fetch(`/api/admin/formation-salles?id=${id}`, { method: 'DELETE' });
    fetchData();
  };
  const editSalle = (s: Salle) => {
    setEditingSalle(s);
    setSalleForm({ nom: s.nom, agence: s.agence, capacite: s.capacite, equipements: s.equipements || [], actif: s.actif });
    setShowSalleForm(true);
  };
  const resetSalleForm = () => {
    setShowSalleForm(false); setEditingSalle(null);
    setSalleForm({ nom: '', agence: 'Gagny', capacite: 15, equipements: [], actif: true });
  };

  const toggleEquipement = (eq: string) => {
    setSalleForm((f) => ({
      ...f,
      equipements: f.equipements.includes(eq) ? f.equipements.filter((e) => e !== eq) : [...f.equipements, eq],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-3 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Paramètres de formation</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configurez les créneaux, types de formation et salles disponibles
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ==================== SECTION 1: CRÉNEAUX ==================== */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div
          className="px-5 py-4 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => toggleSection('creneaux')}
        >
          <div className="flex items-center gap-2">
            {isSectionCollapsed('creneaux') ? (
              <ChevronRight className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
            <Clock className="h-5 w-5 text-slate-500" />
            <h2 className="font-semibold text-slate-800">Créneaux de formation</h2>
            <span className="text-xs text-slate-400">({creneaux.length})</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); resetCreneauForm(); setShowCreneauForm(true); }}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>

        {!isSectionCollapsed('creneaux') && (
          <>
            {/* Formulaire nouveau créneau */}
            {showCreneauForm && (
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Label</label>
                    <input type="text" placeholder="Ex: Lundi matin" value={creneauForm.label}
                      onChange={(e) => setCreneauForm({ ...creneauForm, label: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Jour</label>
                    <select value={creneauForm.jour} onChange={(e) => setCreneauForm({ ...creneauForm, jour: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      {JOURS.map((j) => <option key={j.value} value={j.value}>{j.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Heure début</label>
                    <input type="time" value={creneauForm.heureDebut}
                      onChange={(e) => setCreneauForm({ ...creneauForm, heureDebut: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Heure fin</label>
                    <input type="time" value={creneauForm.heureFin}
                      onChange={(e) => setCreneauForm({ ...creneauForm, heureFin: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Agence</label>
                    <select value={creneauForm.agence} onChange={(e) => setCreneauForm({ ...creneauForm, agence: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      {AGENCES.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Places max</label>
                    <input type="number" min={1} value={creneauForm.placesMax}
                      onChange={(e) => setCreneauForm({ ...creneauForm, placesMax: parseInt(e.target.value) || 15 })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Durée (h)</label>
                    <input type="number" min={0.5} step={0.5} value={creneauForm.dureeHeures}
                      onChange={(e) => setCreneauForm({ ...creneauForm, dureeHeures: parseFloat(e.target.value) || 3 })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={creneauForm.actif}
                        onChange={(e) => setCreneauForm({ ...creneauForm, actif: e.target.checked })}
                        className="rounded border-slate-300" />
                      <span className="text-sm text-slate-600">Actif</span>
                    </label>
                    <div className="flex-1" />
                    <button onClick={resetCreneauForm}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                    <button onClick={saveCreneau} disabled={!creneauForm.label}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Liste des créneaux */}
            <div className="divide-y divide-slate-100">
              {creneaux.length === 0 && !showCreneauForm && (
                <div className="px-5 py-8 text-center text-sm text-slate-400">
                  Aucun créneau configuré
                </div>
              )}
              {creneaux.map((c) => (
                <div key={c.id} className={`px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors ${!c.actif ? 'opacity-50' : ''}`}>
                  {editingCreneau?.id === c.id && showCreneauForm ? null : (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-slate-800">{c.label}</span>
                        <span className="text-xs text-slate-400 capitalize">{c.jour}</span>
                        <span className="text-xs text-slate-500">{c.heure_debut} - {c.heure_fin}</span>
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">{c.duree_heures}h</span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" />{c.agence}
                        </span>
                        <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Users className="h-2.5 w-2.5" />{c.places_max} places
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => editCreneau(c)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                          <Pencil className="h-4 w-4 text-slate-400" />
                        </button>
                        <button onClick={() => deleteCreneau(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ==================== SECTION 2: TYPES DE FORMATION ==================== */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div
          className="px-5 py-4 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => toggleSection('types')}
        >
          <div className="flex items-center gap-2">
            {isSectionCollapsed('types') ? (
              <ChevronRight className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
            <BookOpen className="h-5 w-5 text-slate-500" />
            <h2 className="font-semibold text-slate-800">Types de formation</h2>
            <span className="text-xs text-slate-400">({types.length})</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); resetTypeForm(); setShowTypeForm(true); }}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>

        {!isSectionCollapsed('types') && (
          <>
            {showTypeForm && (
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Code *</label>
                    <input type="text" placeholder="TEF_IRN_A2" value={typeForm.code}
                      onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Label *</label>
                    <input type="text" placeholder="Formation TEF IRN - A2" value={typeForm.label}
                      onChange={(e) => setTypeForm({ ...typeForm, label: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Niveau cible</label>
                    <select value={typeForm.niveauCible} onChange={(e) => setTypeForm({ ...typeForm, niveauCible: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <option value="">-</option>
                      {['A1', 'A2', 'B1', 'B2'].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Durée min (h)</label>
                    <input type="number" min={0} value={typeForm.dureeHeuresMin}
                      onChange={(e) => setTypeForm({ ...typeForm, dureeHeuresMin: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Durée max (h)</label>
                    <input type="number" min={0} value={typeForm.dureeHeuresMax}
                      onChange={(e) => setTypeForm({ ...typeForm, dureeHeuresMax: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Prix / heure</label>
                    <input type="number" min={0} step={0.5} value={typeForm.prixHoraire}
                      onChange={(e) => setTypeForm({ ...typeForm, prixHoraire: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Prix forfait</label>
                    <input type="number" min={0} step={1} value={typeForm.prixForfait}
                      onChange={(e) => setTypeForm({ ...typeForm, prixForfait: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                      <input type="checkbox" checked={typeForm.eligibleCpf}
                        onChange={(e) => setTypeForm({ ...typeForm, eligibleCpf: e.target.checked })}
                        className="rounded border-slate-300" /> Éligible CPF
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                      <input type="checkbox" checked={typeForm.visible}
                        onChange={(e) => setTypeForm({ ...typeForm, visible: e.target.checked })}
                        className="rounded border-slate-300" /> Visible
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={resetTypeForm}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                    <button onClick={saveType} disabled={!typeForm.code || !typeForm.label}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="divide-y divide-slate-100">
              {types.length === 0 && !showTypeForm && (
                <div className="px-5 py-8 text-center text-sm text-slate-400">
                  Aucun type de formation configuré
                </div>
              )}
              {types.map((t) => (
                <div key={t.id} className={`px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors ${!t.visible ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-800">{t.label}</span>
                    <span className="text-xs font-mono text-slate-400">{t.code}</span>
                    {t.niveau_cible && (
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">{t.niveau_cible}</span>
                    )}
                    {(t.duree_heures_min || t.duree_heures_max) && (
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                        {t.duree_heures_min || '?'}-{t.duree_heures_max || '?'}h
                      </span>
                    )}
                    {t.prix_forfait ? (
                      <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Euro className="h-2.5 w-2.5" />{t.prix_forfait}
                      </span>
                    ) : t.prix_horaire ? (
                      <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">{t.prix_horaire}€/h</span>
                    ) : null}
                    {t.eligible_cpf && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">CPF</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => editType(t)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                      <Pencil className="h-4 w-4 text-slate-400" />
                    </button>
                    <button onClick={() => deleteType(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ==================== SECTION 3: SALLES ==================== */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div
          className="px-5 py-4 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => toggleSection('salles')}
        >
          <div className="flex items-center gap-2">
            {isSectionCollapsed('salles') ? (
              <ChevronRight className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
            <DoorOpen className="h-5 w-5 text-slate-500" />
            <h2 className="font-semibold text-slate-800">Salles de formation</h2>
            <span className="text-xs text-slate-400">({salles.length})</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); resetSalleForm(); setShowSalleForm(true); }}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>

        {!isSectionCollapsed('salles') && (
          <>
            {showSalleForm && (
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nom *</label>
                    <input type="text" placeholder="Salle 1" value={salleForm.nom}
                      onChange={(e) => setSalleForm({ ...salleForm, nom: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Agence *</label>
                    <select value={salleForm.agence} onChange={(e) => setSalleForm({ ...salleForm, agence: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      {AGENCES.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Capacité</label>
                    <input type="number" min={1} value={salleForm.capacite}
                      onChange={(e) => setSalleForm({ ...salleForm, capacite: parseInt(e.target.value) || 15 })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Équipements</label>
                  <div className="flex gap-2 flex-wrap">
                    {EQUIPEMENTS.map((eq) => (
                      <button key={eq} type="button" onClick={() => toggleEquipement(eq)}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                          salleForm.equipements.includes(eq)
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'border-slate-200 text-slate-500 hover:border-blue-300'
                        }`}>
                        {eq}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3">
                  <button onClick={resetSalleForm}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                  <button onClick={saveSalle} disabled={!salleForm.nom}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="divide-y divide-slate-100">
              {salles.length === 0 && !showSalleForm && (
                <div className="px-5 py-8 text-center text-sm text-slate-400">
                  Aucune salle configurée
                </div>
              )}
              {salles.map((s) => (
                <div key={s.id} className={`px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors ${!s.actif ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <DoorOpen className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-800">{s.nom}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5" />{s.agence}
                    </span>
                    <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Users className="h-2.5 w-2.5" />{s.capacite} places
                    </span>
                    {s.equipements?.map((eq) => (
                      <span key={eq} className="text-[10px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded">{eq}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => editSalle(s)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                      <Pencil className="h-4 w-4 text-slate-400" />
                    </button>
                    <button onClick={() => deleteSalle(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
