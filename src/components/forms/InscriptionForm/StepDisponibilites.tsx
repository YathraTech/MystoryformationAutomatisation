'use client';

import { useFormContext, Controller } from 'react-hook-form';
import { CheckboxGroup, DatePicker, Textarea } from '@/components/ui';
import { JOURS_SEMAINE, CRENEAUX_HORAIRES } from '@/lib/utils/constants';
import type { InscriptionCompleteData } from '@/types';

export function StepDisponibilites() {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<InscriptionCompleteData>();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          Vos disponibilités
        </h2>
        <p className="text-sm text-slate-500">
          Indiquez vos préférences pour planifier au mieux votre formation.
        </p>
      </div>

      <div className="space-y-5">
        <Controller
          name="joursDisponibles"
          control={control}
          defaultValue={[]}
          render={({ field }) => (
            <CheckboxGroup
              label="Jours disponibles"
              options={JOURS_SEMAINE}
              values={field.value}
              onChange={field.onChange}
              error={errors.joursDisponibles?.message}
              columns={3}
            />
          )}
        />

        <Controller
          name="creneauxHoraires"
          control={control}
          defaultValue={[]}
          render={({ field }) => (
            <CheckboxGroup
              label="Créneaux horaires préférés"
              options={CRENEAUX_HORAIRES}
              values={field.value}
              onChange={field.onChange}
              error={errors.creneauxHoraires?.message}
              columns={3}
            />
          )}
        />

        <DatePicker
          label="Date de début souhaitée"
          minDate={minDate}
          error={errors.dateDebutSouhaitee?.message}
          {...register('dateDebutSouhaitee')}
        />

        <Textarea
          label="Commentaires (optionnel)"
          placeholder="Précisez vos besoins, contraintes ou questions..."
          maxLength={500}
          showCount
          value={watch('commentaires') || ''}
          error={errors.commentaires?.message}
          {...register('commentaires')}
        />
      </div>
    </div>
  );
}
