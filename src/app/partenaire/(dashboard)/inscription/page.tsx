'use client';

import { ExamenForm } from '@/components/forms/ExamenForm';
import { usePartenaireAuth } from '@/hooks/usePartenaireAuth';

export default function PartenaireInscriptionPage() {
  const { id, loading } = usePartenaireAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-3 border-violet-200 border-t-violet-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Nouvelle inscription</h1>
      <ExamenForm partenaireId={id || undefined} />
    </div>
  );
}
