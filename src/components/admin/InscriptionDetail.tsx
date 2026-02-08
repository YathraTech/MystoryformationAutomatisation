'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  Calendar,
  Clock,
  CreditCard,
  FileText,
  ChevronDown,
  GraduationCap,
  Pencil,
  Check,
  X,
  Save,
  RefreshCw,
} from 'lucide-react';
import type { Inscription, Formation } from '@/types/admin';
import type { Examen, ExamenResultat } from '@/lib/data/examens';
import {
  CIVILITES,
  MODES_FINANCEMENT,
  LANGUES,
  NIVEAUX,
  OBJECTIFS,
} from '@/lib/utils/constants';
import StatusSelect from './StatusSelect';
import RelanceButton from './RelanceButton';

interface InscriptionDetailProps {
  id: string;
}

type EditableFields = Partial<Omit<Inscription, 'rowIndex' | 'clientId' | 'statut' | 'relanceDate' | 'relanceNote' | 'badgeContacte' | 'badgePaye' | 'badgeDossier'>> & {
  formationId?: string;
};

type SelectOption = { value: string; label: string };

// Mapping des champs vers leurs options de liste déroulante
const SELECT_OPTIONS: Record<string, readonly SelectOption[]> = {
  civilite: CIVILITES,
  modeFinancement: MODES_FINANCEMENT,
  langue: LANGUES,
  niveauActuel: NIVEAUX,
  objectif: OBJECTIFS,
};

// Labels pour les diplômes
const DIPLOME_LABELS: Record<string, string> = {
  A1: 'Diplôme A1',
  A2: 'Diplôme A2',
  B1: 'Diplôme B1',
  B2: 'Diplôme B2',
  carte_pluriannuelle: 'Carte de séjour pluriannuelle',
  carte_residence: 'Carte de résident',
  naturalisation: 'Naturalisation',
};

// Labels et couleurs pour les résultats d'examen
const RESULTAT_CONFIG: Record<ExamenResultat, { label: string; bg: string; text: string }> = {
  a_venir: { label: 'À venir', bg: 'bg-blue-100', text: 'text-blue-700' },
  reussi: { label: 'Réussi', bg: 'bg-green-100', text: 'text-green-700' },
  echoue: { label: 'Échoué', bg: 'bg-red-100', text: 'text-red-700' },
};

// Helper pour obtenir le label d'une valeur dans une liste
function getLabel(options: readonly SelectOption[], value: string): string {
  return options.find((o) => o.value === value)?.label || value;
}

interface EditableFieldProps {
  icon: React.ElementType;
  label: string;
  value: string;
  fieldKey: keyof EditableFields;
  editingField: string | null;
  editedValues: EditableFields;
  onStartEdit: (key: string) => void;
  onCancelEdit: () => void;
  onConfirmEdit: () => void;
  onValueChange: (key: keyof EditableFields, value: string) => void;
}

function EditableField({
  icon: Icon,
  label,
  value,
  fieldKey,
  editingField,
  editedValues,
  onStartEdit,
  onCancelEdit,
  onConfirmEdit,
  onValueChange,
}: EditableFieldProps) {
  const isEditing = editingField === fieldKey;
  const currentValue = editedValues[fieldKey] ?? value;
  const selectOptions = SELECT_OPTIONS[fieldKey];
  const isSelect = !!selectOptions;

  // Afficher le label pour les champs select
  const displayValue = isSelect && currentValue
    ? getLabel(selectOptions, currentValue)
    : currentValue;

  return (
    <div className="flex items-start gap-3 py-2 group">
      <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        {isEditing ? (
          <div className="flex items-center gap-2 mt-1">
            {isSelect ? (
              <select
                value={currentValue || ''}
                onChange={(e) => onValueChange(fieldKey, e.target.value)}
                className="flex-1 text-sm text-slate-800 border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                autoFocus
              >
                <option value="">-- Sélectionner --</option>
                {selectOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={currentValue || ''}
                onChange={(e) => onValueChange(fieldKey, e.target.value)}
                className="flex-1 text-sm text-slate-800 border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                autoFocus
              />
            )}
            <button
              onClick={onConfirmEdit}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Confirmer"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={onCancelEdit}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Annuler"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-800">{displayValue || '-'}</p>
            <button
              onClick={() => onStartEdit(fieldKey)}
              className="p-1 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title="Modifier"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, icon: Icon, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
      >
        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Icon className="h-4 w-4 text-blue-600" />
          {title}
        </h2>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
        />
      </button>
      <div
        className={`grid transition-all duration-200 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 divide-y divide-slate-100">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InscriptionDetail({ id }: InscriptionDetailProps) {
  const router = useRouter();
  const [inscription, setInscription] = useState<Inscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<EditableFields>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Formations dynamiques
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loadingFormations, setLoadingFormations] = useState(false);
  const [selectedFormationId, setSelectedFormationId] = useState<string>('');
  const [editingFormation, setEditingFormation] = useState(false);

  // Examens liés au client
  const [examens, setExamens] = useState<Examen[]>([]);
  const [loadingExamens, setLoadingExamens] = useState(false);

  const fetchFormations = useCallback(async () => {
    setLoadingFormations(true);
    try {
      const res = await fetch('/api/public/formations');
      if (res.ok) {
        const data = await res.json();
        setFormations(data);
      }
    } catch {
      console.error('Erreur chargement formations');
    } finally {
      setLoadingFormations(false);
    }
  }, []);

  const fetchExamens = useCallback(async (clientId: number | null | undefined, email: string) => {
    if (!clientId && !email) {
      setExamens([]);
      return;
    }
    setLoadingExamens(true);
    try {
      // Utiliser clientId si disponible, sinon email
      const identifier = clientId || encodeURIComponent(email);
      const res = await fetch(`/api/admin/clients/${identifier}/examens`);
      if (res.ok) {
        const data = await res.json();
        setExamens(data.examens || []);
      }
    } catch {
      console.error('Erreur chargement examens');
    } finally {
      setLoadingExamens(false);
    }
  }, []);

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/admin/inscriptions/${id}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setInscription(data.inscription);
      setSelectedFormationId(data.inscription.formationId || '');
      setEditedValues({});
      setHasChanges(false);
      setEditingFormation(false);

      // Charger les examens liés au client
      fetchExamens(data.inscription.clientId, data.inscription.email);
    } catch {
      setError('Inscription non trouvée');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    fetchFormations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStartEdit = (key: string) => {
    setEditingField(key);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
  };

  const handleConfirmEdit = () => {
    setEditingField(null);
    setHasChanges(Object.keys(editedValues).length > 0);
  };

  const handleValueChange = (key: keyof EditableFields, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges || Object.keys(editedValues).length === 0) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/inscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: editedValues }),
      });

      if (res.ok) {
        await fetchDetail();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAll = () => {
    setEditedValues({});
    setEditingField(null);
    setHasChanges(false);
    // Réinitialiser formation
    if (inscription) {
      setSelectedFormationId(inscription.formationId || '');
    }
    setEditingFormation(false);
  };

  const handleStartEditFormation = () => {
    setEditingFormation(true);
  };

  const handleFormationChange = (formationId: string) => {
    setSelectedFormationId(formationId);
    setHasChanges(true);

    // Mettre à jour les valeurs éditées avec les infos de la formation
    const formation = formations.find(f => f.id === formationId);
    if (formation) {
      setEditedValues(prev => ({
        ...prev,
        formationId: formation.id,
        formationNom: formation.nom,
        formationDuree: `${formation.dureeHeures}h`,
        formationPrix: `${formation.prix}€`,
        langue: formation.langue,
      }));
    }
  };

  const handleConfirmFormationEdit = () => {
    setEditingFormation(false);
  };

  const fieldProps = {
    editingField,
    editedValues,
    onStartEdit: handleStartEdit,
    onCancelEdit: handleCancelEdit,
    onConfirmEdit: handleConfirmEdit,
    onValueChange: handleValueChange,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-3 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !inscription) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">{error || 'Inscription non trouvée'}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-blue-700 hover:underline"
        >
          Retour
        </button>
      </div>
    );
  }

  const displayValue = (key: keyof EditableFields) => {
    const val = editedValues[key] ?? (inscription[key as keyof Inscription] as string) ?? '';
    // Si c'est un champ select, afficher le label
    const opts = SELECT_OPTIONS[key];
    if (opts && val) {
      return getLabel(opts, val);
    }
    return val;
  };

  const rawValue = (key: keyof EditableFields) => {
    return editedValues[key] ?? (inscription[key as keyof Inscription] as string) ?? '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-slate-800">
                {displayValue('civilite')} {rawValue('prenom')} {rawValue('nom')}
              </h1>
              {/* Email & Phone - discrets et cliquables */}
              <div className="flex items-center gap-2">
                {rawValue('email') && (
                  <a
                    href={`mailto:${rawValue('email')}`}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 transition-colors"
                    title={rawValue('email')}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{rawValue('email')}</span>
                  </a>
                )}
                {rawValue('telephone') && (
                  <a
                    href={`tel:${rawValue('telephone')}`}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 transition-colors"
                    title={rawValue('telephone')}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{rawValue('telephone')}</span>
                  </a>
                )}
                {/* Bouton Passer l'examen */}
                <button
                  className="flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-red-600 transition-[background-color] duration-500 ease-in-out"
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  Passer l'examen
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-500">
              Inscrit le {new Date(inscription.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusSelect
            currentStatus={inscription.statut}
            rowIndex={inscription.rowIndex}
            onUpdated={fetchDetail}
          />
          <RelanceButton rowIndex={inscription.rowIndex} onDone={fetchDetail} />
        </div>
      </div>

      {/* Boutons Sauvegarder / Annuler */}
      {hasChanges && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <span className="text-sm text-amber-700 flex-1">
            Vous avez des modifications non sauvegardées
          </span>
          <button
            onClick={handleCancelAll}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <X className="h-4 w-4" />
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {saving ? (
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Sauvegarder
          </button>
        </div>
      )}

      {/* Sections repliables */}
      <div className="space-y-4">
        {/* Informations personnelles */}
        <CollapsibleSection title="Informations personnelles" icon={User}>
          <EditableField icon={User} label="Civilité" value={inscription.civilite} fieldKey="civilite" {...fieldProps} />
          <EditableField icon={User} label="Nom" value={inscription.nom} fieldKey="nom" {...fieldProps} />
          <EditableField icon={User} label="Prénom" value={inscription.prenom} fieldKey="prenom" {...fieldProps} />
          <EditableField icon={Mail} label="Email" value={inscription.email} fieldKey="email" {...fieldProps} />
          <EditableField icon={Phone} label="Téléphone" value={inscription.telephone} fieldKey="telephone" {...fieldProps} />
          <EditableField icon={Calendar} label="Date de naissance" value={inscription.dateNaissance} fieldKey="dateNaissance" {...fieldProps} />
          <EditableField icon={MapPin} label="Adresse" value={inscription.adresse} fieldKey="adresse" {...fieldProps} />
          <EditableField icon={MapPin} label="Code postal" value={inscription.codePostal} fieldKey="codePostal" {...fieldProps} />
          <EditableField icon={MapPin} label="Ville" value={inscription.ville} fieldKey="ville" {...fieldProps} />
        </CollapsibleSection>

        {/* CPF & Financement */}
        <CollapsibleSection title="CPF & Financement" icon={CreditCard}>
          <EditableField icon={CreditCard} label="Numéro CPF" value={inscription.numeroCPF} fieldKey="numeroCPF" {...fieldProps} />
          <EditableField icon={FileText} label="Numéro Sécurité Sociale" value={inscription.numeroSecuriteSociale} fieldKey="numeroSecuriteSociale" {...fieldProps} />
          <EditableField icon={CreditCard} label="Mode de financement" value={inscription.modeFinancement} fieldKey="modeFinancement" {...fieldProps} />
        </CollapsibleSection>

        {/* Formation */}
        <CollapsibleSection title="Formation" icon={BookOpen} defaultOpen>
          {/* Sélecteur de formation */}
          <div className="flex items-start gap-3 py-3 group border-b border-slate-100">
            <BookOpen className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 mb-1">Formation actuelle</p>
              {editingFormation ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedFormationId}
                      onChange={(e) => handleFormationChange(e.target.value)}
                      disabled={loadingFormations}
                      className="flex-1 text-sm text-slate-800 border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                    >
                      <option value="">-- Sélectionner une formation --</option>
                      {formations.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nom} ({f.dureeHeures}h - {f.prix}€)
                        </option>
                      ))}
                    </select>
                    {loadingFormations && (
                      <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleConfirmFormationEdit}
                      className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <Check className="h-3 w-3 inline mr-1" />
                      Confirmer
                    </button>
                    <button
                      onClick={() => {
                        setEditingFormation(false);
                        if (inscription) {
                          setSelectedFormationId(inscription.formationId || '');
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <X className="h-3 w-3 inline mr-1" />
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {editedValues.formationNom || inscription.formationNom || '-'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {editedValues.formationDuree || inscription.formationDuree} • {editedValues.formationPrix || inscription.formationPrix}
                    </p>
                  </div>
                  <button
                    onClick={handleStartEditFormation}
                    className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Changer de formation"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Autres champs de formation */}
          <EditableField icon={BookOpen} label="Langue" value={inscription.langue} fieldKey="langue" {...fieldProps} />
          <EditableField icon={BookOpen} label="Niveau actuel" value={inscription.niveauActuel} fieldKey="niveauActuel" {...fieldProps} />
          <EditableField icon={BookOpen} label="Objectif" value={inscription.objectif} fieldKey="objectif" {...fieldProps} />
        </CollapsibleSection>

        {/* Disponibilités du client */}
        <CollapsibleSection title="Disponibilités souhaitées" icon={Calendar}>
          <EditableField icon={Calendar} label="Jours disponibles" value={inscription.joursDisponibles} fieldKey="joursDisponibles" {...fieldProps} />
          <EditableField icon={Clock} label="Créneaux horaires" value={inscription.creneauxHoraires} fieldKey="creneauxHoraires" {...fieldProps} />
          <EditableField icon={Calendar} label="Date de début souhaitée" value={inscription.dateDebutSouhaitee} fieldKey="dateDebutSouhaitee" {...fieldProps} />
        </CollapsibleSection>

        {/* Commentaires */}
        <CollapsibleSection title="Commentaires" icon={FileText}>
          <EditableField icon={FileText} label="Commentaires" value={inscription.commentaires} fieldKey="commentaires" {...fieldProps} />
        </CollapsibleSection>
      </div>

      {/* Relance */}
      {(inscription.relanceDate || inscription.relanceNote) && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
          <h2 className="text-sm font-semibold text-blue-800 mb-3">
            Dernière relance
          </h2>
          {inscription.relanceDate && (
            <p className="text-xs text-blue-600 mb-1">
              {inscription.relanceDate}
            </p>
          )}
          {inscription.relanceNote && (
            <p className="text-sm text-blue-700">{inscription.relanceNote}</p>
          )}
        </div>
      )}

      {/* Section Examens */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-purple-600" />
            Examens du client
            {loadingExamens && (
              <RefreshCw className="h-3 w-3 text-slate-400 animate-spin" />
            )}
          </h2>
        </div>

        <div className="p-5">
          {examens.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              {loadingExamens ? 'Chargement...' : 'Aucun examen trouvé pour ce client'}
            </p>
          ) : (
            <div className="space-y-3">
              {examens.map((examen) => {
                const resultatConfig = RESULTAT_CONFIG[examen.resultat];
                return (
                  <div
                    key={examen.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-800">
                          {examen.diplome ? DIPLOME_LABELS[examen.diplome] || examen.diplome : 'Diplôme non sélectionné'}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${resultatConfig.bg} ${resultatConfig.text}`}>
                          {resultatConfig.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Inscrit le {new Date(examen.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-xs text-slate-400">
                      #{examen.id}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
