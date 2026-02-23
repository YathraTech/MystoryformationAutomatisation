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
  Download,
  RotateCcw,
  Copy,
  Archive,
  Trash2,
} from 'lucide-react';
import type { Inscription, Formation, ExamOption } from '@/types/admin';
import type { Examen, ExamenResultat, MoyenPaiement, TypeExamen } from '@/lib/data/examens';
import {
  CIVILITES,
  MODES_FINANCEMENT,
  LANGUES,
  NIVEAUX,
  OBJECTIFS,
} from '@/lib/utils/constants';
import StatusSelect from './StatusSelect';
import RelanceButton from './RelanceButton';
import { generateAttestationPaiement, generateFicheInscription, generateConvocation } from '@/lib/utils/pdf-generator';

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

// Labels pour les types d'examens souhaités
const EXAM_TYPE_LABELS: Record<string, string> = {
  'TEF_IRN': 'TEF IRN',
  'CIVIQUE': 'Examen Civique',
};

// Fonction helper pour obtenir le label d'un diplôme à partir des options dynamiques
// Supporte le nouveau format TYPE_CODE:OPTION_CODE
function getDiplomeLabel(options: ExamOption[], code: string | null): string {
  if (!code) return 'Diplôme non sélectionné';

  // Check for new format TYPE_CODE:OPTION_CODE
  const parts = code.split(':');
  if (parts.length === 2) {
    const typeCode = parts[0];
    const optionCode = parts[1];
    const typeName = EXAM_TYPE_LABELS[typeCode] || typeCode;
    const option = options.find((o) => o.code === optionCode);
    const optionName = option?.label || optionCode;
    return `${typeName} - ${optionName}`;
  }

  // Old format - just the option code
  const option = options.find((o) => o.code === code);
  return option?.label || code;
}

// Labels et couleurs pour les résultats d'examen
const RESULTAT_CONFIG: Record<ExamenResultat, { label: string; bg: string; text: string }> = {
  a_venir: { label: 'À venir', bg: 'bg-blue-100', text: 'text-blue-700' },
  reussi: { label: 'Réussi', bg: 'bg-green-100', text: 'text-green-700' },
  echoue: { label: 'Échoué', bg: 'bg-red-100', text: 'text-red-700' },
};

// Options pour les moyens de paiement
const MOYENS_PAIEMENT: { value: MoyenPaiement; label: string }[] = [
  { value: 'carte_bancaire', label: 'Carte bancaire' },
  { value: 'lien_paiement', label: 'Lien de paiement' },
  { value: 'especes', label: 'Espèces' },
  { value: 'autre', label: 'Autre' },
];

// Options pour les types d'examen
const TYPES_EXAMEN: { value: TypeExamen; label: string }[] = [
  { value: 'TEF IRN', label: 'TEF IRN' },
  { value: 'Civique', label: 'Civique' },
  { value: 'PrepMyFuture', label: 'PrepMyFuture' },
];

// Interface pour le staff (profiles table uses UUIDs)
interface StaffMember {
  id: string;
  nom: string;
  prenom: string;
  role: string;
  lieu: string;
}

// Helper pour obtenir le label d'une valeur dans une liste
function getLabel(options: readonly SelectOption[], value: string): string {
  return options.find((o) => o.value === value)?.label || value;
}

// Interface pour les créneaux d'examen avec places disponibles
interface ExamenSlot {
  date: string;
  count: number;
  maxPlaces: number;
  jour: string;
  heure?: string;
  label?: string;
}

interface ExamenDateOption {
  value: string; // format YYYY-MM-DD
  label: string;
  heure: string; // heure par défaut
  jour: string;
  count: number;
  maxPlaces: number;
}

// Noms des mois en français
const MOIS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
];

function formatExamenDateOptions(slots: ExamenSlot[]): ExamenDateOption[] {
  return slots.map(slot => {
    // Parser la date directement depuis la chaîne YYYY-MM-DD
    const [, month, day] = slot.date.split('-').map(Number);
    // Formater manuellement sans passer par Date pour éviter les problèmes de timezone
    const moisLabel = MOIS_FR[month - 1];
    // Capitalize first letter of jour
    const jourLabel = slot.jour.charAt(0).toUpperCase() + slot.jour.slice(1);
    // Use slot label if available, otherwise derive from heure
    const heure = slot.heure || (slot.jour === 'lundi' ? '14:00' : '09:00');
    const momentLabel = slot.label || (parseInt(heure.split(':')[0]) < 12 ? 'matin' : 'après-midi');

    return {
      value: slot.date,
      label: `${jourLabel} ${day} ${moisLabel} (${momentLabel})`,
      heure,
      jour: slot.jour,
      count: slot.count,
      maxPlaces: slot.maxPlaces,
    };
  });
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

  // Staff members pour le formateur
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);

  // Créneaux d'examens disponibles (avec places) - fallback général
  const [examenSlots, setExamenSlots] = useState<ExamenSlot[]>([]);

  // Créneaux spécifiques au diplôme de l'examen en cours d'édition
  const [editingExamenSlots, setEditingExamenSlots] = useState<ExamenSlot[]>([]);

  // Options d'examen dynamiques (pour les labels)
  const [examOptions, setExamOptions] = useState<ExamOption[]>([]);

  // Edition d'examen
  const [editingExamenId, setEditingExamenId] = useState<number | null>(null);
  const [examenForm, setExamenForm] = useState({
    prix: '',
    moyenPaiement: '' as MoyenPaiement | '',
    formateurId: '' as string,
    commercialId: '' as string,
    typeExamen: '' as TypeExamen | '',
    lieu: '',
    dateExamen: '',
    heureExamen: '',
    remises: '',
    remiseType: 'euro' as 'euro' | 'pourcentage',
    remiseValeur: '',
    distanciel: false,
    datePaiement: '',
    lieuConfiguration: '',
  });
  const [savingExamen, setSavingExamen] = useState(false);
  const [resendingLinkId, setResendingLinkId] = useState<number | null>(null);

  // Fonction pour renvoyer le lien de choix de diplôme
  const handleResendLink = async (examenId: number, resetChoice: boolean = false) => {
    if (!confirm(
      resetChoice
        ? 'Voulez-vous réinitialiser le choix de diplôme et renvoyer le lien au client ?'
        : 'Voulez-vous renvoyer le lien de choix de diplôme au client ?'
    )) {
      return;
    }

    setResendingLinkId(examenId);
    try {
      const res = await fetch(`/api/admin/examens/${examenId}/resend-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetChoice }),
      });

      if (res.ok) {
        const data = await res.json();
        // Copier le lien dans le presse-papier
        await navigator.clipboard.writeText(data.clientUrl);
        alert(`Lien copié dans le presse-papier !\n\nLien: ${data.clientUrl}\nEmail: ${data.email}\n\n${data.message}`);

        // Recharger les examens si le choix a été réinitialisé
        if (resetChoice && inscription) {
          await fetchExamens(inscription.clientId, inscription.email);
        }
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Erreur lors de l\'envoi');
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setResendingLinkId(null);
    }
  };

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/staff');
      if (res.ok) {
        const data = await res.json();
        // API returns array directly, not { staff: [] }
        setStaffMembers(Array.isArray(data) ? data : []);
      }
    } catch {
      console.error('Erreur chargement staff');
    }
  }, []);

  const fetchExamenSlots = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/examens/slots');
      if (res.ok) {
        const data = await res.json();
        setExamenSlots(data.slots || []);
      }
    } catch {
      console.error('Erreur chargement créneaux examens');
    }
  }, []);

  const fetchExamOptions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/exam-options');
      if (res.ok) {
        const data = await res.json();
        setExamOptions(data.options || []);
      }
    } catch {
      console.error('Erreur chargement options examens');
    }
  }, []);

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
    fetchStaff();
    fetchExamenSlots();
    fetchExamOptions();
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

  // Charger les créneaux spécifiques au diplôme
  const fetchDiplomeSlots = useCallback(async (diplomeCode: string | null) => {
    if (!diplomeCode) {
      // Si pas de diplôme, utiliser les créneaux généraux
      setEditingExamenSlots(examenSlots);
      return;
    }

    try {
      const res = await fetch(`/api/admin/exam-options/by-code/${encodeURIComponent(diplomeCode)}/slots`);
      if (res.ok) {
        const data = await res.json();
        setEditingExamenSlots(data.slots || []);
      } else {
        // Fallback aux créneaux généraux
        setEditingExamenSlots(examenSlots);
      }
    } catch {
      // Fallback aux créneaux généraux
      setEditingExamenSlots(examenSlots);
    }
  }, [examenSlots]);

  // Fonctions d'édition d'examen
  const startEditExamen = async (examen: Examen) => {
    // Définir l'ID de l'examen en cours d'édition
    setEditingExamenId(examen.id);

    // Charger les créneaux spécifiques au diplôme de cet examen
    await fetchDiplomeSlots(examen.diplome);

    // Dériver l'heure à partir de la date si elle n'est pas définie
    let derivedHeure = examen.heureExamen || '';
    if (examen.dateExamen && !examen.heureExamen) {
      const date = new Date(examen.dateExamen);
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 1) derivedHeure = '14:00'; // Lundi après-midi
      else if (dayOfWeek === 5) derivedHeure = '09:00'; // Vendredi matin
    }

    // Charger les données de CET examen spécifique
    setExamenForm({
      prix: examen.prix?.toString() || '',
      moyenPaiement: examen.moyenPaiement || '',
      formateurId: examen.formateurId || '',
      commercialId: examen.commercialId || '',
      typeExamen: examen.typeExamen || '',
      lieu: examen.lieu || '',
      dateExamen: examen.dateExamen || '',
      heureExamen: derivedHeure,
      remises: examen.remises || '',
      remiseType: 'euro',
      remiseValeur: '',
      distanciel: examen.distanciel || false,
      datePaiement: examen.datePaiement || '',
      lieuConfiguration: examen.lieuConfiguration || '',
    });
  };

  const cancelEditExamen = () => {
    setEditingExamenId(null);
    setEditingExamenSlots([]);
    setExamenForm({
      prix: '',
      moyenPaiement: '',
      formateurId: '',
      commercialId: '',
      typeExamen: '',
      lieu: '',
      dateExamen: '',
      heureExamen: '',
      remises: '',
      remiseType: 'euro',
      remiseValeur: '',
      distanciel: false,
      datePaiement: '',
      lieuConfiguration: '',
    });
  };

  const saveExamen = async (examenId: number) => {
    if (!examenId) return;

    setSavingExamen(true);
    try {
      // Calcul du prix final avec remise
      let prixFinal = examenForm.prix ? parseFloat(examenForm.prix) : null;
      if (prixFinal && examenForm.remiseValeur && parseFloat(examenForm.remiseValeur) > 0) {
        const remise = parseFloat(examenForm.remiseValeur);
        prixFinal = examenForm.remiseType === 'euro'
          ? prixFinal - remise
          : prixFinal - (prixFinal * remise / 100);
        prixFinal = Math.max(0, Math.round(prixFinal * 100) / 100);
      }

      // Construire la note de remise
      let remisesNote = examenForm.remises || '';
      if (examenForm.remiseValeur && parseFloat(examenForm.remiseValeur) > 0) {
        const remiseInfo = examenForm.remiseType === 'euro'
          ? `Remise: -${parseFloat(examenForm.remiseValeur).toFixed(2)}€`
          : `Remise: -${examenForm.remiseValeur}%`;
        remisesNote = remisesNote ? `${remiseInfo} | ${remisesNote}` : remiseInfo;
      }

      const res = await fetch(`/api/admin/examens/${examenId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prix: prixFinal,
          moyenPaiement: examenForm.moyenPaiement || null,
          formateurId: examenForm.formateurId || null,
          commercialId: examenForm.commercialId || null,
          typeExamen: examenForm.typeExamen || null,
          lieu: examenForm.lieu || null,
          dateExamen: examenForm.dateExamen || null,
          heureExamen: examenForm.heureExamen || null,
          remises: remisesNote || null,
          distanciel: examenForm.distanciel,
          datePaiement: examenForm.datePaiement || null,
          lieuConfiguration: examenForm.lieuConfiguration || null,
        }),
      });

      if (res.ok) {
        // Recharger les examens et les créneaux disponibles
        if (inscription) {
          await fetchExamens(inscription.clientId, inscription.email);
        }
        await fetchExamenSlots();
        cancelEditExamen();
      }
    } catch {
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSavingExamen(false);
    }
  };

  // Archiver un examen
  const archiveExamen = async (examenId: number) => {
    if (!confirm('Voulez-vous archiver cet examen ?')) return;

    try {
      const res = await fetch(`/api/admin/examens/${examenId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive' }),
      });

      if (res.ok) {
        if (inscription) {
          await fetchExamens(inscription.clientId, inscription.email);
        }
        await fetchExamenSlots();
      } else {
        alert('Erreur lors de l\'archivage');
      }
    } catch {
      alert('Erreur réseau');
    }
  };

  // Supprimer un examen
  const deleteExamenHandler = async (examenId: number) => {
    if (!confirm('Voulez-vous vraiment supprimer définitivement cet examen ? Cette action est irréversible.')) return;

    try {
      const res = await fetch(`/api/admin/examens/${examenId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        if (inscription) {
          await fetchExamens(inscription.clientId, inscription.email);
        }
        await fetchExamenSlots();
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch {
      alert('Erreur réseau');
    }
  };

  // Vérifier si un examen est complètement configuré
  const isExamenConfigured = (examen: Examen) => {
    return examen.prix !== null &&
      examen.moyenPaiement !== null &&
      examen.dateExamen !== null &&
      examen.heureExamen !== null &&
      examen.lieu !== null &&
      examen.formateurId !== null &&
      examen.commercialId !== null &&
      examen.datePaiement !== null &&
      examen.lieuConfiguration !== null;
  };

  // Vérifier si le formulaire d'édition est complet
  const isExamenFormComplete = () => {
    return examenForm.prix !== '' &&
      examenForm.moyenPaiement !== '' &&
      examenForm.dateExamen !== '' &&
      examenForm.heureExamen !== '' &&
      examenForm.lieu !== '' &&
      examenForm.formateurId !== '' &&
      examenForm.commercialId !== '' &&
      examenForm.datePaiement !== '' &&
      examenForm.lieuConfiguration !== '';
  };

  // Obtenir les champs manquants pour l'affichage
  const getMissingFields = () => {
    const missing: string[] = [];
    if (!examenForm.formateurId) missing.push('Formateur');
    if (!examenForm.commercialId) missing.push('Commercial');
    if (!examenForm.dateExamen) missing.push('Date d\'examen');
    if (!examenForm.lieu) missing.push('Lieu');
    if (!examenForm.prix) missing.push('Prix');
    if (!examenForm.moyenPaiement) missing.push('Moyen de paiement');
    if (!examenForm.datePaiement) missing.push('Date de paiement');
    if (!examenForm.lieuConfiguration) missing.push('Fait à (configuration)');
    return missing;
  };

  // Vérifier si un examen a une configuration partielle (brouillon)
  const isExamenBrouillon = (examen: Examen) => {
    const hasAnyConfig = examen.prix !== null ||
      examen.moyenPaiement !== null ||
      examen.dateExamen !== null ||
      examen.heureExamen !== null ||
      examen.lieu !== null ||
      examen.formateurId !== null;
    return hasAnyConfig && !isExamenConfigured(examen);
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

          {/* Informations complémentaires issues du formulaire d'examen */}
          {examens.length > 0 && (
            <>
              {examens[0].nationalite && (
                <div className="flex items-start gap-3 py-2">
                  <User className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">Nationalité</p>
                    <p className="text-sm text-slate-800">{examens[0].nationalite}</p>
                  </div>
                </div>
              )}
              {examens[0].villeNaissance && (
                <div className="flex items-start gap-3 py-2">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">Ville de naissance</p>
                    <p className="text-sm text-slate-800">{examens[0].villeNaissance}</p>
                  </div>
                </div>
              )}
              {examens[0].lieuNaissance && (
                <div className="flex items-start gap-3 py-2">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">Pays de naissance</p>
                    <p className="text-sm text-slate-800">{examens[0].lieuNaissance}</p>
                  </div>
                </div>
              )}
              {examens[0].langueMaternelle && (
                <div className="flex items-start gap-3 py-2">
                  <BookOpen className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">Langue maternelle</p>
                    <p className="text-sm text-slate-800">{examens[0].langueMaternelle}</p>
                  </div>
                </div>
              )}
              {examens[0].numeroPasseport && (
                <div className="flex items-start gap-3 py-2">
                  <CreditCard className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">N° Passeport</p>
                    <p className="text-sm text-slate-800 font-mono">{examens[0].numeroPasseport}</p>
                  </div>
                </div>
              )}
              {examens[0].numeroCni && (
                <div className="flex items-start gap-3 py-2">
                  <CreditCard className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">N° Carte d&apos;identité</p>
                    <p className="text-sm text-slate-800 font-mono">{examens[0].numeroCni}</p>
                  </div>
                </div>
              )}
            </>
          )}
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
            <div className="space-y-4">
              {examens.map((examen) => {
                const resultatConfig = RESULTAT_CONFIG[examen.resultat];
                const isEditing = editingExamenId === examen.id;
                const configured = isExamenConfigured(examen);

                return (
                  <div
                    key={examen.id}
                    className="p-4 bg-slate-50 rounded-lg border border-slate-100"
                  >
                    {/* En-tête */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-slate-800">
                            {getDiplomeLabel(examOptions, examen.diplome)}
                          </span>
                          {/* Bouton pour renvoyer le lien / réinitialiser le choix */}
                          <button
                            onClick={() => handleResendLink(examen.id, !!examen.diplome)}
                            disabled={resendingLinkId === examen.id}
                            className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                            title={examen.diplome ? 'Réinitialiser le choix et renvoyer le lien' : 'Renvoyer le lien de choix'}
                          >
                            {resendingLinkId === examen.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3 w-3" />
                            )}
                            {examen.diplome ? 'Réinitialiser' : 'Renvoyer lien'}
                          </button>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${resultatConfig.bg} ${resultatConfig.text}`}>
                            {resultatConfig.label}
                          </span>
                          {configured ? (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                              Configuré
                            </span>
                          ) : (
                            isExamenBrouillon(examen) ? (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                                Brouillon
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                                À configurer
                              </span>
                            )
                          )}
                        </div>
                        {examen.motivation && (
                          <p className="text-xs text-slate-600 mt-1">
                            <span className="font-medium">Motivation :</span>{' '}
                            {examen.motivation === 'autre' && examen.motivationAutre
                              ? examen.motivationAutre
                              : {
                                  'nationalite_francaise': 'Accès à la nationalité française',
                                  'carte_resident': 'Demande de carte de résident',
                                  'titre_sejour': 'Demande de titre de séjour',
                                  'autre': 'Autre(s)',
                                }[examen.motivation] || examen.motivation}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                          Inscrit le {new Date(examen.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isEditing && (
                          <>
                            <button
                              onClick={() => startEditExamen(examen)}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors"
                            >
                              <Pencil className="h-3 w-3" />
                              Configurer
                            </button>
                            <button
                              onClick={() => archiveExamen(examen.id)}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-600 hover:bg-amber-100 rounded transition-colors"
                              title="Archiver cet examen"
                            >
                              <Archive className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => deleteExamenHandler(examen.id)}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 rounded transition-colors"
                              title="Supprimer définitivement"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </>
                        )}
                        <span className="text-xs text-slate-400">#{examen.id}</span>
                      </div>
                    </div>


                    {/* Formulaire d'édition */}
                    {isEditing ? (
                      <div className="space-y-4 pt-3 border-t border-slate-200">
                        <div className="grid grid-cols-2 gap-3">
                          {/* Formateur */}
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-slate-600 mb-1">Formateur</label>
                            <select
                              value={examenForm.formateurId}
                              onChange={(e) => setExamenForm({ ...examenForm, formateurId: e.target.value })}
                              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            >
                              <option value="">Sélectionner...</option>
                              {staffMembers.map((s) => (
                                <option key={s.id} value={s.id}>{s.prenom} {s.nom}</option>
                              ))}
                            </select>
                          </div>

                          {/* Commercial (attribution CA) */}
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-slate-600 mb-1">Commercial (attribution CA)</label>
                            <select
                              value={examenForm.commercialId}
                              onChange={(e) => setExamenForm({ ...examenForm, commercialId: e.target.value })}
                              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            >
                              <option value="">Sélectionner...</option>
                              {staffMembers.filter((s) => s.role === 'commercial').map((s) => (
                                <option key={s.id} value={s.id}>{s.prenom} {s.nom} ({s.lieu})</option>
                              ))}
                            </select>
                          </div>

                          {/* Date d'examen (selon créneaux du diplôme) */}
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-slate-600 mb-1">Date d&apos;examen</label>
                            <select
                              value={examenForm.dateExamen}
                              onChange={(e) => {
                                const availableDates = formatExamenDateOptions(editingExamenSlots);
                                const selectedDate = availableDates.find(d => d.value === e.target.value);
                                setExamenForm({
                                  ...examenForm,
                                  dateExamen: e.target.value,
                                  heureExamen: selectedDate?.heure || examenForm.heureExamen,
                                });
                              }}
                              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            >
                              <option value="">Sélectionner une date...</option>
                              {formatExamenDateOptions(editingExamenSlots).map((d) => {
                                const isFull = d.count >= d.maxPlaces;
                                const isAlmostFull = d.count >= d.maxPlaces - 3;
                                return (
                                  <option
                                    key={d.value}
                                    value={d.value}
                                    disabled={isFull}
                                    className={isFull ? 'text-slate-400' : ''}
                                  >
                                    {d.label} — {d.count}/{d.maxPlaces} places{isFull ? ' (COMPLET)' : isAlmostFull ? ' (presque complet)' : ''}
                                  </option>
                                );
                              })}
                            </select>
                            <p className="text-xs text-slate-400 mt-1">
                              Lundis après-midi (14h) • Vendredis matin (9h) • Max 15 places/jour
                            </p>
                          </div>

                          {/* Lieu */}
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Lieu</label>
                            <select
                              value={examenForm.lieu}
                              onChange={(e) => setExamenForm({ ...examenForm, lieu: e.target.value })}
                              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            >
                              <option value="">Sélectionner un lieu...</option>
                              <option value="Gagny">Gagny</option>
                              <option value="Sarcelles">Sarcelles</option>
                            </select>
                          </div>

                          {/* Mode d'inscription */}
                          <div className="flex items-center">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={examenForm.distanciel}
                                onChange={(e) => setExamenForm({ ...examenForm, distanciel: e.target.checked })}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-slate-700">Inscription à distance</span>
                            </label>
                          </div>

                          {/* Prix */}
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Prix (€)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={examenForm.prix}
                              onChange={(e) => setExamenForm({ ...examenForm, prix: e.target.value })}
                              placeholder="0.00"
                              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            />
                          </div>

                          {/* Moyen de paiement */}
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Moyen de paiement</label>
                            <select
                              value={examenForm.moyenPaiement}
                              onChange={(e) => setExamenForm({ ...examenForm, moyenPaiement: e.target.value as MoyenPaiement })}
                              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            >
                              <option value="">Sélectionner...</option>
                              {MOYENS_PAIEMENT.map((m) => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                              ))}
                            </select>
                          </div>

                          {/* Date de paiement */}
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Date du paiement</label>
                            <input
                              type="date"
                              value={examenForm.datePaiement}
                              onChange={(e) => setExamenForm({ ...examenForm, datePaiement: e.target.value })}
                              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            />
                          </div>

                          {/* Lieu de configuration */}
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Fait à (configuration)</label>
                            <select
                              value={examenForm.lieuConfiguration}
                              onChange={(e) => setExamenForm({ ...examenForm, lieuConfiguration: e.target.value })}
                              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            >
                              <option value="">Sélectionner...</option>
                              <option value="Gagny">Gagny</option>
                              <option value="Sarcelles">Sarcelles</option>
                            </select>
                          </div>

                          {/* Remise calculée */}
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-slate-600 mb-1">Remise</label>
                            <div className="flex items-center gap-2">
                              <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => setExamenForm({ ...examenForm, remiseType: 'euro' })}
                                  className={`px-3 py-2 text-xs font-semibold transition-colors ${
                                    examenForm.remiseType === 'euro'
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-white text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  €
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setExamenForm({ ...examenForm, remiseType: 'pourcentage' })}
                                  className={`px-3 py-2 text-xs font-semibold transition-colors ${
                                    examenForm.remiseType === 'pourcentage'
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-white text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  %
                                </button>
                              </div>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={examenForm.remiseValeur}
                                onChange={(e) => setExamenForm({ ...examenForm, remiseValeur: e.target.value })}
                                placeholder={examenForm.remiseType === 'euro' ? 'Montant en €' : 'Pourcentage'}
                                className="flex-1 text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Prix final calculé */}
                          {examenForm.prix && parseFloat(examenForm.prix) > 0 && examenForm.remiseValeur && parseFloat(examenForm.remiseValeur) > 0 && (
                            <div className="col-span-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                              <div className="flex items-center justify-between text-sm">
                                <div className="space-y-1">
                                  <p className="text-slate-500">
                                    Prix initial : <span className="font-medium text-slate-700">{parseFloat(examenForm.prix).toFixed(2)} €</span>
                                  </p>
                                  <p className="text-slate-500">
                                    Remise : <span className="font-medium text-red-600">
                                      -{examenForm.remiseType === 'euro'
                                        ? `${parseFloat(examenForm.remiseValeur).toFixed(2)} €`
                                        : `${examenForm.remiseValeur}% (${(parseFloat(examenForm.prix) * parseFloat(examenForm.remiseValeur) / 100).toFixed(2)} €)`
                                      }
                                    </span>
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-emerald-600 font-medium">Prix final</p>
                                  <p className="text-xl font-bold text-emerald-700">
                                    {(() => {
                                      const prix = parseFloat(examenForm.prix);
                                      const remise = parseFloat(examenForm.remiseValeur);
                                      const final_ = examenForm.remiseType === 'euro'
                                        ? prix - remise
                                        : prix - (prix * remise / 100);
                                      return Math.max(0, final_).toFixed(2);
                                    })()} €
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Remises (note interne) */}
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Remises <span className="text-slate-400 font-normal">(note interne)</span>
                            </label>
                            <textarea
                              value={examenForm.remises}
                              onChange={(e) => setExamenForm({ ...examenForm, remises: e.target.value })}
                              placeholder="Ex: Remise fidélité -10%, Offre spéciale..."
                              rows={2}
                              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none resize-none"
                            />
                          </div>
                        </div>

                        {/* Champs manquants */}
                        {!isExamenFormComplete() && (
                          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                            <p className="text-xs font-medium text-amber-700 mb-1">
                              Champs obligatoires manquants :
                            </p>
                            <p className="text-xs text-amber-600">
                              {getMissingFields().join(' • ')}
                            </p>
                          </div>
                        )}

                        {/* Boutons */}
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => saveExamen(examen.id)}
                            disabled={savingExamen || !isExamenFormComplete()}
                            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              isExamenFormComplete()
                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                : 'bg-slate-400'
                            }`}
                          >
                            {savingExamen ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Enregistrer la configuration
                          </button>
                          <button
                            onClick={cancelEditExamen}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Infos configurées */}
                        {(examen.dateExamen || examen.prix) && (
                          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200 text-xs">
                            {examen.dateExamen && (
                              <div><span className="text-slate-500">Date:</span> <span className="font-medium">{new Date(examen.dateExamen).toLocaleDateString('fr-FR')} {examen.heureExamen || ''}</span></div>
                            )}
                            {examen.lieu && (
                              <div className="col-span-2"><span className="text-slate-500">Lieu:</span> <span className="font-medium">{examen.lieu}</span></div>
                            )}
                            {examen.prix && (
                              <div><span className="text-slate-500">Prix:</span> <span className="font-medium">{examen.prix}€</span></div>
                            )}
                            {examen.moyenPaiement && (
                              <div><span className="text-slate-500">Paiement:</span> <span className="font-medium">{MOYENS_PAIEMENT.find(m => m.value === examen.moyenPaiement)?.label}</span></div>
                            )}
                            {examen.formateurId && (
                              <div><span className="text-slate-500">Formateur:</span> <span className="font-medium">{staffMembers.find(s => s.id === examen.formateurId)?.prenom} {staffMembers.find(s => s.id === examen.formateurId)?.nom}</span></div>
                            )}
                            {examen.commercialId && (
                              <div><span className="text-slate-500">Commercial:</span> <span className="font-medium">{staffMembers.find(s => s.id === examen.commercialId)?.prenom} {staffMembers.find(s => s.id === examen.commercialId)?.nom}</span></div>
                            )}
                            {examen.remises && (
                              <div className="col-span-2 mt-1 p-2 bg-amber-50 rounded-lg border border-amber-200">
                                <span className="text-amber-700 text-xs font-medium">Remises:</span>
                                <p className="text-amber-800 text-xs mt-0.5">{examen.remises}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Boutons de génération de documents - seulement si configuré */}
                        {configured && (
                          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200">
                            <button
                              onClick={() => inscription && generateConvocation(inscription, examen)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Convocation
                            </button>
                            <button
                              onClick={async () => {
                                if (!inscription) return;
                                const formateur = staffMembers.find(s => s.id === examen.formateurId);
                                const formateurNom = formateur ? `${formateur.prenom} ${formateur.nom}` : undefined;
                                await generateFicheInscription(inscription, examen, formateurNom);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Fiche d&apos;inscription
                            </button>
                            <button
                              onClick={async () => inscription && await generateAttestationPaiement(inscription, examen)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Attestation de paiement
                            </button>
                          </div>
                        )}
                      </>
                    )}
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
