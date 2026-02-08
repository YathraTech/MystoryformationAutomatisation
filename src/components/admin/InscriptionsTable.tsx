'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Inscription, BadgeKey, BadgeColor } from '@/types/admin';
import { BADGE_DEFINITIONS, BADGE_CYCLE } from '@/lib/utils/admin-constants';

interface InscriptionsTableProps {
  inscriptions: Inscription[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onUpdated: () => void;
}

const BADGE_COLORS: Record<BadgeColor, { bg: string; text: string; ring: string }> = {
  red: { bg: 'bg-red-100', text: 'text-red-700', ring: 'ring-red-300' },
  orange: { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-300' },
  green: { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-300' },
};

function ClickableBadge({
  label,
  color,
  badgeKey,
  rowIndex,
  onUpdated,
}: {
  label: string;
  color: BadgeColor;
  badgeKey: BadgeKey;
  rowIndex: number;
  onUpdated: () => void;
}) {
  const [current, setCurrent] = useState<BadgeColor>(color || 'red');
  const [saving, setSaving] = useState(false);

  const style = BADGE_COLORS[current] || BADGE_COLORS.red;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saving) return;

    const nextColor = BADGE_CYCLE[current];
    setSaving(true);
    setCurrent(nextColor);

    try {
      const res = await fetch(`/api/admin/inscriptions/${rowIndex}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badge: badgeKey, color: nextColor }),
      });
      if (res.ok) {
        onUpdated();
      } else {
        setCurrent(current);
      }
    } catch {
      setCurrent(current);
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={saving}
      title={`${label} - Cliquer pour changer`}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold leading-4 transition-colors cursor-pointer select-none ring-1 ring-inset ${style.bg} ${style.text} ${style.ring} hover:brightness-90 disabled:opacity-60`}
    >
      {label}
    </button>
  );
}

export default function InscriptionsTable({
  inscriptions,
  page,
  totalPages,
  onPageChange,
  onUpdated,
}: InscriptionsTableProps) {
  const router = useRouter();
  const [archiving, setArchiving] = useState<number | null>(null);

  const handleRowClick = (rowIndex: number) => {
    router.push(`/admin/inscriptions/${rowIndex}`);
  };

  const handleArchive = async (e: React.MouseEvent, rowIndex: number) => {
    e.stopPropagation();
    setArchiving(rowIndex);
    try {
      const res = await fetch(`/api/admin/inscriptions/${rowIndex}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'Archivee' }),
      });
      if (res.ok) {
        onUpdated();
      }
    } catch {
      // silently fail
    } finally {
      setArchiving(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Nom
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Téléphone
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Formation
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Date
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Statut
              </th>
              <th className="text-center px-4 py-3 font-medium text-slate-600 w-12">
                <Archive className="h-4 w-4 mx-auto text-slate-400" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inscriptions.map((ins) => (
              <tr
                key={ins.rowIndex}
                onClick={() => handleRowClick(ins.rowIndex)}
                className="hover:bg-slate-50/50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 font-medium text-slate-900">
                  {ins.civilite} {ins.prenom} {ins.nom}
                </td>
                <td className="px-4 py-3 text-slate-600" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={`aircall://call/${ins.telephone?.replace(/\s/g, '')}`}
                    className="hover:text-blue-600 hover:underline transition-colors"
                    title="Appeler avec Aircall"
                  >
                    {ins.telephone}
                  </a>
                </td>
                <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">
                  {ins.formationNom}
                </td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {ins.timestamp}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {BADGE_DEFINITIONS.map((def) => (
                      <ClickableBadge
                        key={def.key}
                        label={def.label}
                        color={ins[def.key] || def.defaultColor}
                        badgeKey={def.key}
                        rowIndex={ins.rowIndex}
                        onUpdated={onUpdated}
                      />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleArchive(e, ins.rowIndex)}
                    disabled={archiving === ins.rowIndex || ins.statut === 'Archivee'}
                    title="Archiver"
                    className="p-2 rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
                  >
                    {archiving === ins.rowIndex ? (
                      <span className="block h-4 w-4 border-2 border-slate-300 border-t-red-500 rounded-full animate-spin" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
            {inscriptions.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-slate-400"
                >
                  Aucune inscription trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-slate-100">
        {inscriptions.map((ins) => (
          <div
            key={ins.rowIndex}
            onClick={() => handleRowClick(ins.rowIndex)}
            className="p-4 space-y-2 cursor-pointer hover:bg-slate-50/50 transition-colors active:bg-slate-100"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-900">
                {ins.prenom} {ins.nom}
              </span>
              <button
                onClick={(e) => handleArchive(e, ins.rowIndex)}
                disabled={archiving === ins.rowIndex || ins.statut === 'Archivee'}
                title="Archiver"
                className="p-1.5 rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Archive className="h-4 w-4" />
              </button>
            </div>
            <a
              href={`aircall://call/${ins.telephone?.replace(/\s/g, '')}`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm text-slate-500 hover:text-blue-600 hover:underline transition-colors"
              title="Appeler avec Aircall"
            >
              {ins.telephone}
            </a>
            <p className="text-sm text-slate-500 truncate">
              {ins.formationNom}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap pt-1" onClick={(e) => e.stopPropagation()}>
              {BADGE_DEFINITIONS.map((def) => (
                <ClickableBadge
                  key={def.key}
                  label={def.label}
                  color={ins[def.key] || def.defaultColor}
                  badgeKey={def.key}
                  rowIndex={ins.rowIndex}
                  onUpdated={onUpdated}
                />
              ))}
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-xs text-slate-400">{ins.timestamp}</span>
            </div>
          </div>
        ))}
        {inscriptions.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            Aucune inscription trouvée
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </button>
          <span className="text-sm text-slate-500">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
