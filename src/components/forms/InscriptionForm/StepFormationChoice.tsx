'use client';

import { BookOpen } from 'lucide-react';

export function StepFormationChoice() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          Choix de formation
        </h2>
        <p className="text-sm text-slate-500">
          Sélectionnez la formation qui vous convient.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-slate-100 p-4 mb-4">
          <BookOpen className="h-10 w-10 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">
          Inscriptions temporairement suspendues
        </h3>
        <p className="text-sm text-slate-500 max-w-sm">
          Les inscriptions en ligne sont actuellement indisponibles.
          Veuillez nous contacter directement pour plus d&apos;informations.
        </p>
      </div>
    </div>
  );
}
