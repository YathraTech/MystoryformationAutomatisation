'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';

const SOURCES = ['Appel', 'WhatsApp', 'CPF', 'Site', 'Bouche-à-oreille', 'Réseau social', 'Partenaire'];
const PRESTATIONS = ['Formation TEF IRN', 'Examen TEF IRN', 'Examen civique', 'Pack TEF+Civique', 'Pack complet'];

export default function NouveauStagiairePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    civilite: 'M.',
    nom: '',
    nomJeuneFille: '',
    prenom: '',
    dateNaissance: '',
    nationalite: '',
    telephone: '',
    email: '',
    adressePostale: '',
    numeroPieceIdentite: '',
    typePiece: 'Passeport',
    agence: 'Gagny',
    sourceProvenance: '',
    typePrestation: 'Formation TEF IRN',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/admin/stagiaires-formation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erreur lors de la création');
        return;
      }

      const data = await res.json();
      router.push(`/admin/suivi-formation/${data.id}`);
    } catch {
      setError('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/suivi-formation')}
          className="p-2 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Nouveau stagiaire</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        {/* Civilité & Identité */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Informations personnelles</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Civilité *</label>
              <select
                value={form.civilite}
                onChange={(e) => setForm({ ...form, civilite: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              >
                <option value="M.">M.</option>
                <option value="Mme">Mme</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Nom d'usage *</label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Nom de jeune fille</label>
              <input
                type="text"
                value={form.nomJeuneFille}
                onChange={(e) => setForm({ ...form, nomJeuneFille: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Prénom *</label>
              <input
                type="text"
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Date de naissance *</label>
              <input
                type="date"
                value={form.dateNaissance}
                onChange={(e) => setForm({ ...form, dateNaissance: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Nationalité *</label>
              <input
                type="text"
                value={form.nationalite}
                onChange={(e) => setForm({ ...form, nationalite: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Téléphone *</label>
              <input
                type="tel"
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Adresse postale *</label>
              <input
                type="text"
                value={form.adressePostale}
                onChange={(e) => setForm({ ...form, adressePostale: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>
          </div>
        </div>

        {/* Pièce d'identité */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Pièce d'identité</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Type de pièce *</label>
              <select
                value={form.typePiece}
                onChange={(e) => setForm({ ...form, typePiece: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              >
                <option value="Passeport">Passeport</option>
                <option value="CNI">CNI</option>
                <option value="Titre de séjour">Titre de séjour</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">N° pièce d'identité *</label>
              <input
                type="text"
                value={form.numeroPieceIdentite}
                onChange={(e) => setForm({ ...form, numeroPieceIdentite: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>
          </div>
        </div>

        {/* Agence & Prestation */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Formation</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Agence *</label>
              <select
                value={form.agence}
                onChange={(e) => setForm({ ...form, agence: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              >
                <option value="Gagny">Gagny</option>
                <option value="Sarcelles">Sarcelles</option>
                <option value="Rosny">Rosny</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Type de prestation *</label>
              <select
                value={form.typePrestation}
                onChange={(e) => setForm({ ...form, typePrestation: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              >
                {PRESTATIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Source / provenance</label>
              <select
                value={form.sourceProvenance}
                onChange={(e) => setForm({ ...form, sourceProvenance: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                <option value="">Non renseigné</option>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => router.push('/admin/suivi-formation')}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Création...' : 'Créer le stagiaire'}
          </button>
        </div>
      </form>
    </div>
  );
}
