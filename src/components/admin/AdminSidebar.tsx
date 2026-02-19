'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UsersRound,
  BookOpen,
  ClipboardCheck,
  Calendar,
  Archive,
  LogOut,
  X,
  Settings,
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const mainNavItems = [
  { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/formations', label: 'Formations', icon: BookOpen, disabled: true },
  { href: '/admin/examens', label: 'Examens', icon: ClipboardCheck },
  { href: '/admin/planning', label: 'Planning', icon: Calendar },
];

const secondaryNavItems = [
  { href: '/admin/staff', label: 'Équipe', icon: UsersRound, adminOnly: true },
  { href: '/admin/archives', label: 'Archives', icon: Archive, adminOnly: true },
  { href: '/admin/examens/parametres', label: 'Paramètres examens', icon: Settings, adminOnly: true },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout, role } = useAdminAuth();
  const isAdmin = role === 'admin';

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    // Pour éviter que /admin/examens soit actif quand on est sur /admin/examens/parametres
    if (href === '/admin/examens' && pathname.startsWith('/admin/examens/parametres')) return false;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Backdrop mobile */}
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
          <Link href="/admin" className="flex items-center gap-2">
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

        <nav className="flex-1 px-3 py-4 space-y-1">
          {mainNavItems.map(({ href, label, icon: Icon, disabled }) => {
            if (disabled) {
              return (
                <div
                  key={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 cursor-not-allowed"
                  title="Bientôt disponible"
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </div>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}

          {/* Séparation */}
          <div className="my-3 border-t border-slate-200" />

          {secondaryNavItems.map(({ href, label, icon: Icon, adminOnly }) => {
            const disabled = adminOnly && !isAdmin;

            if (disabled) {
              return (
                <div
                  key={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 cursor-not-allowed"
                  title="Accès réservé aux administrateurs"
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </div>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
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
