'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  Award,
} from 'lucide-react';

interface Question {
  id: number;
  type_competence: 'CE' | 'CO';
  niveau: string;
  question: string;
  choix: string[];
  choix_multiple: boolean;
  reponses_correctes: string[];
  media_url: string | null;
  points: number;
}

interface Reponse {
  questionId: number;
  reponse: string; // Pour choix unique: 'A'. Pour choix multiple: 'A,C' (lettres jointes par virgule)
}

type Phase = 'loading' | 'intro' | 'test_ce' | 'test_co' | 'submitting' | 'results' | 'error' | 'already_done';

const LETTRES = ['A', 'B', 'C', 'D'];

export default function TestClientPage() {
  const params = useParams();
  const token = params.token as string;

  const [phase, setPhase] = useState<Phase>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [stagiaire, setStagiaire] = useState<{ nom: string; prenom: string; civilite: string } | null>(null);
  const [questionsCe, setQuestionsCe] = useState<Question[]>([]);
  const [questionsCo, setQuestionsCo] = useState<Question[]>([]);

  // Navigation
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reponsesCe, setReponsesCe] = useState<Reponse[]>([]);
  const [reponsesCo, setReponsesCo] = useState<Reponse[]>([]);

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  // Résultats
  const [results, setResults] = useState<{
    scores: { ce: number; co: number; ee: number; eo: number };
    scoreGlobal: number;
    niveau: string;
  } | null>(null);

  // Charger les données
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/test/${token}`);
        const data = await res.json();

        if (data.alreadyCompleted) {
          setStagiaire(data.stagiaire);
          setPhase('already_done');
          return;
        }

        if (data.error) {
          setErrorMsg(data.error);
          setPhase('error');
          return;
        }

        setStagiaire(data.stagiaire);
        setQuestionsCe(data.questionsCe || []);
        setQuestionsCo(data.questionsCo || []);
        setPhase('intro');
      } catch {
        setErrorMsg('Impossible de charger le test');
        setPhase('error');
      }
    }
    load();
  }, [token]);

  // Timer
  useEffect(() => {
    if (phase === 'test_ce' || phase === 'test_co') {
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [phase]);

  // Audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => { if (audio.duration) setAudioProgress((audio.currentTime / audio.duration) * 100); };
    const onEnd = () => { setAudioPlaying(false); setAudioProgress(0); };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    return () => { audio.removeEventListener('timeupdate', onTime); audio.removeEventListener('ended', onEnd); };
  }, [currentIndex, phase]);

  const currentQuestions = phase === 'test_ce' ? questionsCe : questionsCo;
  const currentReponses = phase === 'test_ce' ? reponsesCe : reponsesCo;
  const setCurrentReponses = phase === 'test_ce' ? setReponsesCe : setReponsesCo;
  const currentQuestion = currentQuestions[currentIndex] || null;

  const getReponse = (qId: number) => currentReponses.find((r) => r.questionId === qId)?.reponse || null;
  const getReponsesArray = (qId: number): string[] => {
    const r = getReponse(qId);
    return r ? r.split(',') : [];
  };
  const isLetterSelected = (qId: number, lettre: string): boolean => {
    const q = currentQuestions.find((q) => q.id === qId);
    if (q?.choix_multiple) return getReponsesArray(qId).includes(lettre);
    return getReponse(qId) === lettre;
  };

  const setReponse = (qId: number, lettre: string) => {
    const q = currentQuestions.find((q) => q.id === qId);
    setCurrentReponses((prev) => {
      if (q?.choix_multiple) {
        // Toggle la lettre dans la liste
        const current = prev.find((r) => r.questionId === qId);
        const currentLetters = current ? current.reponse.split(',').filter(Boolean) : [];
        const updated = currentLetters.includes(lettre)
          ? currentLetters.filter((l) => l !== lettre)
          : [...currentLetters, lettre].sort();
        const newReponse = updated.join(',');
        if (current) return prev.map((r) => r.questionId === qId ? { ...r, reponse: newReponse } : r);
        return [...prev, { questionId: qId, reponse: newReponse }];
      } else {
        // Choix unique
        const existing = prev.find((r) => r.questionId === qId);
        if (existing) return prev.map((r) => r.questionId === qId ? { ...r, reponse: lettre } : r);
        return [...prev, { questionId: qId, reponse: lettre }];
      }
    });
  };

  const goNext = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; setAudioPlaying(false); setAudioProgress(0); }
    if (currentIndex < currentQuestions.length - 1) setCurrentIndex(currentIndex + 1);
  };
  const goPrev = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; setAudioPlaying(false); setAudioProgress(0); }
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const startCe = () => { setCurrentIndex(0); setPhase('test_ce'); };
  const finishCe = () => {
    if (questionsCo.length > 0) {
      setCurrentIndex(0);
      setPhase('test_co');
    } else {
      submitTest();
    }
  };
  const finishCo = () => { submitTest(); };

  const submitTest = async () => {
    setPhase('submitting');
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const res = await fetch(`/api/test/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reponsesCe,
          reponsesCo,
          profilPedagogique: 'FLE',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResults(data);
        setPhase('results');
      } else {
        setErrorMsg(data.error || 'Erreur');
        setPhase('error');
      }
    } catch {
      setErrorMsg('Erreur réseau');
      setPhase('error');
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ===== ÉCRANS =====

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-3 border-blue-200 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900">Erreur</h1>
          <p className="text-sm text-slate-500 mt-2">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (phase === 'already_done') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900">Test déjà effectué</h1>
          <p className="text-sm text-slate-500 mt-2">
            {stagiaire?.civilite} {stagiaire?.nom}, votre test initial a déjà été enregistré.
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-lg text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Test de positionnement</h1>
          <p className="text-sm text-slate-500 mt-2 mb-6">
            Bienvenue {stagiaire?.civilite} {stagiaire?.nom}. Ce test va évaluer votre niveau en français.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
            <h2 className="text-sm font-semibold text-slate-800 mb-2">Le test comprend :</h2>
            <div className="space-y-2">
              {questionsCe.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="text-slate-700">
                    <strong>Compréhension Écrite (CE)</strong> — {questionsCe.length} question{questionsCe.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {questionsCo.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Volume2 className="h-4 w-4 text-purple-500" />
                  <span className="text-slate-700">
                    <strong>Compréhension Orale (CO)</strong> — {questionsCo.length} question{questionsCo.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs text-amber-700">
              Les scores d'Expression Écrite (EE) et Expression Orale (EO) seront évalués séparément par votre formatrice.
            </p>
          </div>

          <button onClick={startCe}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
            Commencer le test
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'submitting') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4" />
          <p className="text-sm text-slate-600">Correction en cours...</p>
        </div>
      </div>
    );
  }

  if (phase === 'results' && results) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md text-center">
          <Award className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">Test terminé !</h1>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            Merci {stagiaire?.prenom}, voici vos résultats.
          </p>

          <div className="bg-blue-50 rounded-xl p-6 mb-4">
            <p className="text-sm text-blue-700 font-medium">Score CE + CO</p>
            <p className="text-4xl font-bold text-blue-900 mt-1">
              {(results.scores.ce + results.scores.co).toFixed(1)}<span className="text-xl text-blue-400">/40</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">CE</p>
              <p className="text-xl font-bold text-slate-800">{results.scores.ce}/20</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">CO</p>
              <p className="text-xl font-bold text-slate-800">{results.scores.co}/20</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1 text-sm text-slate-500 mb-4">
            <Clock className="h-4 w-4" />
            Temps : {formatTime(elapsed)}
          </div>

          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-sm text-green-700">
              Vos scores ont été enregistrés dans votre dossier. Votre commerciale vous contactera pour la suite.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ===== INTERFACE DE TEST CE/CO =====
  const totalQ = currentQuestions.length;
  const answeredCount = currentReponses.length;
  const phaseLabel = phase === 'test_ce' ? 'Compréhension Écrite' : 'Compréhension Orale';
  const phaseColor = phase === 'test_ce' ? 'blue' : 'purple';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {phase === 'test_ce' ? <FileText className="h-5 w-5 text-blue-500" /> : <Volume2 className="h-5 w-5 text-purple-500" />}
            <span className={`text-sm font-semibold text-${phaseColor}-700`}>{phaseLabel}</span>
            <span className="text-xs text-slate-400">— {currentIndex + 1}/{totalQ}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatTime(elapsed)}</span>
            <span>{answeredCount}/{totalQ}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-slate-100">
        <div className={`h-full bg-${phaseColor}-500 transition-all duration-300`}
          style={{ width: `${((currentIndex + 1) / totalQ) * 100}%` }} />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Grille de navigation */}
        <div className="flex gap-1 mb-6 flex-wrap">
          {currentQuestions.map((q, i) => {
            const answered = getReponse(q.id) !== null;
            return (
              <button key={q.id} onClick={() => {
                if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; setAudioPlaying(false); setAudioProgress(0); }
                setCurrentIndex(i);
              }}
                className={`w-8 h-8 rounded-lg text-xs font-medium border transition-colors ${
                  i === currentIndex ? `bg-${phaseColor}-600 text-white border-${phaseColor}-600`
                    : answered ? 'bg-green-100 text-green-700 border-green-200'
                    : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                }`}>{i + 1}</button>
            );
          })}
        </div>

        {/* Question */}
        {currentQuestion && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-medium">
              Niveau {currentQuestion.niveau}
            </span>

            {/* Audio player CO */}
            {currentQuestion.type_competence === 'CO' && currentQuestion.media_url && (
              <div className="mt-4 bg-purple-50 rounded-xl p-4">
                <audio ref={audioRef} src={currentQuestion.media_url} preload="auto" />
                <div className="flex items-center gap-3">
                  <button onClick={() => {
                    if (!audioRef.current) return;
                    if (audioPlaying) { audioRef.current.pause(); setAudioPlaying(false); }
                    else { audioRef.current.play(); setAudioPlaying(true); }
                  }}
                    className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-colors shadow-lg">
                    {audioPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                  </button>
                  <div className="flex-1">
                    <div className="w-full h-2.5 bg-purple-200 rounded-full">
                      <div className="h-full bg-purple-600 rounded-full transition-all" style={{ width: `${audioProgress}%` }} />
                    </div>
                  </div>
                  <button onClick={() => { if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play(); setAudioPlaying(true); } }}
                    className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg">
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-purple-600 mt-2 text-center">Écoutez puis répondez</p>
              </div>
            )}

            <h3 className="text-lg font-medium text-slate-900 mt-5 mb-6">{currentQuestion.question}</h3>

            {/* Indication choix multiple */}
            {currentQuestion.choix_multiple && (
              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg mb-3">
                Plusieurs réponses possibles — cochez toutes les bonnes réponses
              </p>
            )}

            {/* Choix */}
            <div className="space-y-3">
              {currentQuestion.choix.filter(Boolean).map((choix, idx) => {
                const lettre = LETTRES[idx];
                const selected = isLetterSelected(currentQuestion.id, lettre);
                const isMultiple = currentQuestion.choix_multiple;
                return (
                  <button key={idx} onClick={() => setReponse(currentQuestion.id, lettre)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left transition-all ${
                      selected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}>
                    <span className={`w-10 h-10 ${isMultiple ? 'rounded-lg' : 'rounded-full'} flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                      selected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-slate-400'
                    }`}>
                      {selected && isMultiple ? '✓' : lettre}
                    </span>
                    <span className={`text-sm ${selected ? 'text-blue-900 font-medium' : 'text-slate-700'}`}>{choix}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button onClick={goPrev} disabled={currentIndex === 0}
            className="flex items-center gap-1 px-4 py-2.5 text-sm text-slate-600 hover:text-slate-800 disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" /> Précédent
          </button>

          {currentIndex === totalQ - 1 ? (
            <button onClick={phase === 'test_ce' ? finishCe : finishCo}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors">
              <CheckCircle2 className="h-4 w-4" />
              {phase === 'test_ce' && questionsCo.length > 0 ? 'Passer au CO' : 'Terminer le test'}
            </button>
          ) : (
            <button onClick={goNext}
              className={`flex items-center gap-1 px-5 py-2.5 bg-${phaseColor}-600 text-white text-sm font-medium rounded-xl hover:bg-${phaseColor}-700 transition-colors`}>
              Suivant <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
