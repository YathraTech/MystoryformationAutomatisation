'use client';

import { CheckCircle2, XCircle, Clock, Calendar } from 'lucide-react';
import type { StagiaireFormation, Emargement } from '@/types/admin';

interface Props {
  stagiaireId: number;
  stagiaire: StagiaireFormation;
  emargements: Emargement[];
  onRefresh: () => void;
}

function formatDateLong(date: string | null | undefined): string {
  if (!date) return 'Date inconnue';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function EmargementSection({ stagiaireId, stagiaire, emargements, onRefresh }: Props) {
  const presences = emargements.filter((e) => e.present).length;
  const absences = emargements.filter((e) => !e.present).length;

  // Tri chronologique par date de cours (ascendant)
  const sortedEmargements = [...emargements].sort((a, b) => {
    const da = a.dateCours || '';
    const db = b.dateCours || '';
    return da.localeCompare(db);
  });

  // Indices pour stabilité (éviter react warnings)
  void stagiaireId;
  void onRefresh;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Émargement & Présences
        </h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            {presences} présent(s)
          </span>
          <span className="flex items-center gap-1 text-red-600">
            <XCircle className="h-3 w-3" />
            {absences} absent(s)
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <Clock className="h-3 w-3" />
            {stagiaire.heuresEffectuees}/{stagiaire.heuresPrevues}h
          </span>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="w-full h-2 bg-slate-100 rounded-full mb-4">
        <div
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{
            width: `${
              stagiaire.heuresPrevues > 0
                ? Math.min((stagiaire.heuresEffectuees / stagiaire.heuresPrevues) * 100, 100)
                : 0
            }%`,
          }}
        />
      </div>

      {emargements.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">
          Les émargements apparaîtront ici une fois les cours créés
        </p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {sortedEmargements.map((e) => {
            const past = e.dateCours && new Date(e.dateCours) < new Date();
            // 3 états visuels : à venir (neutre) / présent (vert) / absent (rouge)
            const bg = e.present
              ? 'bg-green-50 border-green-100'
              : past
                ? 'bg-red-50 border-red-100'
                : 'bg-slate-50 border-slate-100';
            return (
              <div
                key={e.id}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${bg}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {e.present ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : past ? (
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                  ) : (
                    <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className={`font-medium text-slate-800 truncate`}>
                      {formatDateLong(e.dateCours)}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-2">
                      {e.horaire && <span>{e.horaire}</span>}
                      {e.dureeHeures != null && <span>· {e.dureeHeures}h</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {e.present && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Présent
                    </span>
                  )}
                  {!e.present && past && !e.justificatifRecu && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded">
                      Justificatif manquant
                    </span>
                  )}
                  {!e.present && past && e.justificatifRecu && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Justificatif reçu
                    </span>
                  )}
                  {!e.present && past && e.mailRelanceEnvoye && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                      Relancé
                    </span>
                  )}
                  {!e.present && !past && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      À venir
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
