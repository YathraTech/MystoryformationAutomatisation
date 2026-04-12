'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Upload, Clock } from 'lucide-react';
import type { StagiaireFormation, Emargement } from '@/types/admin';

interface Props {
  stagiaireId: number;
  stagiaire: StagiaireFormation;
  emargements: Emargement[];
  onRefresh: () => void;
}

export default function EmargementSection({ stagiaireId, stagiaire, emargements, onRefresh }: Props) {
  const presences = emargements.filter((e) => e.present).length;
  const absences = emargements.filter((e) => !e.present).length;

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
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {emargements.map((e) => (
            <div
              key={e.id}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                e.present ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              <div className="flex items-center gap-2">
                {e.present ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className={e.present ? 'text-green-700' : 'text-red-700'}>
                  Session #{e.coursSessionId}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!e.present && !e.justificatifRecu && (
                  <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded">
                    Justificatif manquant
                  </span>
                )}
                {!e.present && e.justificatifRecu && (
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    Justificatif reçu
                  </span>
                )}
                {!e.present && e.mailRelanceEnvoye && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                    Relancé
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
