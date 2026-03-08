'use client';

import { useState } from 'react';
import PartenaireSidebar from '@/components/partenaire/PartenaireSidebar';
import PartenaireHeader from '@/components/partenaire/PartenaireHeader';

export default function PartenaireDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <PartenaireSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <PartenaireHeader onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
