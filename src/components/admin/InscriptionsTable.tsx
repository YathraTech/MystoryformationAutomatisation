'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Inscription } from '@/types/admin';

interface ExamStatusInfo {
  id: number;
  resultat: 'a_venir' | 'reussi' | 'echoue' | 'absent';
  diplome: string | null;
  dateExamen: string | null;
  lieu: string | null;
}

interface InscriptionsTableProps {
  inscriptions: Inscription[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onUpdated: () => void;
  showLieu?: boolean;
}

const RESULTAT_STYLES: Record<string, { bg: string; text: string; ring: string; label: string }> = {
  a_venir: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', label: 'À venir' },
  reussi: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', label: 'Réussi' },
  echoue: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200', label: 'Échoué' },
  absent: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200', label: 'Absent' },
};

function formatDateShort(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

function ExamStatusBadges({ examens }: { examens: ExamStatusInfo[] }) {
  if (examens.length === 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold leading-4 ring-1 ring-inset bg-slate-50 text-slate-400 ring-slate-200">
        Non inscrit
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {examens.map((ex) => {
        const style = RESULTAT_STYLES[ex.resultat] || RESULTAT_STYLES.a_venir;
        return (
          <div key={ex.id} className="flex items-center gap-1.5">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold leading-4 ring-1 ring-inset ${style.bg} ${style.text} ${style.ring}`}>
              {style.label}
            </span>
            <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
              {ex.diplome || 'Examen'}
              {ex.dateExamen && ` · ${formatDateShort(ex.dateExamen)}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function InscriptionsTable({
  inscriptions,
  page,
  totalPages,
  onPageChange,
  onUpdated,
  showLieu = false,
}: InscriptionsTableProps) {
  const router = useRouter();
  const [archiving, setArchiving] = useState<number | null>(null);
  const [examStatuses, setExamStatuses] = useState<Record<string, ExamStatusInfo[]>>({});

  useEffect(() => {
    fetch('/api/admin/inscriptions/exam-statuses')
      .then((res) => res.json())
      .then((data) => setExamStatuses(data.statuses ?? {}))
      .catch(() => setExamStatuses({}));
  }, [inscriptions]);

  const handleRowClick = (rowIndex: number) => {
    router.push(`/admin/clients/${rowIndex}`);
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

  const getExamens = (email: string): ExamStatusInfo[] => {
    return examStatuses[email.toLowerCase()] || [];
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
                Commercial
              </th>
              {showLieu && (
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Centre
                </th>
              )}
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Examen
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
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                  {ins.commercialNom || <span className="text-slate-300">—</span>}
                </td>
                {showLieu && (
                  <td className="px-4 py-3">
                    {ins.lieu ? (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${ins.lieu === 'Gagny' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {ins.lieu}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                )}
                <td className="px-4 py-3">
                  <ExamStatusBadges examens={getExamens(ins.email)} />
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
                  colSpan={showLieu ? 8 : 7}
                  className="px-4 py-12 text-center text-slate-400"
                >
                  Aucun client trouvé
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
            {ins.commercialNom && (
              <p className="text-xs text-slate-400">
                Commercial: {ins.commercialNom}
              </p>
            )}
            <div className="pt-1">
              <ExamStatusBadges examens={getExamens(ins.email)} />
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-xs text-slate-400">{ins.timestamp}</span>
              {showLieu && ins.lieu && (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${ins.lieu === 'Gagny' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                  {ins.lieu}
                </span>
              )}
            </div>
          </div>
        ))}
        {inscriptions.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            Aucun client trouvé
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
