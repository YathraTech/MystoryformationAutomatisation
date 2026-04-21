'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Clock, BadgeEuro, BookOpen } from 'lucide-react';
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
  const [loadError, setLoadError] = useState<string | null>(null);

  const selectedFormationId = watch('formationId');
  const selectedLangue = watch('langue');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/public/formations')
      .then((res) => {
        if (!res.ok) throw new Error('Erreur réseau');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setFormations(data.formations || []);
        setLoadingFormations(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError('Impossible de charger les formations. Veuillez réessayer.');
        setLoadingFormations(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredFormations = useMemo(() => {
    if (!selectedLangue) return formations;
    return formations.filter((f) => f.langue === selectedLangue);
  }, [formations, selectedLangue]);

  // Si la formation sélectionnée ne correspond plus à la langue choisie, on la retire
  useEffect(() => {
    if (!selectedFormationId || !selectedLangue) return;
    const stillValid = filteredFormations.some((f) => f.id === selectedFormationId);
    if (!stillValid) {
      setValue('formationId', '', { shouldValidate: false });
    }
  }, [selectedFormationId, selectedLangue, filteredFormations, setValue]);

  const handleFormationSelect = (formationId: string) => {
    setValue('formationId', formationId, { shouldValidate: true });
  };

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

          {loadingFormations ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-6 w-6 border-2 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
            </div>
          ) : loadError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {loadError}
            </div>
          ) : filteredFormations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border border-slate-200 bg-slate-50">
              <div className="rounded-full bg-slate-100 p-3 mb-3">
                <BookOpen className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600">
                {selectedLangue
                  ? "Aucune formation disponible pour cette langue."
                  : "Aucune formation disponible pour le moment."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFormations.map((formation) => (
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
                      {formation.description && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formation.description}
                        </p>
                      )}
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
          )}

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
