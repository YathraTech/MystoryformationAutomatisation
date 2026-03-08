'use client';

import { Menu, User, Building2 } from 'lucide-react';
import { usePartenaireAuth } from '@/hooks/usePartenaireAuth';

interface PartenaireHeaderProps {
  onMenuToggle: () => void;
}

export default function PartenaireHeader({ onMenuToggle }: PartenaireHeaderProps) {
  const { prenom, nom, organisation } = usePartenaireAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden text-slate-500 hover:text-slate-700"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          {organisation && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
              <Building2 className="h-3 w-3" />
              {organisation}
            </span>
          )}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{prenom} {nom}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
