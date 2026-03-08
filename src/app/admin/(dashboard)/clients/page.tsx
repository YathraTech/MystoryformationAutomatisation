'use client';

import { useRef, useState } from 'react';
import { Upload, Download, CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useInscriptions } from '@/hooks/useInscriptions';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { downloadBlob } from '@/lib/utils/pdf-generator';
import InscriptionFilters from '@/components/admin/InscriptionFilters';
import InscriptionsTable from '@/components/admin/InscriptionsTable';

interface RowError {
  row: number;
  errors: string[];
}

interface ImportResult {
  imported: number;
  total: number;
  errorsCount: number;
  errors: RowError[];
  missingHeaders?: string[];
}

export default function InscriptionsPage() {
  const { role } = useAdminAuth();
  const isAdmin = role === 'admin';
  const {
    inscriptions,
    allCount,
    filteredCount,
    loading,
    error,
    page,
    totalPages,
    setPage,
    filters,
    updateFilter,
    formations,
    commercials,
    lieux,
    examTypes,
    examStatuses,
    refetch,
  } = useInscriptions();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/inscriptions?all=true');
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      const rows = (data.inscriptions ?? data).map((ins: Record<string, unknown>) => ({
        "Date d'inscription": ins.timestamp ?? '',
        'Civilité': ins.civilite ?? '',
        'Nom': ins.nom ?? '',
        'Prénom': ins.prenom ?? '',
        'Email': ins.email ?? '',
        'Téléphone': ins.telephone ?? '',
        'Date de naissance': ins.dateNaissance ?? '',
        'Adresse': ins.adresse ?? '',
        'Code postal': ins.codePostal ?? '',
        'Ville': ins.ville ?? '',
        'N° CPF': ins.numeroCPF ?? '',
        'N° Dossier CPF': ins.numeroDossierCPF ?? '',
        'N° Sécurité Sociale': ins.numeroSecuriteSociale ?? '',
        'Financement': ins.modeFinancement ?? '',
        'Langue': ins.langue ?? '',
        'Niveau': ins.niveauActuel ?? '',
        'Objectif': ins.objectif ?? '',
        'Formation': ins.formationNom ?? '',
        'Durée': ins.formationDuree ?? '',
        'Prix formation': ins.formationPrix ?? '',
        'Jours disponibles': ins.joursDisponibles ?? '',
        'Créneaux horaires': ins.creneauxHoraires ?? '',
        'Date début souhaitée': ins.dateDebutSouhaitee ?? '',
        'Statut': ins.statut ?? '',
        'Centre': ins.lieu ?? '',
        'Commercial': ins.commercialNom ?? '',
        'Commentaires': ins.commentaires ?? '',
        'Contacté': ins.badgeContacte ?? '',
        'Payé': ins.badgePaye ?? '',
        'Dossier': ins.badgeDossier ?? '',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Clients');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const date = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `clients_export_${date}.xlsx`);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);
    setImportError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/inscriptions/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setImportResult(data);
        if (data.imported > 0) refetch();
      } else {
        setImportError(data.error || 'Erreur lors de l\'import');
      }
    } catch {
      setImportError('Erreur réseau');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearImport = () => {
    setImportResult(null);
    setImportError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-3 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Clients</h1>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <Info className="h-4 w-4 text-slate-400 cursor-help" />
            <div className="absolute right-0 top-full mt-2 w-64 rounded-lg bg-slate-800 p-3 text-xs text-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <p className="font-semibold mb-1">Formats acceptés : .xlsx, .xls, .csv</p>
              <p className="text-slate-300">La ligne 1 doit contenir les en-têtes de colonnes (Date, Civilité, Nom, Prénom, Email, etc.)</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-60"
          >
            {exporting ? (
              <span className="h-4 w-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting ? 'Export en cours...' : 'Exporter'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-60"
          >
            {importing ? (
              <span className="h-4 w-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {importing ? 'Import en cours...' : 'Importer des clients'}
          </button>
        </div>
      </div>

      {/* Import error */}
      {importError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {importError}
          <button onClick={clearImport} className="ml-auto">
            <X className="h-4 w-4 opacity-60 hover:opacity-100" />
          </button>
        </div>
      )}

      {/* Import result */}
      {importResult && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {/* Summary */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Import terminé
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="text-green-600 font-medium">{importResult.imported} importée(s)</span>
                  {importResult.errorsCount > 0 && (
                    <>, <span className="text-red-600 font-medium">{importResult.errorsCount} erreur(s)</span></>
                  )}
                  {' '}sur {importResult.total} ligne(s)
                </p>
              </div>
            </div>
            <button onClick={clearImport}>
              <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
            </button>
          </div>

          {/* Missing headers warning */}
          {importResult.missingHeaders && importResult.missingHeaders.length > 0 && (
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 text-xs text-amber-700">
              <span className="font-semibold">Colonnes manquantes : </span>
              {importResult.missingHeaders.join(', ')}
            </div>
          )}

          {/* Errors detail */}
          {importResult.errors.length > 0 && (
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
              {importResult.errors.map((rowErr) => (
                <div key={rowErr.row} className="px-4 py-3 hover:bg-slate-50">
                  <p className="text-xs font-semibold text-red-700 mb-1">
                    Ligne {rowErr.row}
                  </p>
                  <ul className="space-y-0.5">
                    {rowErr.errors.map((err, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <span className="text-red-400 mt-0.5 shrink-0">-</span>
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <InscriptionFilters
        filters={filters}
        onFilterChange={updateFilter}
        formations={formations}
        commercials={commercials}
        lieux={lieux}
        examTypes={examTypes}
        totalCount={allCount}
        filteredCount={filteredCount}
      />

      <InscriptionsTable
        inscriptions={inscriptions}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onUpdated={refetch}
        showLieu={isAdmin}
        examStatuses={examStatuses}
      />
    </div>
  );
}
