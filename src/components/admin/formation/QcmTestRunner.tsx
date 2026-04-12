'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
}

interface QcmReponse {
  questionId: number;
  reponse: string; // 'A', 'B', 'C', 'D'
}

interface Props {
  competence: 'CE' | 'CO';
  onComplete: (score: number, reponses: { question: number; reponse: string; correct: boolean }[]) => void;
  onCancel: () => void;
}

const LETTRES = ['A', 'B', 'C', 'D'];

export default function QcmTestRunner({ competence, onComplete, onCancel }: Props) {
  const [questions, setQuestions] = useState<QcmQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reponses, setReponses] = useState<QcmReponse[]>([]);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    total: number;
    details: { question: number; reponse: string; correct: boolean }[];
  } | null>(null);

  // Audio
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Charger les questions
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/qcm-questions?type=${competence}`);
        const data = await res.json();
        // Ne garder que les questions actives
        const actives = (Array.isArray(data) ? data : []).filter(
          (q: QcmQuestion & { actif?: boolean }) => q.actif !== false
        );
        setQuestions(actives);
      } catch {
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [competence]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Audio progress
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      if (audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const onEnd = () => {
      setAudioPlaying(false);
      setAudioProgress(0);
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
    };
  }, [currentIndex, questions]);

  const currentQuestion = questions[currentIndex] || null;

  const getReponse = (questionId: number): string | null => {
    return reponses.find((r) => r.questionId === questionId)?.reponse || null;
  };

  const setReponse = (questionId: number, lettre: string) => {
    setReponses((prev) => {
      const existing = prev.find((r) => r.questionId === questionId);
      if (existing) {
        return prev.map((r) => (r.questionId === questionId ? { ...r, reponse: lettre } : r));
      }
      return [...prev, { questionId, reponse: lettre }];
    });
  };

  const playAudio = () => {
    if (!audioRef.current) return;
    if (audioPlaying) {
      audioRef.current.pause();
      setAudioPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setAudioPlaying(true);
    }
  };

  const restartAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
    setAudioPlaying(true);
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      // Stop audio when moving
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setAudioPlaying(false);
        setAudioProgress(0);
      }
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setAudioPlaying(false);
        setAudioProgress(0);
      }
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFinish = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioRef.current) audioRef.current.pause();

    // Calculer le score
    let totalPoints = 0;
    let earnedPoints = 0;
    const details: { question: number; reponse: string; correct: boolean }[] = [];

    questions.forEach((q) => {
      totalPoints += q.points;
      const userReponse = getReponse(q.id);
      const correct = userReponse === q.reponse_correcte;
      if (correct) earnedPoints += q.points;
      details.push({
        question: q.id,
        reponse: userReponse || '',
        correct,
      });
    });

    // Normaliser sur 20
    const score20 = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 20 * 10) / 10 : 0;

    setResults({ score: score20, total: 20, details });
    setFinished(true);
    onComplete(score20, details);
  }, [questions, reponses, onComplete]);

  const answeredCount = reponses.length;
  const totalCount = questions.length;
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-900">Aucune question disponible</h3>
        <p className="text-sm text-slate-500 mt-1">
          Ajoutez des questions {competence} dans la banque QCM avant de lancer le test.
        </p>
        <button
          onClick={onCancel}
          className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-800"
        >
          Retour
        </button>
      </div>
    );
  }

  // Écran de résultats
  if (finished && results) {
    return (
      <div className="max-w-lg mx-auto text-center py-8">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">
          Test {competence} terminé
        </h2>
        <div className="mt-6 bg-blue-50 rounded-xl p-6">
          <p className="text-sm text-blue-700 font-medium">Score</p>
          <p className="text-5xl font-bold text-blue-900 mt-1">
            {results.score}<span className="text-2xl text-blue-400">/{results.total}</span>
          </p>
          <p className="text-sm text-blue-600 mt-2">
            {results.details.filter((d) => d.correct).length}/{results.details.length} réponses correctes
          </p>
        </div>
        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatTime(elapsedSeconds)}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            {totalCount} questions
          </span>
        </div>

        {/* Détail par question */}
        <div className="mt-6 text-left">
          <h3 className="text-sm font-medium text-slate-700 mb-2">Détail des réponses</h3>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {results.details.map((d, i) => {
              const q = questions.find((q) => q.id === d.question);
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                    d.correct ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <span className={d.correct ? 'text-green-700' : 'text-red-700'}>
                    Q{i + 1}. {q?.question.slice(0, 50)}...
                  </span>
                  <span className={`font-medium ${d.correct ? 'text-green-600' : 'text-red-600'}`}>
                    {d.reponse || '-'} {d.correct ? '✓' : `✗ (${q?.reponse_correcte})`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Interface de passage du test
  return (
    <div className="max-w-2xl mx-auto">
      {/* Barre de progression */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
              competence === 'CE' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
            }`}
          >
            {competence === 'CO' && <Volume2 className="h-3 w-3" />}
            {competence === 'CE' ? 'Compréhension Écrite' : 'Compréhension Orale'}
          </span>
          <span className="text-sm text-slate-500">
            Question {currentIndex + 1}/{totalCount}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatTime(elapsedSeconds)}
          </span>
          <span className="text-xs text-slate-400">
            {answeredCount}/{totalCount} répondu{answeredCount > 1 ? 'es' : ''}
          </span>
        </div>
      </div>

      {/* Barre de progression visuelle */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full mb-6">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
        />
      </div>

      {/* Navigation par numéros */}
      <div className="flex gap-1 mb-6 flex-wrap">
        {questions.map((q, i) => {
          const answered = getReponse(q.id) !== null;
          return (
            <button
              key={q.id}
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.pause();
                  audioRef.current.currentTime = 0;
                  setAudioPlaying(false);
                  setAudioProgress(0);
                }
                setCurrentIndex(i);
              }}
              className={`w-7 h-7 rounded text-[10px] font-medium border transition-colors ${
                i === currentIndex
                  ? 'bg-blue-600 text-white border-blue-600'
                  : answered
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Question */}
      {currentQuestion && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {/* Niveau badge */}
          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
            Niveau {currentQuestion.niveau}
          </span>

          {/* Audio player pour CO */}
          {currentQuestion.type_competence === 'CO' && currentQuestion.media_url && (
            <div className="mt-3 bg-purple-50 rounded-lg p-4">
              <audio ref={audioRef} src={currentQuestion.media_url} preload="auto" />
              <div className="flex items-center gap-3">
                <button
                  onClick={playAudio}
                  className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-colors"
                >
                  {audioPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                </button>
                <div className="flex-1">
                  <div className="w-full h-2 bg-purple-200 rounded-full">
                    <div
                      className="h-full bg-purple-600 rounded-full transition-all"
                      style={{ width: `${audioProgress}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={restartAudio}
                  className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg"
                  title="Recommencer"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-purple-600 mt-2">
                Écoutez l'enregistrement puis répondez à la question
              </p>
            </div>
          )}

          {/* Texte de la question */}
          <h3 className="text-lg font-medium text-slate-900 mt-4 mb-6">
            {currentQuestion.question}
          </h3>

          {/* Choix de réponses */}
          <div className="space-y-3">
            {currentQuestion.choix.filter(Boolean).map((choix, idx) => {
              const lettre = LETTRES[idx];
              const selected = getReponse(currentQuestion.id) === lettre;

              return (
                <button
                  key={idx}
                  onClick={() => setReponse(currentQuestion.id, lettre)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-all ${
                    selected
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                      selected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-300 text-slate-400'
                    }`}
                  >
                    {lettre}
                  </span>
                  <span className={`text-sm ${selected ? 'text-blue-900 font-medium' : 'text-slate-700'}`}>
                    {choix}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="inline-flex items-center gap-1 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
          Précédent
        </button>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700"
          >
            Annuler
          </button>

          {currentIndex === totalCount - 1 ? (
            <button
              onClick={handleFinish}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              Terminer le test
            </button>
          ) : (
            <button
              onClick={goNext}
              className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
