'use client';

import Link from 'next/link';
import { Menu, User, FilePlus, MapPin } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface AdminHeaderProps {
  onMenuToggle: () => void;
}

export default function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const { prenom, nom, lieu } = useAdminAuth();

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
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-800 active:scale-[0.98]"
          >
            <FilePlus className="h-4 w-4" />
            Nouvelle inscription
          </Link>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-600">
          {lieu && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              <MapPin className="h-3 w-3" />
              {lieu}
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
