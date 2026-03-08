'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  FilePlus,
  Users,
  LogOut,
  X,
} from 'lucide-react';
import { usePartenaireAuth } from '@/hooks/usePartenaireAuth';

const navItems = [
  { href: '/partenaire/planning', label: 'Planning', icon: Calendar },
  { href: '/partenaire/inscription', label: 'Nouvelle inscription', icon: FilePlus },
  { href: '/partenaire/candidats', label: 'Mes candidats', icon: Users },
];

interface PartenaireSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function PartenaireSidebar({ open, onClose }: PartenaireSidebarProps) {
  const pathname = usePathname();
  const { logout } = usePartenaireAuth();

  const isActive = (href: string) => {
    if (href === '/partenaire') return pathname === '/partenaire';
    return pathname.startsWith(href);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 lg:translate-x-0 lg:sticky lg:z-auto ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <Link href="/partenaire" className="flex items-center gap-2">
            <Image
              src="/logo-mystory.png"
              alt="MyStoryFormation"
              width={130}
              height={38}
            />
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Badge */}
        <div className="px-5 py-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 border border-violet-200">
            Espace Partenaire
          </span>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(href)
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto px-3 py-4 border-t border-slate-200">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 bg-red-50/60 shadow-[0_0_12px_rgba(239,68,68,0.15)] hover:bg-red-100 hover:shadow-[0_0_18px_rgba(239,68,68,0.25)] transition-all w-full"
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}
