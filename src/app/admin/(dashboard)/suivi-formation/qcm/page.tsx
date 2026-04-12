'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Volume2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Upload,
  Play,
  Pause,
  FileText,
  AlertCircle,
  FileQuestion,
  Download,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';

interface QcmQuestion {
  id: number;
  type_competence: 'CE' | 'CO';
  niveau: string;
  question: string;
  choix: string[];
  reponse_correcte: string;
  choix_multiple: boolean;
  reponses_correctes: string[];
  media_url: string | null;
  points: number;
  actif: boolean;
  ordre: number;
}

const NIVEAUX = ['A0', 'A1', 'A2', 'B1', 'B2'];
const LETTRES = ['A', 'B', 'C', 'D'];

export default function QcmAdminPage() {
  const [questions, setQuestions] = useState<QcmQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<'CE' | 'CO' | 'all'>('all');
  const [filterNiveau, setFilterNiveau] = useState<string>('all');

  // Sections
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  // Formulaire
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    typeCompetence: 'CE' as 'CE' | 'CO',
    niveau: 'A1',
    question: '',
    choix: ['', '', '', ''],
    reponseCorrecte: 'A',
    choixMultiple: false,
    reponsesCorrectes: [] as string[],
    mediaUrl: '',
    points: 1,
    actif: true,
    ordre: 0,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Import CSV
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    inserted: number; skipped: number; total: number; errors: string[];
  } | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Audio preview
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const fetchQuestions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.set('type', filterType);
      if (filterNiveau !== 'all') params.set('niveau', filterNiveau);
      const res = await fetch(`/api/admin/qcm-questions?${params}`);
      const data = await res.json();
      setQuestions(Array.isArray(data) ? data : []);
    } catch { setQuestions([]); }
    finally { setLoading(false); }
  }, [filterType, filterNiveau]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({
      typeCompetence: 'CE', niveau: 'A1', question: '', choix: ['', '', '', ''],
      reponseCorrecte: 'A', choixMultiple: false, reponsesCorrectes: [],
      mediaUrl: '', points: 1, actif: true, ordre: 0,
    });
  };

  const openNew = (type: 'CE' | 'CO') => {
    resetForm();
    setForm((f) => ({ ...f, typeCompetence: type, ordre: questions.length + 1 }));
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
      choixMultiple: q.choix_multiple || false,
      reponsesCorrectes: q.reponses_correctes || [],
      mediaUrl: q.media_url || '',
      points: q.points,
      actif: q.actif,
      ordre: q.ordre,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.question.trim()) return;
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
      resetForm();
      fetchQuestions();
    } catch { setError('Erreur lors de la sauvegarde'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette question ?')) return;
    await fetch(`/api/admin/qcm-questions?id=${id}`, { method: 'DELETE' });
    fetchQuestions();
  };

  const toggleActif = async (q: QcmQuestion) => {
    await fetch('/api/admin/qcm-questions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: q.id, actif: !q.actif }),
    });
    fetchQuestions();
  };

  const handleUploadAudio = async (file: File) => {
    setUploadingAudio(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (editingId) formData.append('questionId', editingId.toString());

      const res = await fetch('/api/admin/qcm-questions/upload-audio', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erreur upload');
        return;
      }

      const data = await res.json();
      setForm((f) => ({ ...f, mediaUrl: data.url }));
      if (editingId) fetchQuestions();
    } catch { setError('Erreur upload audio'); }
    finally { setUploadingAudio(false); }
  };

  const playPreview = (url: string, id: number) => {
    if (playingAudioId === id) {
      audioPreviewRef.current?.pause();
      setPlayingAudioId(null);
      return;
    }
    if (audioPreviewRef.current) audioPreviewRef.current.pause();
    const audio = new Audio(url);
    audioPreviewRef.current = audio;
    audio.onended = () => setPlayingAudioId(null);
    audio.play().catch(() => {});
    setPlayingAudioId(id);
  };

  const updateChoix = (index: number, value: string) => {
    const newChoix = [...form.choix];
    newChoix[index] = value;
    setForm({ ...form, choix: newChoix });
  };

  const ceQuestions = questions.filter((q) => q.type_competence === 'CE');
  const coQuestions = questions.filter((q) => q.type_competence === 'CO');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-3 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configuration QCM / CO</h1>
        <p className="text-sm text-slate-500 mt-1">
          Gérez les questions de Compréhension Écrite et Orale pour le test initial et final.
          Le client passera ce test après son inscription, les scores seront calculés automatiquement.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Import CSV */}
      <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-slate-500" />
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Importer des questions (CSV / Excel)</h2>
              <p className="text-xs text-slate-400">Importez un fichier CSV avec vos questions pré-remplies</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/modele-qcm.csv" download
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <Download className="h-4 w-4" />
              Modèle CSV
            </a>
            <button
              onClick={() => csvInputRef.current?.click()}
              disabled={importing}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {importing ? 'Import...' : 'Importer CSV'}
            </button>
            <input ref={csvInputRef} type="file" accept=".csv,.txt,.xlsx" className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImporting(true);
                setImportResult(null);
                try {
                  const formData = new FormData();
                  formData.append('file', file);
                  const res = await fetch('/api/admin/qcm-questions/import', { method: 'POST', body: formData });
                  const data = await res.json();
                  if (data.success) {
                    setImportResult(data);
                    fetchQuestions();
                  } else {
                    setError(data.error || 'Erreur import');
                  }
                } catch { setError('Erreur réseau'); }
                finally { setImporting(false); e.target.value = ''; }
              }} />
          </div>
        </div>

        {/* Résultat import */}
        {importResult && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <strong>{importResult.inserted}</strong> question(s) importée(s) sur {importResult.total}
              {importResult.skipped > 0 && (
                <span className="text-amber-600">({importResult.skipped} ignorée(s))</span>
              )}
            </div>
            {importResult.errors.length > 0 && (
              <div className="mt-2 space-y-0.5">
                {importResult.errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-600">{err}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Format attendu */}
        <details className="mt-3">
          <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
            Format du fichier CSV
          </summary>
          <div className="mt-2 bg-slate-50 rounded-lg p-3 text-xs text-slate-600 space-y-1">
            <p><strong>Séparateur :</strong> point-virgule (;) ou virgule (,)</p>
            <p><strong>Colonnes obligatoires :</strong> competence, niveau, question, choix_a, choix_b, reponse</p>
            <p><strong>Colonnes optionnelles :</strong> choix_c, choix_d, choix_multiple, points, audio_url</p>
            <p><strong>competence :</strong> CE ou CO</p>
            <p><strong>niveau :</strong> A0, A1, A2, B1, B2</p>
            <p><strong>reponse :</strong> A, B, C, D (ou A,C pour choix multiple)</p>
            <p><strong>choix_multiple :</strong> oui / non</p>
            <p><strong>audio_url :</strong> URL du fichier audio (pour CO uniquement)</p>
          </div>
        </details>
      </div>

      {/* Filtres rapides */}
      <div className="flex gap-3">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as 'CE' | 'CO' | 'all')}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="all">Toutes ({questions.length})</option>
          <option value="CE">CE - Compréhension Écrite ({ceQuestions.length})</option>
          <option value="CO">CO - Compréhension Orale ({coQuestions.length})</option>
        </select>
        <select value={filterNiveau} onChange={(e) => setFilterNiveau(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="all">Tous les niveaux</option>
          {NIVEAUX.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {/* Formulaire inline */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 overflow-hidden">
          <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-blue-800">
              {editingId ? 'Modifier la question' : `Nouvelle question ${form.typeCompetence}`}
            </span>
            <button onClick={resetForm}><X className="h-4 w-4 text-slate-400" /></button>
          </div>

          <div className="px-5 py-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Compétence *</label>
                <select value={form.typeCompetence}
                  onChange={(e) => setForm({ ...form, typeCompetence: e.target.value as 'CE' | 'CO' })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="CE">CE - Compréhension Écrite</option>
                  <option value="CO">CO - Compréhension Orale</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Niveau *</label>
                <select value={form.niveau}
                  onChange={(e) => setForm({ ...form, niveau: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  {NIVEAUX.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Points</label>
                <input type="number" min={0.5} max={5} step={0.5} value={form.points}
                  onChange={(e) => setForm({ ...form, points: parseFloat(e.target.value) || 1 })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>

            {/* Upload audio pour CO */}
            {form.typeCompetence === 'CO' && (
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <label className="block text-xs font-medium text-purple-700 mb-2">
                  Fichier audio (MP3, WAV, OGG - max 20 Mo) *
                </label>
                {form.mediaUrl ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const audio = new Audio(form.mediaUrl);
                        audio.play().catch(() => setError('Impossible de lire l\'audio'));
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700"
                    >
                      <Play className="h-3 w-3" /> Écouter
                    </button>
                    <span className="text-xs text-purple-600 truncate flex-1">{form.mediaUrl.split('/').pop()}</span>
                    <button onClick={() => setForm({ ...form, mediaUrl: '' })}
                      className="text-xs text-red-500 hover:text-red-700">Supprimer</button>
                  </div>
                ) : (
                  <div
                    onClick={() => audioInputRef.current?.click()}
                    className="border-2 border-dashed border-purple-200 rounded-lg p-4 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-100/50 transition-colors"
                  >
                    {uploadingAudio ? (
                      <div className="animate-spin h-6 w-6 border-2 border-purple-200 border-t-purple-600 rounded-full mx-auto" />
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-purple-400 mx-auto mb-1" />
                        <p className="text-xs text-purple-600">Cliquez pour importer un fichier audio</p>
                      </>
                    )}
                    <input ref={audioInputRef} type="file" accept=".mp3,.wav,.ogg,.webm,.m4a"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleUploadAudio(e.target.files[0]);
                        e.target.value = '';
                      }} />
                  </div>
                )}
              </div>
            )}

            {/* Question */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Question *</label>
              <textarea value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={2}
                placeholder={form.typeCompetence === 'CO'
                  ? 'Ex: Écoutez l\'enregistrement. De quoi parle la personne ?'
                  : 'Ex: Lisez le texte suivant. Quelle est l\'information principale ?'} />
            </div>

            {/* Type de question: choix unique vs multiple */}
            <div className="flex items-center gap-4 bg-slate-50 rounded-lg px-4 py-3">
              <span className="text-xs font-medium text-slate-600">Type de réponse :</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="choixType" checked={!form.choixMultiple}
                  onChange={() => setForm({ ...form, choixMultiple: false, reponsesCorrectes: [] })}
                  className="text-blue-600" />
                <span className="text-sm text-slate-700">Choix unique</span>
                <span className="text-[10px] text-slate-400">(1 seule bonne réponse)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="choixType" checked={form.choixMultiple}
                  onChange={() => setForm({ ...form, choixMultiple: true, reponsesCorrectes: form.reponseCorrecte ? [form.reponseCorrecte] : [] })}
                  className="text-blue-600" />
                <span className="text-sm text-slate-700">Choix multiple</span>
                <span className="text-[10px] text-slate-400">(plusieurs bonnes réponses)</span>
              </label>
            </div>

            {/* Choix avec bonne(s) réponse(s) */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Choix de réponses *
                <span className="text-slate-400 font-normal ml-1">
                  {form.choixMultiple
                    ? '(cochez toutes les bonnes réponses)'
                    : '(cliquez sur la lettre pour marquer la bonne réponse)'}
                </span>
              </label>
              <div className="space-y-2">
                {LETTRES.map((lettre, idx) => {
                  const isCorrect = form.choixMultiple
                    ? form.reponsesCorrectes.includes(lettre)
                    : form.reponseCorrecte === lettre;

                  const toggleCorrect = () => {
                    if (form.choixMultiple) {
                      const updated = isCorrect
                        ? form.reponsesCorrectes.filter((l) => l !== lettre)
                        : [...form.reponsesCorrectes, lettre];
                      setForm({ ...form, reponsesCorrectes: updated });
                    } else {
                      setForm({ ...form, reponseCorrecte: lettre });
                    }
                  };

                  return (
                    <div key={lettre} className="flex items-center gap-2">
                      <button type="button" onClick={toggleCorrect}
                        className={`w-9 h-9 ${form.choixMultiple ? 'rounded-lg' : 'rounded-full'} text-sm font-bold border-2 flex items-center justify-center transition-all ${
                          isCorrect
                            ? 'bg-green-500 border-green-500 text-white scale-110'
                            : 'border-slate-200 text-slate-400 hover:border-green-300'
                        }`}
                        title={isCorrect ? 'Bonne réponse' : 'Marquer comme bonne réponse'}>
                        {lettre}
                      </button>
                      <input type="text" value={form.choix[idx]}
                        onChange={(e) => updateChoix(idx, e.target.value)}
                        placeholder={`Choix ${lettre}${idx < 2 ? ' *' : ' (optionnel)'}`}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                          isCorrect
                            ? 'border-green-300 bg-green-50 focus:ring-green-500'
                            : 'border-slate-300 focus:ring-blue-500'
                        } focus:ring-1 focus:outline-none`} />
                      {isCorrect && (
                        <span className="text-xs text-green-600 font-medium whitespace-nowrap">
                          {form.choixMultiple ? '✓ Correct' : 'Bonne réponse'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                <input type="checkbox" checked={form.actif}
                  onChange={(e) => setForm({ ...form, actif: e.target.checked })}
                  className="rounded border-slate-300" /> Question active
              </label>
              <div className="flex items-center gap-2">
                <button onClick={resetForm}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
                  Annuler
                </button>
                <button onClick={handleSave} disabled={saving || !form.question.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                  <Check className="h-4 w-4" />
                  {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Créer la question'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SECTION CE ==================== */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => toggleSection('ce')}>
          <div className="flex items-center gap-2">
            {collapsedSections.has('ce') ? <ChevronRight className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
            <FileText className="h-5 w-5 text-blue-500" />
            <h2 className="font-semibold text-slate-800">Compréhension Écrite (CE)</h2>
            <span className="text-xs text-slate-400">({ceQuestions.length})</span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); openNew('CE'); }}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" /> Ajouter
          </button>
        </div>
        {!collapsedSections.has('ce') && (
          <div className="divide-y divide-slate-100">
            {ceQuestions.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-400">Aucune question CE</div>
            ) : ceQuestions.map((q) => (
              <QuestionRow key={q.id} q={q} onEdit={openEdit} onDelete={handleDelete}
                onToggle={toggleActif} onPlayAudio={playPreview} playingId={playingAudioId} />
            ))}
          </div>
        )}
      </section>

      {/* ==================== SECTION CO ==================== */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => toggleSection('co')}>
          <div className="flex items-center gap-2">
            {collapsedSections.has('co') ? <ChevronRight className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
            <Volume2 className="h-5 w-5 text-purple-500" />
            <h2 className="font-semibold text-slate-800">Compréhension Orale (CO)</h2>
            <span className="text-xs text-slate-400">({coQuestions.length})</span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); openNew('CO'); }}
            className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 transition-colors">
            <Plus className="h-4 w-4" /> Ajouter
          </button>
        </div>
        {!collapsedSections.has('co') && (
          <div className="divide-y divide-slate-100">
            {coQuestions.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-400">
                Aucune question CO. Ajoutez des questions avec un fichier audio pour la compréhension orale.
              </div>
            ) : coQuestions.map((q) => (
              <QuestionRow key={q.id} q={q} onEdit={openEdit} onDelete={handleDelete}
                onToggle={toggleActif} onPlayAudio={playPreview} playingId={playingAudioId} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// Composant ligne de question
function QuestionRow({ q, onEdit, onDelete, onToggle, onPlayAudio, playingId }: {
  q: QcmQuestion;
  onEdit: (q: QcmQuestion) => void;
  onDelete: (id: number) => void;
  onToggle: (q: QcmQuestion) => void;
  onPlayAudio: (url: string, id: number) => void;
  playingId: number | null;
}) {
  return (
    <div className={`px-5 py-3 hover:bg-slate-50 transition-colors ${!q.actif ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
              q.type_competence === 'CE' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
            }`}>{q.type_competence}</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{q.niveau}</span>
            <span className="text-[10px] text-slate-400">{q.points} pt{q.points > 1 ? 's' : ''}</span>
            {q.choix_multiple && (
              <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-medium">Choix multiple</span>
            )}
            {q.type_competence === 'CO' && q.media_url && (
              <button onClick={() => onPlayAudio(q.media_url!, q.id)}
                className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                  playingId === q.id ? 'bg-purple-200 text-purple-800' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                }`}>
                {playingId === q.id ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5" />}
                Audio
              </button>
            )}
            {q.type_competence === 'CO' && !q.media_url && (
              <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded">Audio manquant</span>
            )}
          </div>
          <p className="text-sm text-slate-800">{q.question}</p>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {q.choix.filter(Boolean).map((choix, i) => {
              const lettre = LETTRES[i];
              const isCorrect = q.choix_multiple
                ? (q.reponses_correctes || []).includes(lettre)
                : lettre === q.reponse_correcte;
              return (
                <span key={i} className={`text-xs px-2 py-0.5 rounded ${
                  isCorrect
                    ? 'bg-green-100 text-green-700 font-semibold'
                    : 'bg-slate-50 text-slate-500'
                }`}>
                  {lettre}. {choix}
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onToggle(q)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            title={q.actif ? 'Désactiver' : 'Activer'}>
            {q.actif ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-slate-300" />}
          </button>
          <button onClick={() => onEdit(q)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <Pencil className="h-4 w-4 text-slate-400" />
          </button>
          <button onClick={() => onDelete(q.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
            <Trash2 className="h-4 w-4 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
