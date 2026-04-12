'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Volume2,
  FileText,
  Eye,
  EyeOff,
} from 'lucide-react';

interface QcmQuestion {
  id: number;
  type_competence: 'CE' | 'CO';
  niveau: string;
  question: string;
  choix: string[];
  reponse_correcte: string;
  media_url: string | null;
  points: number;
  actif: boolean;
  ordre: number;
}

const NIVEAUX = ['A0', 'A1', 'A2', 'B1', 'B2'];
const LETTRES = ['A', 'B', 'C', 'D'];

const emptyForm = {
  typeCompetence: 'CE' as 'CE' | 'CO',
  niveau: 'A1',
  question: '',
  choix: ['', '', '', ''],
  reponseCorrecte: 'A',
  mediaUrl: '',
  points: 1,
  actif: true,
  ordre: 0,
};

export default function QcmAdminPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QcmQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'CE' | 'CO' | 'all'>('all');
  const [filterNiveau, setFilterNiveau] = useState<string>('all');

  // Formulaire
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const fetchQuestions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.set('type', filterType);
      if (filterNiveau !== 'all') params.set('niveau', filterNiveau);

      const res = await fetch(`/api/admin/qcm-questions?${params}`);
      const data = await res.json();
      setQuestions(Array.isArray(data) ? data : []);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterNiveau]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const openNew = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      ordre: questions.length + 1,
    });
    setShowForm(true);
  };

  const openEdit = (q: QcmQuestion) => {
    setEditingId(q.id);
    setForm({
      typeCompetence: q.type_competence,
      niveau: q.niveau,
      question: q.question,
      choix: [...q.choix, ...Array(4 - q.choix.length).fill('')].slice(0, 4),
      reponseCorrecte: q.reponse_correcte,
      mediaUrl: q.media_url || '',
      points: q.points,
      actif: q.actif,
      ordre: q.ordre,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.question.trim()) return;
    // Vérifier qu'au moins 2 choix sont remplis
    const filledChoix = form.choix.filter((c) => c.trim());
    if (filledChoix.length < 2) return;

    setSaving(true);
    try {
      if (editingId) {
        await fetch('/api/admin/qcm-questions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...form }),
        });
      } else {
        await fetch('/api/admin/qcm-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      setShowForm(false);
      fetchQuestions();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette question ?')) return;
    try {
      await fetch(`/api/admin/qcm-questions?id=${id}`, { method: 'DELETE' });
      fetchQuestions();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActif = async (q: QcmQuestion) => {
    try {
      await fetch('/api/admin/qcm-questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: q.id, actif: !q.actif }),
      });
      fetchQuestions();
    } catch (err) {
      console.error(err);
    }
  };

  const updateChoix = (index: number, value: string) => {
    const newChoix = [...form.choix];
    newChoix[index] = value;
    setForm({ ...form, choix: newChoix });
  };

  const ceCount = questions.filter((q) => q.type_competence === 'CE').length;
  const coCount = questions.filter((q) => q.type_competence === 'CO').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/suivi-formation')}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Banque de questions QCM</h1>
            <p className="text-sm text-slate-500 mt-1">
              {ceCount} questions CE - {coCount} questions CO
            </p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nouvelle question
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'CE' | 'CO' | 'all')}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5"
        >
          <option value="all">Toutes les compétences</option>
          <option value="CE">Compréhension Écrite (CE)</option>
          <option value="CO">Compréhension Orale (CO)</option>
        </select>
        <select
          value={filterNiveau}
          onChange={(e) => setFilterNiveau(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5"
        >
          <option value="all">Tous les niveaux</option>
          {NIVEAUX.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {/* Formulaire ajout/édition */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              {editingId ? 'Modifier la question' : 'Nouvelle question'}
            </h2>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded">
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Compétence *</label>
              <select
                value={form.typeCompetence}
                onChange={(e) => setForm({ ...form, typeCompetence: e.target.value as 'CE' | 'CO' })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                <option value="CE">Compréhension Écrite (CE)</option>
                <option value="CO">Compréhension Orale (CO)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Niveau *</label>
              <select
                value={form.niveau}
                onChange={(e) => setForm({ ...form, niveau: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                {NIVEAUX.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Points</label>
              <input
                type="number"
                min={0.5}
                max={5}
                step={0.5}
                value={form.points}
                onChange={(e) => setForm({ ...form, points: parseFloat(e.target.value) || 1 })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* URL audio pour CO */}
          {form.typeCompetence === 'CO' && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                URL du fichier audio (MP3)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://... ou chemin Supabase Storage"
                  value={form.mediaUrl}
                  onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
                {form.mediaUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      const audio = new Audio(form.mediaUrl);
                      audio.play().catch(() => alert('Impossible de lire l\'audio'));
                    }}
                    className="px-3 py-2 bg-slate-100 rounded-lg hover:bg-slate-200"
                  >
                    <Volume2 className="h-4 w-4 text-slate-600" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Question */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">Question *</label>
            <textarea
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              rows={2}
              placeholder={
                form.typeCompetence === 'CO'
                  ? 'Ex: Écoutez l\'enregistrement. De quoi parle la personne ?'
                  : 'Ex: Lisez le texte suivant. Quelle est l\'information principale ?'
              }
            />
          </div>

          {/* Choix de réponses */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">Choix de réponses *</label>
            <div className="space-y-2">
              {LETTRES.map((lettre, idx) => (
                <div key={lettre} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, reponseCorrecte: lettre })}
                    className={`w-8 h-8 rounded-full text-xs font-bold border-2 flex items-center justify-center transition-colors ${
                      form.reponseCorrecte === lettre
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-slate-200 text-slate-400 hover:border-green-300'
                    }`}
                    title={form.reponseCorrecte === lettre ? 'Bonne réponse' : 'Définir comme bonne réponse'}
                  >
                    {lettre}
                  </button>
                  <input
                    type="text"
                    value={form.choix[idx]}
                    onChange={(e) => updateChoix(idx, e.target.value)}
                    placeholder={`Choix ${lettre}`}
                    className={`flex-1 px-3 py-2 text-sm border rounded-lg ${
                      form.reponseCorrecte === lettre
                        ? 'border-green-300 bg-green-50'
                        : 'border-slate-200'
                    }`}
                  />
                </div>
              ))}
              <p className="text-[10px] text-slate-400 mt-1">
                Cliquez sur la lettre pour définir la bonne réponse (vert = correct)
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.actif}
                onChange={(e) => setForm({ ...form, actif: e.target.checked })}
                className="rounded border-slate-300"
              />
              Question active
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Annuler
              </button>
              <button
                disabled={saving || !form.question.trim()}
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des questions */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FileText className="h-10 w-10 mx-auto mb-2 text-slate-300" />
            <p>Aucune question pour ces filtres</p>
            <button
              onClick={openNew}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800"
            >
              Ajouter une question
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className={`px-4 py-3 hover:bg-slate-50 transition-colors ${
                  !q.actif ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-400 font-mono">#{idx + 1}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          q.type_competence === 'CE'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {q.type_competence === 'CO' && <Volume2 className="h-2.5 w-2.5" />}
                        {q.type_competence}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                        {q.niveau}
                      </span>
                      <span className="text-[10px] text-slate-400">{q.points} pt{q.points > 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-sm text-slate-800 font-medium">{q.question}</p>
                    <div className="flex gap-3 mt-1.5">
                      {q.choix.filter(Boolean).map((choix, i) => (
                        <span
                          key={i}
                          className={`text-xs px-2 py-0.5 rounded ${
                            LETTRES[i] === q.reponse_correcte
                              ? 'bg-green-100 text-green-700 font-semibold'
                              : 'bg-slate-50 text-slate-500'
                          }`}
                        >
                          {LETTRES[i]}. {choix}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleActif(q)}
                      className="p-1.5 rounded-lg hover:bg-slate-100"
                      title={q.actif ? 'Désactiver' : 'Activer'}
                    >
                      {q.actif ? (
                        <Eye className="h-4 w-4 text-green-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-slate-300" />
                      )}
                    </button>
                    <button
                      onClick={() => openEdit(q)}
                      className="p-1.5 rounded-lg hover:bg-slate-100"
                    >
                      <Pencil className="h-4 w-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
