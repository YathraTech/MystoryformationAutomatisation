'use client';

import { GraduationCap, BookOpen } from 'lucide-react';
import { ExamenForm } from '@/components/forms/ExamenForm';

export default function InscriptionSarcellesPage() {
  return (
    <main className="flex-grow flex flex-col items-center px-4 py-12 md:py-16 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-b from-blue-50/80 to-transparent blur-3xl -z-10 pointer-events-none" />

      <div className="w-full max-w-3xl z-10 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Inscription — Centre de Sarcelles
          </h1>
        </div>

        {/* Toggle buttons */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-xl bg-slate-100 p-1.5">
            <button
              type="button"
              className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-white text-blue-700 shadow-sm"
            >
              <GraduationCap className="h-5 w-5" />
              EXAMEN
            </button>
            <button
              type="button"
              disabled
              className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-slate-400 cursor-not-allowed opacity-50"
            >
              <BookOpen className="h-5 w-5" />
              FORMATION
            </button>
          </div>
        </div>

        <ExamenForm forcedAgence="Sarcelles" />
      </div>
    </main>
  );
}
