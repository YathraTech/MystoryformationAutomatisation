'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lock, LogOut } from 'lucide-react';

export function Header() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.role) setRole(data.role);
        if (data?.prenom && data?.nom) setUserName(`${data.prenom} ${data.nom}`);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <nav className="w-full border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/">
          <Image
            src="/logo-mystory.png"
            alt="MyStory Formation"
            width={150}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </Link>

        <div className="flex items-center gap-3">
          {(role === 'admin' || role === 'commercial' || role === 'staff') && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              Dashboard
              <Lock className="h-3.5 w-3.5" />
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-red-50 hover:border-red-200 hover:text-red-600"
          >
            {userName && <span>{userName}</span>}
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
