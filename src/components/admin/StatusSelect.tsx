'use client';

import { useState } from 'react';
import type { InscriptionStatus } from '@/types/admin';
import { INSCRIPTION_STATUSES } from '@/lib/utils/admin-constants';

interface StatusSelectProps {
  currentStatus: InscriptionStatus;
  rowIndex: number;
  onUpdated: () => void;
}

export default function StatusSelect({
  currentStatus,
  rowIndex,
  onUpdated,
}: StatusSelectProps) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  const handleChange = async (newStatus: InscriptionStatus) => {
    if (newStatus === status) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/inscriptions/${rowIndex}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        onUpdated();
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value as InscriptionStatus)}
      disabled={saving}
      className={`text-xs rounded-lg border px-2 py-1.5 font-medium focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors disabled:opacity-50 ${
        status === 'En attente'
          ? 'border-amber-200 bg-amber-50 text-amber-800'
          : status === 'Validee'
            ? 'border-green-200 bg-green-50 text-green-800'
            : status === 'Archivee'
              ? 'border-slate-200 bg-slate-50 text-slate-600'
              : 'border-red-200 bg-red-50 text-red-800'
      }`}
    >
      {INSCRIPTION_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
