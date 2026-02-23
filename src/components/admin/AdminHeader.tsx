'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, User, FilePlus, MapPin, Link2, Check } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface AdminHeaderProps {
  onMenuToggle: () => void;
}

function CopyLinkButton({ label, path, color }: { label: string; path: string; color: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all active:scale-[0.97] ${
        copied
          ? 'bg-green-100 text-green-700'
          : color
      }`}
      title={`Copier le lien d'inscription ${label}`}
    >
      {copied ? <Check className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
      {copied ? 'Copié !' : label}
    </button>
  );
}

export default function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const { prenom, nom, lieu, role } = useAdminAuth();
  const isAdmin = role === 'admin';

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

        <div className="flex items-center gap-2 text-sm text-slate-600">
          {/* Liens publics d'inscription */}
          {isAdmin ? (
            <>
              <CopyLinkButton label="Lien Gagny" path="/inscription-gagny" color="bg-blue-50 text-blue-700 hover:bg-blue-100" />
              <CopyLinkButton label="Lien Sarcelles" path="/inscription-sarcelles" color="bg-purple-50 text-purple-700 hover:bg-purple-100" />
            </>
          ) : lieu ? (
            <CopyLinkButton
              label="Lien inscription"
              path={lieu === 'Gagny' ? '/inscription-gagny' : '/inscription-sarcelles'}
              color="bg-blue-50 text-blue-700 hover:bg-blue-100"
            />
          ) : null}

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
