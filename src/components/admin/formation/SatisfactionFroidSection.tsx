'use client';

import { useState } from 'react';
import { CheckCircle2, Mail, Star } from 'lucide-react';
import type { SatisfactionFroid } from '@/types/admin';

interface Props {
  stagiaireId: number;
  existing: SatisfactionFroid | null;
  onSaved: () => void;
}

export default function SatisfactionFroidSection({ stagiaireId, existing, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    q1Utilite: existing?.q1Utilite ?? 5,
    q2ReussiteExamen: existing?.q2ReussiteExamen ?? 'Pas encore',
    q3Recommandation: existing?.q3Recommandation ?? 5,
    commentaire: existing?.commentaire ?? '',
  });

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/stagiaires-formation/${stagiaireId}/satisfaction-froid`, {
        method: 'POST',
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

  if (existing) {
    return (
      <div className="bg-green-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h3 className="text-sm font-semibold text-green-800">
            Questionnaire à froid rempli
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-500">Utilité de la formation</p>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`h-4 w-4 ${
                    n <= existing.q1Utilite
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500">Réussite examen</p>
            <p className="font-medium mt-1">{existing.q2ReussiteExamen}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Recommandation</p>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`h-4 w-4 ${
                    n <= existing.q3Recommandation
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        {existing.commentaire && (
          <p className="mt-3 text-sm text-slate-600 italic">
            &laquo; {existing.commentaire} &raquo;
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Mail className="h-5 w-5 text-blue-600" />
        <h3 className="text-sm font-semibold text-slate-900">
          Questionnaire de satisfaction à froid (J+30)
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-700 mb-2">
            La formation a-t-elle été utile dans votre démarche ?
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setForm({ ...form, q1Utilite: n })}
                className={`w-10 h-10 rounded-full text-sm font-medium border transition-colors ${
                  form.q1Utilite === n
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-2">
            Avez-vous réussi votre examen ?
          </label>
          <div className="flex gap-2">
            {['Oui', 'Non', 'Pas encore'].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setForm({ ...form, q2ReussiteExamen: v as 'Oui' | 'Non' | 'Pas encore' })}
                className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                  form.q2ReussiteExamen === v
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-2">
            Recommanderiez-vous MYSTORY ?
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setForm({ ...form, q3Recommandation: n })}
                className={`w-10 h-10 rounded-full text-sm font-medium border transition-colors ${
                  form.q3Recommandation === n
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">Commentaire</label>
          <textarea
            value={form.commentaire}
            onChange={(e) => setForm({ ...form, commentaire: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            rows={3}
          />
        </div>

        <div className="flex justify-end">
          <button
            disabled={saving}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
