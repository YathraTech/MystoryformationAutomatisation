'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Clock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  MapPin,
  Users,
  DoorOpen,
  BookOpen,
  Euro,
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

  // Sections collapsibles
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

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
    const method = editingCreneau ? 'PATCH' : 'POST';
    const body = editingCreneau ? { id: editingCreneau.id, ...creneauForm } : creneauForm;
    await fetch('/api/admin/formation-creneaux', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    resetCreneauForm();
    fetchData();
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
  const toggleCreneauActif = async (c: Creneau) => {
    await fetch('/api/admin/formation-creneaux', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, actif: !c.actif }),
    });
    fetchData();
  };

  // === TYPES CRUD ===
  const saveType = async () => {
    const method = editingType ? 'PATCH' : 'POST';
    const body = editingType ? { id: editingType.id, ...typeForm } : typeForm;
    await fetch('/api/admin/formation-types', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    resetTypeForm();
    fetchData();
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
    const method = editingSalle ? 'PATCH' : 'POST';
    const body = editingSalle ? { id: editingSalle.id, ...salleForm } : salleForm;
    await fetch('/api/admin/formation-salles', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    resetSalleForm();
    fetchData();
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paramètres Formation</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configurez les créneaux, types de formation et salles
        </p>
      </div>

      {/* ==================== SECTION 1: CRÉNEAUX ==================== */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => toggleSection('creneaux')}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-left">
              <h2 className="text-sm font-semibold text-slate-900">Créneaux de formation</h2>
              <p className="text-xs text-slate-500">{creneaux.length} créneau(x) configuré(s)</p>
            </div>
          </div>
          {collapsedSections.has('creneaux')
            ? <ChevronRight className="h-5 w-5 text-slate-400" />
            : <ChevronDown className="h-5 w-5 text-slate-400" />}
        </button>

        {!collapsedSections.has('creneaux') && (
          <div className="px-5 pb-5 border-t border-slate-100">
            <div className="flex justify-end mt-3 mb-3">
              <button
                onClick={() => { resetCreneauForm(); setShowCreneauForm(true); }}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-3 w-3" /> Ajouter un créneau
              </button>
            </div>

            {showCreneauForm && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">
                    {editingCreneau ? 'Modifier le créneau' : 'Nouveau créneau'}
                  </span>
                  <button onClick={resetCreneauForm}><X className="h-4 w-4 text-slate-400" /></button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Label *</label>
                    <input type="text" placeholder="Ex: Lundi matin" value={creneauForm.label}
                      onChange={(e) => setCreneauForm({ ...creneauForm, label: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Jour *</label>
                    <select value={creneauForm.jour} onChange={(e) => setCreneauForm({ ...creneauForm, jour: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg">
                      {JOURS.map((j) => <option key={j.value} value={j.value}>{j.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Heure début</label>
                    <input type="time" value={creneauForm.heureDebut}
                      onChange={(e) => setCreneauForm({ ...creneauForm, heureDebut: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Heure fin</label>
                    <input type="time" value={creneauForm.heureFin}
                      onChange={(e) => setCreneauForm({ ...creneauForm, heureFin: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Agence *</label>
                    <select value={creneauForm.agence} onChange={(e) => setCreneauForm({ ...creneauForm, agence: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg">
                      {AGENCES.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Places max</label>
                    <input type="number" min={1} value={creneauForm.placesMax}
                      onChange={(e) => setCreneauForm({ ...creneauForm, placesMax: parseInt(e.target.value) || 15 })}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Durée (h)</label>
                    <input type="number" min={0.5} step={0.5} value={creneauForm.dureeHeures}
                      onChange={(e) => setCreneauForm({ ...creneauForm, dureeHeures: parseFloat(e.target.value) || 3 })}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg" />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={creneauForm.actif}
                        onChange={(e) => setCreneauForm({ ...creneauForm, actif: e.target.checked })}
                        className="rounded border-slate-300" /> Actif
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={resetCreneauForm} className="px-3 py-1.5 text-xs text-slate-600">Annuler</button>
                  <button onClick={saveCreneau} disabled={!creneauForm.label}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    <Check className="h-3 w-3" /> {editingCreneau ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </div>
            )}

            {/* Liste des créneaux par agence */}
            {AGENCES.map((agence) => {
              const agenceCreneaux = creneaux.filter((c) => c.agence === agence);
              if (agenceCreneaux.length === 0 && !showCreneauForm) return null;
              return (
                <div key={agence} className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{agence}</span>
                    <span className="text-[10px] text-slate-400">({agenceCreneaux.length})</span>
                  </div>
                  <div className="space-y-1">
                    {agenceCreneaux.map((c) => (
                      <div key={c.id} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${c.actif ? 'bg-slate-50' : 'bg-slate-50 opacity-50'}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-slate-400 capitalize w-16">{c.jour}</span>
                          <span className="font-medium text-slate-800">{c.label}</span>
                          <span className="text-xs text-slate-500">{c.heure_debut} - {c.heure_fin}</span>
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{c.duree_heures}h</span>
                          <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Users className="h-2.5 w-2.5" />{c.places_max}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => toggleCreneauActif(c)} className="p-1 rounded hover:bg-slate-100">
                            {c.actif ? <Eye className="h-3.5 w-3.5 text-green-500" /> : <EyeOff className="h-3.5 w-3.5 text-slate-300" />}
                          </button>
                          <button onClick={() => editCreneau(c)} className="p-1 rounded hover:bg-slate-100">
                            <Pencil className="h-3.5 w-3.5 text-slate-400" />
                          </button>
                          <button onClick={() => deleteCreneau(c.id)} className="p-1 rounded hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {creneaux.length === 0 && !showCreneauForm && (
              <p className="text-sm text-slate-400 text-center py-4">Aucun créneau configuré</p>
            )}
          </div>
        )}
      </section>

      {/* ==================== SECTION 2: TYPES DE FORMATION ==================== */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => toggleSection('types')}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <BookOpen className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-left">
              <h2 className="text-sm font-semibold text-slate-900">Types de formation</h2>
              <p className="text-xs text-slate-500">{types.length} type(s) configuré(s)</p>
            </div>
          </div>
          {collapsedSections.has('types')
            ? <ChevronRight className="h-5 w-5 text-slate-400" />
            : <ChevronDown className="h-5 w-5 text-slate-400" />}
        </button>

        {!collapsedSections.has('types') && (
          <div className="px-5 pb-5 border-t border-slate-100">
            <div className="flex justify-end mt-3 mb-3">
              <button onClick={() => { resetTypeForm(); setShowTypeForm(true); }}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700">
                <Plus className="h-3 w-3" /> Ajouter un type
              </button>
            </div>

            {showTypeForm && (
              <div className="bg-purple-50 rounded-lg p-4 mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">
                    {editingType ? 'Modifier le type' : 'Nouveau type de formation'}
                  </span>
                  <button onClick={resetTypeForm}><X className="h-4 w-4 text-slate-400" /></button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Code *</label>
                    <input type="text" placeholder="TEF_IRN_A2" value={typeForm.code}
                      onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Label *</label>
                    <input type="text" placeholder="Formation TEF IRN - A2" value={typeForm.label}
                      onChange={(e) => setTypeForm({ ...typeForm, label: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Niveau cible</label>
                    <select value={typeForm.niveauCible} onChange={(e) => setTypeForm({ ...typeForm, niveauCible: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg">
                      <option value="">Aucun</option>
                      {['A1', 'A2', 'B1', 'B2'].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Durée min (h)</label>
                    <input type="number" min={0} value={typeForm.dureeHeuresMin}
                      onChange={(e) => setTypeForm({ ...typeForm, dureeHeuresMin: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Durée max (h)</label>
                    <input type="number" min={0} value={typeForm.dureeHeuresMax}
                      onChange={(e) => setTypeForm({ ...typeForm, dureeHeuresMax: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Prix/heure (EUR)</label>
                    <input type="number" min={0} step={0.5} value={typeForm.prixHoraire}
                      onChange={(e) => setTypeForm({ ...typeForm, prixHoraire: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Prix forfait (EUR)</label>
                    <input type="number" min={0} step={1} value={typeForm.prixForfait}
                      onChange={(e) => setTypeForm({ ...typeForm, prixForfait: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg" />
                  </div>
                  <div className="flex items-end gap-4">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="checkbox" checked={typeForm.eligibleCpf}
                        onChange={(e) => setTypeForm({ ...typeForm, eligibleCpf: e.target.checked })}
                        className="rounded border-slate-300" /> CPF
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="checkbox" checked={typeForm.visible}
                        onChange={(e) => setTypeForm({ ...typeForm, visible: e.target.checked })}
                        className="rounded border-slate-300" /> Visible
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Description</label>
                  <textarea value={typeForm.description}
                    onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg" rows={2} />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={resetTypeForm} className="px-3 py-1.5 text-xs text-slate-600">Annuler</button>
                  <button onClick={saveType} disabled={!typeForm.code || !typeForm.label}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 disabled:opacity-50">
                    <Check className="h-3 w-3" /> {editingType ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              {types.map((t) => (
                <div key={t.id} className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm ${t.visible ? 'bg-slate-50' : 'bg-slate-50 opacity-50'}`}>
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-xs font-mono text-slate-400">{t.code}</span>
                    <span className="font-medium text-slate-800">{t.label}</span>
                    {t.niveau_cible && (
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">{t.niveau_cible}</span>
                    )}
                    {t.duree_heures_min && t.duree_heures_max ? (
                      <span className="text-[10px] text-slate-400">{t.duree_heures_min}-{t.duree_heures_max}h</span>
                    ) : null}
                    {t.prix_forfait ? (
                      <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Euro className="h-2.5 w-2.5" />{t.prix_forfait}
                      </span>
                    ) : t.prix_horaire ? (
                      <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">{t.prix_horaire}EUR/h</span>
                    ) : null}
                    {t.eligible_cpf && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">CPF</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => editType(t)} className="p-1 rounded hover:bg-slate-100">
                      <Pencil className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                    <button onClick={() => deleteType(t.id)} className="p-1 rounded hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
              {types.length === 0 && !showTypeForm && (
                <p className="text-sm text-slate-400 text-center py-4">Aucun type de formation configuré</p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ==================== SECTION 3: SALLES ==================== */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => toggleSection('salles')}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <DoorOpen className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="text-left">
              <h2 className="text-sm font-semibold text-slate-900">Salles de formation</h2>
              <p className="text-xs text-slate-500">{salles.length} salle(s) configurée(s)</p>
            </div>
          </div>
          {collapsedSections.has('salles')
            ? <ChevronRight className="h-5 w-5 text-slate-400" />
            : <ChevronDown className="h-5 w-5 text-slate-400" />}
        </button>

        {!collapsedSections.has('salles') && (
          <div className="px-5 pb-5 border-t border-slate-100">
            <div className="flex justify-end mt-3 mb-3">
              <button onClick={() => { resetSalleForm(); setShowSalleForm(true); }}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700">
                <Plus className="h-3 w-3" /> Ajouter une salle
              </button>
            </div>

            {showSalleForm && (
              <div className="bg-emerald-50 rounded-lg p-4 mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">
                    {editingSalle ? 'Modifier la salle' : 'Nouvelle salle'}
                  </span>
                  <button onClick={resetSalleForm}><X className="h-4 w-4 text-slate-400" /></button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Nom *</label>
                    <input type="text" placeholder="Salle 1" value={salleForm.nom}
                      onChange={(e) => setSalleForm({ ...salleForm, nom: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Agence *</label>
                    <select value={salleForm.agence} onChange={(e) => setSalleForm({ ...salleForm, agence: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg">
                      {AGENCES.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Capacité</label>
                    <input type="number" min={1} value={salleForm.capacite}
                      onChange={(e) => setSalleForm({ ...salleForm, capacite: parseInt(e.target.value) || 15 })}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Équipements</label>
                  <div className="flex gap-2 flex-wrap">
                    {EQUIPEMENTS.map((eq) => (
                      <button key={eq} type="button" onClick={() => toggleEquipement(eq)}
                        className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                          salleForm.equipements.includes(eq)
                            ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                            : 'border-slate-200 text-slate-500 hover:border-emerald-300'
                        }`}>
                        {eq}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={resetSalleForm} className="px-3 py-1.5 text-xs text-slate-600">Annuler</button>
                  <button onClick={saveSalle} disabled={!salleForm.nom}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                    <Check className="h-3 w-3" /> {editingSalle ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </div>
            )}

            {AGENCES.map((agence) => {
              const agenceSalles = salles.filter((s) => s.agence === agence);
              if (agenceSalles.length === 0) return null;
              return (
                <div key={agence} className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{agence}</span>
                  </div>
                  <div className="space-y-1">
                    {agenceSalles.map((s) => (
                      <div key={s.id} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${s.actif ? 'bg-slate-50' : 'bg-slate-50 opacity-50'}`}>
                        <div className="flex items-center gap-3">
                          <DoorOpen className="h-4 w-4 text-emerald-500" />
                          <span className="font-medium text-slate-800">{s.nom}</span>
                          <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Users className="h-2.5 w-2.5" />{s.capacite}
                          </span>
                          {s.equipements?.map((eq) => (
                            <span key={eq} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{eq}</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => editSalle(s)} className="p-1 rounded hover:bg-slate-100">
                            <Pencil className="h-3.5 w-3.5 text-slate-400" />
                          </button>
                          <button onClick={() => deleteSalle(s.id)} className="p-1 rounded hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {salles.length === 0 && !showSalleForm && (
              <p className="text-sm text-slate-400 text-center py-4">Aucune salle configurée</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
