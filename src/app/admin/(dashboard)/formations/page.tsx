'use client';

import { BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function FormationsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-slate-100 p-4 mb-4">
        <BookOpen className="h-12 w-12 text-slate-400" />
      </div>
      <h1 className="text-xl font-semibold text-slate-800 mb-2">
        Page en cours de développement
      </h1>
      <p className="text-slate-500 text-center max-w-md mb-6">
        La gestion des formations sera bientôt disponible.
      </p>
      <Link
        href="/admin"
        className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
      >
        Retour au tableau de bord
      </Link>
    </div>
  );
}
