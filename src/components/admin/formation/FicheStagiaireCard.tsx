'use client';

import { useState } from 'react';
import { Pencil, Save, X, Loader2 } from 'lucide-react';
import type { StagiaireFormation } from '@/types/admin';

interface Props {
  stagiaireId: number;
  stagiaire: StagiaireFormation;
  onSaved: () => void;
}

const TYPES_PIECE = ['Passeport', 'CNI', 'Titre de séjour'] as const;
const AGENCES = ['Gagny', 'Sarcelles', 'Rosny'] as const;
const SOURCES = [
  'Appel', 'WhatsApp', 'CPF', 'Site', 'Bouche-à-oreille', 'Réseau social', 'Partenaire',
] as const;
const PRESTATIONS = [
  'Formation TEF IRN', 'Examen TEF IRN', 'Examen civique', 'Pack TEF+Civique', 'Pack complet',
] as const;

function formatDateDisplay(date: string | null): string {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function toDateInputValue(date: string | null): string {
  if (!date) return '';
  // Accepte 'YYYY-MM-DD' ou ISO complet
  const iso = date.includes('T') ? date.split('T')[0] : date;
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : '';
}

export default function FicheStagiaireCard({ stagiaireId, stagiaire, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FicheForm>(() => makeForm(stagiaire));

  const startEdit = () => {
    setForm(makeForm(stagiaire));
    setError('');
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setError('');
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        civilite: form.civilite,
        nom: form.nom.trim().toUpperCase(),
        nomJeuneFille: form.nomJeuneFille.trim() || null,
        prenom: form.prenom.trim(),
        dateNaissance: form.dateNaissance || null,
        nationalite: form.nationalite.trim() || null,
        telephone: form.telephone.trim(),
        email: form.email.trim().toLowerCase(),
        adressePostale: form.adressePostale.trim(),
        numeroPieceIdentite: form.numeroPieceIdentite.trim() || null,
        typePiece: form.typePiece || null,
        agence: form.agence || null,
        sourceProvenance: form.sourceProvenance || null,
        typePrestation: form.typePrestation,
      };

      const res = await fetch(`/api/admin/stagiaires-formation/${stagiaireId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur' }));
        setError(err.error || 'Erreur lors de la sauvegarde');
        return;
      }

      setEditing(false);
      onSaved();
    } catch {
      setError('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Fiche stagiaire</h2>
        {!editing ? (
          <button
            onClick={startEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Modifier
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={cancel}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              Annuler
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Enregistrer
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {!editing ? (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <InfoRow label="Civilité" value={stagiaire.civilite || '-'} />
          <InfoRow label="Nom" value={stagiaire.nom || '-'} />
          <InfoRow label="Prénom" value={stagiaire.prenom || '-'} />
          <InfoRow label="Nom de jeune fille" value={stagiaire.nomJeuneFille || '-'} />
          <InfoRow label="Date de naissance" value={formatDateDisplay(stagiaire.dateNaissance)} />
          <InfoRow label="Nationalité" value={stagiaire.nationalite || '-'} />
          <InfoRow label="Téléphone" value={stagiaire.telephone || '-'} />
          <InfoRow label="Email" value={stagiaire.email || '-'} />
          <InfoRow label="Adresse" value={stagiaire.adressePostale || '-'} />
          <InfoRow
            label="Pièce d'identité"
            value={
              stagiaire.typePiece || stagiaire.numeroPieceIdentite
                ? `${stagiaire.typePiece || '-'} - ${stagiaire.numeroPieceIdentite || '-'}`
                : '-'
            }
          />
          <InfoRow label="Agence" value={stagiaire.agence || '-'} />
          <InfoRow label="Source" value={stagiaire.sourceProvenance || '-'} />
          <InfoRow label="Prestation" value={stagiaire.typePrestation || '-'} />
          <InfoRow label="Commerciale" value={stagiaire.commercialeNom || '-'} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Civilité">
            <select
              value={form.civilite}
              onChange={(e) => setForm({ ...form, civilite: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            >
              <option value="">-</option>
              <option value="M.">M.</option>
              <option value="Mme">Mme</option>
              <option value="Autre">Autre</option>
            </select>
          </Field>

          <Field label="Nom">
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 uppercase"
            />
          </Field>

          <Field label="Prénom">
            <input
              type="text"
              value={form.prenom}
              onChange={(e) => setForm({ ...form, prenom: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </Field>

          <Field label="Nom de jeune fille">
            <input
              type="text"
              value={form.nomJeuneFille}
              onChange={(e) => setForm({ ...form, nomJeuneFille: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </Field>

          <Field label="Date de naissance">
            <input
              type="date"
              value={form.dateNaissance}
              onChange={(e) => setForm({ ...form, dateNaissance: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </Field>

          <Field label="Nationalité">
            <input
              type="text"
              value={form.nationalite}
              onChange={(e) => setForm({ ...form, nationalite: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </Field>

          <Field label="Téléphone">
            <input
              type="tel"
              value={form.telephone}
              onChange={(e) => setForm({ ...form, telephone: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </Field>

          <Field label="Adresse postale" wide>
            <input
              type="text"
              value={form.adressePostale}
              onChange={(e) => setForm({ ...form, adressePostale: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </Field>

          <Field label="Type de pièce">
            <select
              value={form.typePiece}
              onChange={(e) => setForm({ ...form, typePiece: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            >
              <option value="">-</option>
              {TYPES_PIECE.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>

          <Field label="N° pièce d'identité">
            <input
              type="text"
              value={form.numeroPieceIdentite}
              onChange={(e) => setForm({ ...form, numeroPieceIdentite: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </Field>

          <Field label="Agence">
            <select
              value={form.agence}
              onChange={(e) => setForm({ ...form, agence: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            >
              <option value="">-</option>
              {AGENCES.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </Field>

          <Field label="Source / provenance">
            <select
              value={form.sourceProvenance}
              onChange={(e) => setForm({ ...form, sourceProvenance: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            >
              <option value="">-</option>
              {SOURCES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>

          <Field label="Type de prestation">
            <select
              value={form.typePrestation}
              onChange={(e) => setForm({ ...form, typePrestation: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            >
              {PRESTATIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </Field>
        </div>
      )}
    </div>
  );
}

interface FicheForm {
  civilite: string;
  nom: string;
  nomJeuneFille: string;
  prenom: string;
  dateNaissance: string;
  nationalite: string;
  telephone: string;
  email: string;
  adressePostale: string;
  numeroPieceIdentite: string;
  typePiece: string;
  agence: string;
  sourceProvenance: string;
  typePrestation: string;
}

function makeForm(s: StagiaireFormation): FicheForm {
  return {
    civilite: s.civilite || '',
    nom: s.nom || '',
    nomJeuneFille: s.nomJeuneFille || '',
    prenom: s.prenom || '',
    dateNaissance: toDateInputValue(s.dateNaissance),
    nationalite: s.nationalite || '',
    telephone: s.telephone || '',
    email: s.email || '',
    adressePostale: s.adressePostale || '',
    numeroPieceIdentite: s.numeroPieceIdentite || '',
    typePiece: s.typePiece || '',
    agence: s.agence || '',
    sourceProvenance: s.sourceProvenance || '',
    typePrestation: s.typePrestation || 'Formation TEF IRN',
  };
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-900">{value}</p>
    </div>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
