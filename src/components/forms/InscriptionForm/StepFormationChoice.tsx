'use client';

import { useState, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Clock, BadgeEuro } from 'lucide-react';
import { Select, RadioGroup, Card } from '@/components/ui';
import {
  LANGUES,
  NIVEAUX,
  OBJECTIFS,
} from '@/lib/utils/constants';
import { formatPrice } from '@/lib/utils/format';
import type { InscriptionCompleteData } from '@/types';
import type { Formation } from '@/types/admin';

export function StepFormationChoice() {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<InscriptionCompleteData>();

  const [formations, setFormations] = useState<Formation[]>([]);
  const [loadingFormations, setLoadingFormations] = useState(true);

  const selectedFormationId = watch('formationId');

  useEffect(() => {
    fetch('/api/public/formations')
      .then((res) => res.json())
      .then((data) => setFormations(data.formations || []))
      .catch(() => {})
      .finally(() => setLoadingFormations(false));
  }, []);

  const handleFormationSelect = (formationId: string) => {
    setValue('formationId', formationId, { shouldValidate: true });
  };

  if (loadingFormations) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-6 w-6 border-2 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          Choix de formation
        </h2>
        <p className="text-sm text-slate-500">
          Sélectionnez la formation qui vous convient.
        </p>
      </div>

      <div className="space-y-5">
        <Select
          label="Langue"
          placeholder="Sélectionnez une langue"
          options={LANGUES}
          error={errors.langue?.message}
          {...register('langue')}
        />

        <Controller
          name="niveauActuel"
          control={control}
          render={({ field }) => (
            <RadioGroup
              label="Votre niveau actuel"
              options={NIVEAUX}
              value={field.value || ''}
              onChange={field.onChange}
              error={errors.niveauActuel?.message}
              columns={2}
            />
          )}
        />

        <Controller
          name="objectif"
          control={control}
          render={({ field }) => (
            <RadioGroup
              label="Votre objectif"
              options={OBJECTIFS}
              value={field.value || ''}
              onChange={field.onChange}
              error={errors.objectif?.message}
              columns={2}
            />
          )}
        />

        {/* Formations */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-700">
            Formation
          </p>
          <div className="space-y-3">
            {formations.map((formation) => (
              <Card
                key={formation.id}
                selected={selectedFormationId === formation.id}
                onClick={() => handleFormationSelect(formation.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {formation.nom}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formation.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formation.dureeHeures}h
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-blue-700">
                      <BadgeEuro className="h-3.5 w-3.5" />
                      {formatPrice(formation.prix)}
                    </span>
                  </div>
                </div>
                {formation.eligibleCpf && (
                  <span className="mt-2 inline-block rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700 border border-green-200">
                    Eligible CPF
                  </span>
                )}
              </Card>
            ))}
          </div>
          {errors.formationId?.message && (
            <p className="text-xs text-red-500" role="alert">
              {errors.formationId.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
