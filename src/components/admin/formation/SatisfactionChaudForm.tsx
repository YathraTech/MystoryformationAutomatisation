'use client';

import { useState } from 'react';
import { Star, Plus, CheckCircle2 } from 'lucide-react';
import type { SatisfactionChaud } from '@/types/admin';

interface Props {
  stagiaireId: number;
  existing: SatisfactionChaud[];
  onSaved: () => void;
}

const QUESTIONS = [
  { key: 'q1ContenuClair', label: 'Le contenu était-il clair et compréhensible ?' },
  { key: 'q2FormateurExplique', label: 'Le formateur a-t-il bien expliqué les exercices et corrections ?' },
  { key: 'q3Progression', label: 'Vous sentez-vous en progression ?' },
  { key: 'q4Accueil', label: "L'accueil et les conditions étaient-ils satisfaisants ?" },
  { key: 'q5Recommandation', label: 'Recommanderiez-vous MYSTORY ?' },
];

export default function SatisfactionChaudForm({ stagiaireId, existing, onSaved }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, number | string>>({
    q1ContenuClair: 5,
    q2FormateurExplique: 5,
    q3Progression: 5,
    q4Accueil: 5,
    q5Recommandation: 5,
    commentaire: '',
  });

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/stagiaires-formation/${stagiaireId}/satisfaction-chaud`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setShowForm(false);
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const moyenneGlobale =
    existing.length > 0
      ? (
          existing.reduce(
            (sum, s) =>
              sum +
              (s.q1ContenuClair + s.q2FormateurExplique + s.q3Progression + s.q4Accueil + s.q5Recommandation) / 5,
            0
          ) / existing.length
        ).toFixed(1)
      : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Questionnaires de satisfaction
          {moyenneGlobale && (
            <span className="ml-2 text-amber-600 font-normal">
              <Star className="h-3 w-3 inline fill-amber-400 text-amber-400" /> {moyenneGlobale}/5
            </span>
          )}
        </h3>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
        >
          <Plus className="h-3 w-3" />
          Nouveau questionnaire
        </button>
      </div>

      {/* Historique */}
      {existing.length > 0 && (
        <div className="space-y-1 mb-4 max-h-40 overflow-y-auto">
          {existing.map((s) => {
            const moy =
              (s.q1ContenuClair + s.q2FormateurExplique + s.q3Progression + s.q4Accueil + s.q5Recommandation) / 5;
            return (
              <div key={s.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-sm">
                <span className="text-slate-600">
                  {new Date(s.dateReponse).toLocaleDateString('fr-FR')}
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-3 w-3 ${
                        n <= Math.round(moy) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-xs text-slate-500">{moy.toFixed(1)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Formulaire nouveau questionnaire */}
      {showForm && (
        <div className="bg-blue-50 rounded-lg p-4 space-y-3">
          {QUESTIONS.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs text-slate-700 mb-1">{label}</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm({ ...form, [key]: n })}
                    className={`w-8 h-8 rounded-full text-sm font-medium border transition-colors ${
                      form[key] === n
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div>
            <label className="block text-xs text-slate-700 mb-1">Commentaire libre</label>
            <textarea
              value={form.commentaire as string}
              onChange={(e) => setForm({ ...form, commentaire: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800"
            >
              Annuler
            </button>
            <button
              disabled={saving}
              onClick={handleSubmit}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3 w-3" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
