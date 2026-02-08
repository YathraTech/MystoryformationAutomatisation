'use client';

import { User, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import type { ExamenFormData } from './index';

interface StepRecapProps {
  data: ExamenFormData;
}

const CIVILITE_LABELS: Record<string, string> = {
  'M.': 'Monsieur',
  'Mme': 'Madame',
  'Autre': 'Autre',
};

export function StepRecap({ data }: StepRecapProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          Récapitulatif
        </h2>
        <p className="text-sm text-slate-500">
          Vérifiez les informations avant de valider l&apos;inscription.
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

        {/* Note */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-sm text-amber-800">
            <strong>Note :</strong> Après validation, un lien unique sera généré pour permettre au client de choisir son diplôme souhaité.
          </p>
        </div>
      </div>
    </div>
  );
}
