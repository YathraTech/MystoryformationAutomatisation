'use client';

import { useState, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Pencil } from 'lucide-react';
import { Button, Checkbox } from '@/components/ui';
import {
  CIVILITES,
  MODES_FINANCEMENT,
  LANGUES,
  NIVEAUX,
  OBJECTIFS,
  JOURS_SEMAINE,
  CRENEAUX_HORAIRES,
} from '@/lib/utils/constants';
import { formatPrice, formatDate } from '@/lib/utils/format';
import type { InscriptionCompleteData } from '@/types';
import type { Formation } from '@/types/admin';

interface StepRecapProps {
  onGoToStep: (step: number) => void;
}

function RecapSection({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onEdit(step)}
          leftIcon={<Pencil className="h-3 w-3" />}
        >
          Modifier
        </Button>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function RecapRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 text-right">{value}</span>
    </div>
  );
}

function getLabel(
  options: readonly { value: string; label: string }[],
  value: string
): string {
  return options.find((o) => o.value === value)?.label || value;
}

export function StepRecap({ onGoToStep }: StepRecapProps) {
  const {
    watch,
    control,
    formState: { errors },
  } = useFormContext<InscriptionCompleteData>();

  const data = watch();

  const [formation, setFormation] = useState<Formation | null>(null);

  useEffect(() => {
    if (data.formationId) {
      fetch(`/api/public/formations`)
        .then((r) => r.json())
        .then((d) => {
          const f = (d.formations || []).find((f: Formation) => f.id === data.formationId);
          setFormation(f || null);
        })
        .catch(() => {});
    }
  }, [data.formationId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          Récapitulatif
        </h2>
        <p className="text-sm text-slate-500">
          Vérifiez vos informations avant de valider votre inscription.
        </p>
      </div>

      <div className="space-y-4">
        <RecapSection title="Informations personnelles" step={1} onEdit={onGoToStep}>
          <RecapRow label="Civilité" value={getLabel(CIVILITES, data.civilite)} />
          <RecapRow label="Nom" value={data.nom} />
          <RecapRow label="Prénom" value={data.prenom} />
          <RecapRow label="Email" value={data.email} />
          <RecapRow label="Téléphone" value={data.telephone} />
          <RecapRow
            label="Date de naissance"
            value={data.dateNaissance ? formatDate(data.dateNaissance) : ''}
          />
          <RecapRow label="Adresse" value={data.adresse} />
          <RecapRow label="Code postal" value={data.codePostal} />
          <RecapRow label="Ville" value={data.ville} />
        </RecapSection>

        <RecapSection title="Informations CPF" step={2} onEdit={onGoToStep}>
          <RecapRow label="N° CPF" value={data.numeroCPF || 'Non renseigné'} />
          <RecapRow
            label="N° Sécurité Sociale"
            value={data.numeroSecuriteSociale || 'Non renseigné'}
          />
          <RecapRow
            label="Financement"
            value={getLabel(MODES_FINANCEMENT, data.modeFinancement)}
          />
        </RecapSection>

        <RecapSection title="Formation choisie" step={3} onEdit={onGoToStep}>
          <RecapRow label="Langue" value={getLabel(LANGUES, data.langue)} />
          <RecapRow label="Niveau" value={getLabel(NIVEAUX, data.niveauActuel)} />
          <RecapRow label="Objectif" value={getLabel(OBJECTIFS, data.objectif)} />
          {formation && (
            <>
              <RecapRow label="Formation" value={formation.nom} />
              <RecapRow label="Durée" value={`${formation.dureeHeures}h`} />
              <RecapRow label="Prix" value={formatPrice(formation.prix)} />
            </>
          )}
        </RecapSection>

        <RecapSection title="Disponibilités" step={4} onEdit={onGoToStep}>
          <RecapRow
            label="Jours"
            value={
              data.joursDisponibles
                ?.map((j: string) => getLabel(JOURS_SEMAINE, j))
                .join(', ') || ''
            }
          />
          <RecapRow
            label="Créneaux"
            value={
              data.creneauxHoraires
                ?.map((c: string) => getLabel(CRENEAUX_HORAIRES, c))
                .join(', ') || ''
            }
          />
          <RecapRow
            label="Début souhaité"
            value={
              data.dateDebutSouhaitee ? formatDate(data.dateDebutSouhaitee) : ''
            }
          />
          {data.commentaires && (
            <RecapRow label="Commentaires" value={data.commentaires} />
          )}
        </RecapSection>
      </div>

      {/* Consentements */}
      <div className="space-y-4 pt-2">
        <Controller
          name="acceptCGU"
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onChange={field.onChange}
              error={errors.acceptCGU?.message}
              label={
                <>
                  J&apos;accepte les{' '}
                  <a
                    href="#"
                    className="text-blue-600 underline hover:text-blue-800"
                    target="_blank"
                  >
                    conditions générales d&apos;utilisation
                  </a>
                </>
              }
            />
          )}
        />

        <Controller
          name="acceptRGPD"
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onChange={field.onChange}
              error={errors.acceptRGPD?.message}
              label={
                <>
                  J&apos;accepte le{' '}
                  <a
                    href="#"
                    className="text-blue-600 underline hover:text-blue-800"
                    target="_blank"
                  >
                    traitement de mes données personnelles
                  </a>{' '}
                  conformément au RGPD
                </>
              }
            />
          )}
        />
      </div>
    </div>
  );
}
