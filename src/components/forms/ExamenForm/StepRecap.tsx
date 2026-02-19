'use client';

import { User, Mail, Phone, MapPin, AlertCircle, Globe, Building2, FileText } from 'lucide-react';
import type { ExamenFormData } from './index';
import { SOURCES_CONNAISSANCE, AGENCES } from './index';

interface StepRecapProps {
  data: ExamenFormData;
}

const CIVILITE_LABELS: Record<string, string> = {
  'M.': 'Monsieur',
  'Mme': 'Madame',
  'Autre': 'Autre',
};

function getLabel(options: { value: string; label: string }[], value: string): string {
  return options.find(o => o.value === value)?.label || value || '-';
}

export function StepRecap({ data }: StepRecapProps) {
  return (
    <div className="space-y-6">
      {/* Header avec icône d'alerte */}
      <div className="text-center pb-4 border-b border-slate-200">
        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="h-7 w-7 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Vérifiez les informations
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          L&apos;inscription n&apos;est pas encore créée. Vérifiez attentivement les informations ci-dessous avant de valider.
        </p>
      </div>

      <div className="space-y-4">
        {/* Informations personnelles */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            Informations personnelles
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-500">Civilité :</span>{' '}
              <span className="font-medium text-slate-800">
                {CIVILITE_LABELS[data.civilite] || data.civilite}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Nom :</span>{' '}
              <span className="font-medium text-slate-800">{data.nom}</span>
            </div>
            <div>
              <span className="text-slate-500">Prénom :</span>{' '}
              <span className="font-medium text-slate-800">{data.prenom}</span>
            </div>
            <div>
              <span className="text-slate-500">Date de naissance :</span>{' '}
              <span className="font-medium text-slate-800">
                {data.dateNaissance ? new Date(data.dateNaissance).toLocaleDateString('fr-FR') : '-'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Lieu de naissance :</span>{' '}
              <span className="font-medium text-slate-800">{data.lieuNaissance || '-'}</span>
            </div>
            <div>
              <span className="text-slate-500">Nationalité :</span>{' '}
              <span className="font-medium text-slate-800">{data.nationalite || '-'}</span>
            </div>
            <div>
              <span className="text-slate-500">Langue maternelle :</span>{' '}
              <span className="font-medium text-slate-800">{data.langueMaternelle || '-'}</span>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-600" />
            Contact
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium text-slate-800">{data.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium text-slate-800">{data.telephone}</span>
            </div>
          </div>
        </div>

        {/* Adresse */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            Adresse
          </h3>

          <div className="text-sm">
            <p className="font-medium text-slate-800">{data.adresse}</p>
            <p className="text-slate-600">{data.codePostal} {data.ville}</p>
          </div>
        </div>

        {/* Informations complémentaires */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-600" />
            Informations complémentaires
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-500">Agence :</span>{' '}
              <span className="font-medium text-slate-800">
                {getLabel(AGENCES, data.agence)}
              </span>
            </div>
            {data.pieceIdentite && (
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-500">Pièce d&apos;identité :</span>{' '}
                <span className="font-medium text-green-600">Fournie</span>
              </div>
            )}
            {data.sourceConnaissance && (
              <div>
                <span className="text-slate-500">Source :</span>{' '}
                <span className="font-medium text-slate-800">
                  {getLabel(SOURCES_CONNAISSANCE, data.sourceConnaissance)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Note info */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-sm text-amber-800">
            <strong>Prochaine étape :</strong> Après validation, un QR Code et un lien unique seront générés pour permettre au client de choisir son diplôme.
          </p>
        </div>
      </div>
    </div>
  );
}
