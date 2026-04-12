'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Volume2,
  FileText,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  Clock,
} from 'lucide-react';
import type { TestFormation, QcmReponse } from '@/types/admin';

interface QcmQuestionDetail {
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
}

interface Props {
  test: TestFormation;
  type: 'initial' | 'final';
}

const LETTRES = ['A', 'B', 'C', 'D'];

export default function TestResultsDetail({ test, type }: Props) {
  const [questions, setQuestions] = useState<QcmQuestionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCe, setExpandedCe] = useState(false);
  const [expandedCo, setExpandedCo] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await fetch('/api/admin/qcm-questions');
        const data = await res.json();
        setQuestions(Array.isArray(data) ? data : []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    loadQuestions();
  }, []);

  const reponsesCe = test.reponsesCe || [];
  const reponsesCo = test.reponsesCo || [];
  const hasCeDetails = reponsesCe.length > 0;
  const hasCoDetails = reponsesCo.length > 0;

  if (!hasCeDetails && !hasCoDetails) {
    return (
      <div className="text-xs text-slate-400 italic mt-2">
        Scores saisis manuellement (pas de détail question par question)
      </div>
    );
  }

  const correctCe = reponsesCe.filter((r) => r.correct).length;
  const correctCo = reponsesCo.filter((r) => r.correct).length;

  const playAudio = (url: string, id: number) => {
    if (playingAudioId === id) {
      setPlayingAudioId(null);
      return;
    }
    const audio = new Audio(url);
    audio.onended = () => setPlayingAudioId(null);
    audio.play().catch(() => {});
    setPlayingAudioId(id);
  };

  return (
    <div className="mt-4 space-y-3">
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        Détail des réponses — Test {type}
      </h4>

      {/* CE */}
      {hasCeDetails && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <button
            onClick={() => setExpandedCe(!expandedCe)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              {expandedCe ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-slate-800">Compréhension Écrite (CE)</span>
              <span className="text-xs text-slate-400">{reponsesCe.length} questions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-green-600">{correctCe} correct{correctCe > 1 ? 'es' : 'e'}</span>
              <span className="text-xs text-slate-400">/</span>
              <span className="text-xs text-slate-500">{reponsesCe.length}</span>
              <span className="text-sm font-bold text-blue-700 ml-2">{test.scoreCe}/20</span>
            </div>
          </button>

          {expandedCe && (
            <div className="border-t border-slate-100 divide-y divide-slate-50">
              {reponsesCe.map((r, idx) => (
                <QuestionResultRow
                  key={idx}
                  index={idx + 1}
                  reponse={r}
                  question={questions.find((q) => q.id === r.question)}
                  onPlayAudio={playAudio}
                  playingAudioId={playingAudioId}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* CO */}
      {hasCoDetails && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <button
            onClick={() => setExpandedCo(!expandedCo)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              {expandedCo ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
              <Volume2 className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-slate-800">Compréhension Orale (CO)</span>
              <span className="text-xs text-slate-400">{reponsesCo.length} questions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-green-600">{correctCo} correct{correctCo > 1 ? 'es' : 'e'}</span>
              <span className="text-xs text-slate-400">/</span>
              <span className="text-xs text-slate-500">{reponsesCo.length}</span>
              <span className="text-sm font-bold text-purple-700 ml-2">{test.scoreCo}/20</span>
            </div>
          </button>

          {expandedCo && (
            <div className="border-t border-slate-100 divide-y divide-slate-50">
              {reponsesCo.map((r, idx) => (
                <QuestionResultRow
                  key={idx}
                  index={idx + 1}
                  reponse={r}
                  question={questions.find((q) => q.id === r.question)}
                  onPlayAudio={playAudio}
                  playingAudioId={playingAudioId}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuestionResultRow({
  index,
  reponse,
  question,
  onPlayAudio,
  playingAudioId,
}: {
  index: number;
  reponse: QcmReponse;
  question?: QcmQuestionDetail;
  onPlayAudio: (url: string, id: number) => void;
  playingAudioId: number | null;
}) {
  const isCorrect = reponse.correct;
  const userAnswer = reponse.reponse || '-';

  // Déterminer la bonne réponse
  let correctAnswer = '';
  if (question) {
    if (question.choix_multiple && question.reponses_correctes?.length > 0) {
      correctAnswer = question.reponses_correctes.join(', ');
    } else {
      correctAnswer = question.reponse_correcte;
    }
  }

  return (
    <div className={`px-4 py-2.5 ${isCorrect ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
      <div className="flex items-start gap-3">
        {/* Indicateur correct/incorrect */}
        <div className="mt-0.5">
          {isCorrect ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Question */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono">Q{index}</span>
            {question?.type_competence === 'CO' && question.media_url && (
              <button
                onClick={() => onPlayAudio(question.media_url!, question.id)}
                className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                  playingAudioId === question.id ? 'bg-purple-200 text-purple-800' : 'bg-purple-50 text-purple-600'
                }`}
              >
                {playingAudioId === question.id ? <Pause className="h-2 w-2" /> : <Play className="h-2 w-2" />}
                Audio
              </button>
            )}
            {question?.choix_multiple && (
              <span className="text-[10px] bg-amber-50 text-amber-600 px-1 py-0.5 rounded">Multiple</span>
            )}
          </div>

          <p className="text-xs text-slate-700 mt-0.5">
            {question?.question || `Question #${reponse.question}`}
          </p>

          {/* Choix avec indication correct/incorrect */}
          {question && (
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {question.choix.filter(Boolean).map((choix, i) => {
                const lettre = LETTRES[i];
                const isUserAnswer = userAnswer.split(',').includes(lettre);
                const isCorrectAnswer = question.choix_multiple
                  ? (question.reponses_correctes || []).includes(lettre)
                  : question.reponse_correcte === lettre;

                let style = 'bg-slate-50 text-slate-400'; // Par défaut
                if (isCorrectAnswer && isUserAnswer) style = 'bg-green-100 text-green-700 font-semibold'; // Bon et choisi
                else if (isCorrectAnswer) style = 'bg-green-50 text-green-600 ring-1 ring-green-300'; // Bon mais pas choisi
                else if (isUserAnswer) style = 'bg-red-100 text-red-700 font-semibold'; // Mauvais et choisi

                return (
                  <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${style}`}>
                    {lettre}. {choix}
                  </span>
                );
              })}
            </div>
          )}

          {/* Résumé si pas de question trouvée */}
          {!question && (
            <div className="flex gap-2 mt-1 text-xs">
              <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                Réponse : {userAnswer}
              </span>
            </div>
          )}
        </div>

        {/* Score */}
        <div className="text-right shrink-0">
          <span className={`text-xs font-medium ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
            {isCorrect ? '✓' : '✗'}
          </span>
        </div>
      </div>
    </div>
  );
}
