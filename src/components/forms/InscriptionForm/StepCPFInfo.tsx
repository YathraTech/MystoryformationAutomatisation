'use client';

import { useFormContext } from 'react-hook-form';
import { Input, Select, Alert } from '@/components/ui';
import { MODES_FINANCEMENT } from '@/lib/utils/constants';
import type { InscriptionCompleteData } from '@/types';

export function StepCPFInfo() {
  const {
    register,
    formState: { errors },
  } = useFormContext<InscriptionCompleteData>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          Informations CPF
        </h2>
        <p className="text-sm text-slate-500">
          Ces informations sont nécessaires pour le financement de votre formation.
        </p>
      </div>

      <Alert variant="info" title="Où trouver ces informations ?">
        <ul className="mt-1 space-y-1 text-xs">
          <li>
            <strong>Numéro CPF :</strong> connectez-vous sur{' '}
            <span className="font-medium">moncompteformation.gouv.fr</span>, rubrique
            &quot;Mon compte&quot;.
          </li>
          <li>
            <strong>N° Sécurité Sociale :</strong> visible sur votre carte Vitale
            ou attestation de droits.
          </li>
        </ul>
      </Alert>

      <div className="space-y-4">
        <Input
          label="Numéro CPF (optionnel)"
          placeholder="14 ou 15 chiffres"
          error={errors.numeroCPF?.message}
          {...register('numeroCPF')}
        />

        <Input
          label="Numéro de sécurité sociale (optionnel)"
          placeholder="15 chiffres"
          error={errors.numeroSecuriteSociale?.message}
          {...register('numeroSecuriteSociale')}
        />

        <Select
          label="Mode de financement"
          placeholder="Sélectionnez un mode de financement"
          options={MODES_FINANCEMENT}
          error={errors.modeFinancement?.message}
          {...register('modeFinancement')}
        />
      </div>
    </div>
  );
}
