'use client';

import { useState } from 'react';
import { InscriptionForm } from '@/components/forms/InscriptionForm';
import { ExamenForm } from '@/components/forms/ExamenForm';
import { GraduationCap, BookOpen } from 'lucide-react';

type InscriptionType = 'examen' | 'formation';

export default function HomePage() {
  const [inscriptionType, setInscriptionType] = useState<InscriptionType>('examen');

  return (
    <main className="flex-grow flex flex-col items-center px-4 py-12 md:py-16 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-b from-blue-50/80 to-transparent blur-3xl -z-10 pointer-events-none" />

      <div className="w-full max-w-3xl z-10 space-y-8">
        {/* Toggle buttons */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-xl bg-slate-100 p-1.5">
            <button
              type="button"
              onClick={() => setInscriptionType('examen')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                inscriptionType === 'examen'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <GraduationCap className="h-5 w-5" />
              EXAMEN
            </button>
            <button
              type="button"
              onClick={() => setInscriptionType('formation')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                inscriptionType === 'formation'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <BookOpen className="h-5 w-5" />
              FORMATION
            </button>
          </div>
        </div>

        {inscriptionType === 'formation' ? (
          <InscriptionForm />
        ) : (
          <ExamenForm />
        )}
      </div>
    </main>
  );
}
