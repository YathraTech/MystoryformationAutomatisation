'use client';

import { ExamenForm } from '@/components/forms/ExamenForm';

export default function InscriptionGagnyPage() {
  return (
    <main className="flex-grow flex flex-col items-center px-4 py-12 md:py-16 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-b from-blue-50/80 to-transparent blur-3xl -z-10 pointer-events-none" />

      <div className="w-full max-w-3xl z-10 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Inscription Examen — Centre de Gagny
          </h1>
          <p className="text-sm text-slate-500">
            Remplissez le formulaire ci-dessous pour vous inscrire à un examen.
          </p>
        </div>

        <ExamenForm forcedAgence="Sarcelles" />
      </div>
    </main>
  );
}
