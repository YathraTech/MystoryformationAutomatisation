'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Mail, Phone, Loader2, MapPin, Upload, X, FileText } from 'lucide-react';
import { Input, Select, DatePicker, Combobox } from '@/components/ui';
import { CIVILITES } from '@/lib/utils/constants';
import type { ExamenFormData } from './index';
import { SOURCES_CONNAISSANCE, AGENCES, SERVICES_SOUHAITES, NIVEAUX } from './index';

interface AddressSuggestion {
  properties: {
    label: string;
    name: string;
    postcode: string;
    city: string;
    context: string;
  };
}

// Liste des pays (principales nationalités)
const NATIONALITES_LIST = [
  'Française', 'Algérienne', 'Marocaine', 'Tunisienne', 'Sénégalaise', 'Malienne',
  'Ivoirienne', 'Camerounaise', 'Congolaise', 'Guinéenne', 'Turque', 'Portugaise',
  'Espagnole', 'Italienne', 'Roumaine', 'Polonaise', 'Britannique', 'Allemande',
  'Belge', 'Suisse', 'Américaine', 'Canadienne', 'Brésilienne', 'Chinoise',
  'Indienne', 'Pakistanaise', 'Sri Lankaise', 'Bangladaise', 'Afghane', 'Syrienne',
  'Libanaise', 'Égyptienne',
];

// Langues courantes (suggestions pour autocomplete)
const LANGUES_LIST = [
  'Français', 'Arabe', 'Berbère', 'Anglais', 'Espagnol', 'Portugais', 'Italien',
  'Allemand', 'Turc', 'Wolof', 'Bambara', 'Peul', 'Soninké', 'Mandingue',
  'Lingala', 'Swahili', 'Chinois (Mandarin)', 'Hindi', 'Ourdou', 'Bengali',
  'Tamoul', 'Roumain', 'Polonais', 'Russe', 'Ukrainien',
];

interface Agent {
  id: string;
  prenom: string;
  nom: string;
}

interface StepPersonalInfoProps {
  hideAgence?: boolean;
  hideAgentSelector?: boolean;
  pendingFiles: File[];
  onFilesChange: (files: File[]) => void;
  motivations: readonly { value: string; label: string }[];
}

export function StepPersonalInfo({ hideAgence, hideAgentSelector, pendingFiles, onFilesChange, motivations }: StepPersonalInfoProps) {
  const {
    register,
    setValue,
    watch,
    clearErrors,
    formState: { errors },
  } = useFormContext<ExamenFormData>();

  const codePostal = useWatch<ExamenFormData, 'codePostal'>({ name: 'codePostal' });
  const [loadingVille, setLoadingVille] = useState(false);
  const prevCodePostal = useRef('');

  // Multi-file upload
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Autocomplétion adresse
  const [adresseInput, setAdresseInput] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loadingAdresse, setLoadingAdresse] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Valeurs des combobox
  const [nationaliteInput, setNationaliteInput] = useState('');
  const [paysNaissanceInput, setPaysNaissanceInput] = useState('');
  const [villeNaissanceInput, setVilleNaissanceInput] = useState('');
  const [langueMaternelleInput, setLangueMaternelleInput] = useState('');

  // Agents (inscrit par)
  const [agents, setAgents] = useState<Agent[]>([]);
  useEffect(() => {
    fetch('/api/agents')
      .then((res) => res.ok ? res.json() : [])
      .then((data: Agent[]) => setAgents(Array.isArray(data) ? data : []))
      .catch(() => setAgents([]));
  }, []);

  // Fermer les suggestions d'adresse quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recherche d'adresse avec debounce
  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoadingAdresse(true);
    try {
      const res = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`
      );
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.features || []);
        setShowSuggestions(true);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingAdresse(false);
    }
  }, []);

  // Liste des pays
  const PAYS_LIST = [
    'France', 'Algérie', 'Maroc', 'Tunisie', 'Sénégal', 'Mali', 'Côte d\'Ivoire', 'Cameroun',
    'République Démocratique du Congo', 'Congo', 'Guinée', 'Burkina Faso', 'Niger', 'Bénin',
    'Togo', 'Mauritanie', 'Gabon', 'Comores', 'Madagascar', 'Maurice', 'Haïti',
    'Turquie', 'Portugal', 'Espagne', 'Italie', 'Roumanie', 'Pologne', 'Royaume-Uni',
    'Allemagne', 'Belgique', 'Suisse', 'Pays-Bas', 'Autriche', 'Grèce', 'Bulgarie',
    'États-Unis', 'Canada', 'Brésil', 'Mexique', 'Argentine', 'Colombie', 'Pérou', 'Chili',
    'Chine', 'Inde', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Vietnam', 'Philippines',
    'Japon', 'Corée du Sud', 'Thaïlande', 'Indonésie', 'Malaisie',
    'Afghanistan', 'Iran', 'Irak', 'Syrie', 'Liban', 'Jordanie', 'Palestine', 'Israël',
    'Arabie Saoudite', 'Émirats Arabes Unis', 'Qatar', 'Koweït', 'Égypte', 'Libye',
    'Russie', 'Ukraine', 'Biélorussie', 'Moldavie', 'Géorgie', 'Arménie', 'Azerbaïdjan',
  ];

  // Handlers combobox
  const handleComboboxChange = useCallback(
    (field: keyof ExamenFormData, setter: (v: string) => void) => (value: string) => {
      setter(value);
      setValue(field, value, { shouldValidate: true });
    },
    [setValue]
  );

  // Liste des villes de naissance (suggestions)
  const VILLES_NAISSANCE_LIST = [
    'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier',
    'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Saint-Étienne', 'Toulon', 'Le Havre',
    'Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Sétif', 'Tlemcen', 'Béjaïa',
    'Casablanca', 'Rabat', 'Fès', 'Marrakech', 'Tanger', 'Meknès', 'Agadir', 'Oujda', 'Nador',
    'Tunis', 'Sfax', 'Sousse', 'Gabès', 'Bizerte', 'Kairouan',
    'Dakar', 'Bamako', 'Abidjan', 'Douala', 'Yaoundé', 'Kinshasa', 'Brazzaville',
    'Conakry', 'Ouagadougou', 'Niamey', 'Cotonou', 'Lomé', 'Nouakchott',
    'Istanbul', 'Ankara', 'Lisbonne', 'Madrid', 'Rome', 'Bucarest',
    'Londres', 'Berlin', 'Bruxelles', 'Genève',
    'Beyrouth', 'Damas', 'Bagdad', 'Le Caire', 'Amman',
    'Pékin', 'New Delhi', 'Karachi', 'Lahore', 'Dacca', 'Colombo',
    'Port-au-Prince', 'Antananarivo', 'Moroni',
  ];


  const handleAdresseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAdresseInput(value);
    setValue('adresse', value, { shouldValidate: true });

    // Debounce la recherche
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchAddress(value);
    }, 300);
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    const { name, postcode, city } = suggestion.properties;

    setAdresseInput(name);
    setValue('adresse', name, { shouldValidate: true });
    setValue('codePostal', postcode, { shouldValidate: true });
    setValue('ville', city, { shouldValidate: true });
    prevCodePostal.current = postcode;

    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Handle adding files with validation
  const handleAddFiles = useCallback((newFiles: File[]) => {
    setFileError(null);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10 Mo
    const maxFiles = 5;

    const validFiles: File[] = [];
    for (const file of newFiles) {
      if (!allowedTypes.includes(file.type)) {
        setFileError(`"${file.name}" : format non autorisé. Formats acceptés : PDF, JPG, PNG`);
        return;
      }
      if (file.size > maxSize) {
        setFileError(`"${file.name}" : le fichier dépasse 10 Mo`);
        return;
      }
      validFiles.push(file);
    }

    const total = pendingFiles.length + validFiles.length;
    if (total > maxFiles) {
      setFileError(`Maximum ${maxFiles} fichiers autorisés (${pendingFiles.length} déjà ajouté(s))`);
      return;
    }

    const updated = [...pendingFiles, ...validFiles];
    onFilesChange(updated);
    clearErrors('pieceIdentite');
  }, [pendingFiles, onFilesChange, clearErrors]);

  // Auto-complétion ville par code postal
  useEffect(() => {
    if (!codePostal || codePostal.length !== 5 || !/^\d{5}$/.test(codePostal)) return;
    if (codePostal === prevCodePostal.current) return;
    prevCodePostal.current = codePostal;

    setLoadingVille(true);
    fetch(`https://geo.api.gouv.fr/communes?codePostal=${codePostal}&fields=nom&limit=1`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { nom: string }[]) => {
        if (data.length > 0) {
          setValue('ville', data[0].nom, { shouldValidate: true });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingVille(false));
  }, [codePostal, setValue]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          Informations personnelles
        </h2>
        <p className="text-sm text-slate-500">
          Renseignez vos coordonnées pour votre inscription à l&apos;examen.
        </p>
      </div>

      <div className="space-y-4">
        <Select
          label="Civilité"
          placeholder="Sélectionnez..."
          options={CIVILITES}
          error={errors.civilite?.message}
          {...register('civilite')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nom"
            placeholder="Votre nom"
            error={errors.nom?.message}
            {...register('nom')}
          />
          <Input
            label="Prénom"
            placeholder="Votre prénom"
            error={errors.prenom?.message}
            {...register('prenom')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="vous@exemple.fr"
            leftIcon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Téléphone"
            type="tel"
            placeholder="06 12 34 56 78"
            leftIcon={<Phone className="h-4 w-4" />}
            error={errors.telephone?.message}
            {...register('telephone')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker
            label="Date de naissance"
            error={errors.dateNaissance?.message}
            maxDate={new Date().toISOString().split('T')[0]}
            {...register('dateNaissance')}
          />
          <Combobox
            label="Ville de naissance"
            placeholder="Ex: Paris, Alger, Casablanca..."
            leftIcon={<MapPin className="h-4 w-4" />}
            options={VILLES_NAISSANCE_LIST}
            value={villeNaissanceInput}
            onChange={handleComboboxChange('villeNaissance', setVilleNaissanceInput)}
            error={errors.villeNaissance?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Combobox
            label="Pays de naissance"
            placeholder="Ex: France, Algérie, Maroc..."
            leftIcon={<MapPin className="h-4 w-4" />}
            options={PAYS_LIST}
            value={paysNaissanceInput}
            onChange={handleComboboxChange('lieuNaissance', setPaysNaissanceInput)}
            error={errors.lieuNaissance?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Combobox
            label="Nationalité"
            placeholder="Saisissez ou sélectionnez..."
            options={NATIONALITES_LIST}
            value={nationaliteInput}
            onChange={handleComboboxChange('nationalite', setNationaliteInput)}
            error={errors.nationalite?.message}
          />
          <Combobox
            label="Langue maternelle"
            placeholder="Ex: Français, Arabe, Anglais..."
            options={LANGUES_LIST}
            value={langueMaternelleInput}
            onChange={handleComboboxChange('langueMaternelle', setLangueMaternelleInput)}
            error={errors.langueMaternelle?.message}
          />
        </div>

        {/* Adresse avec autocomplétion */}
        <div className="relative" ref={suggestionsRef}>
          <Input
            label="Adresse"
            placeholder="Commencez à taper votre adresse..."
            leftIcon={<MapPin className="h-4 w-4" />}
            rightIcon={loadingAdresse ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            error={errors.adresse?.message}
            value={adresseInput}
            onChange={handleAdresseChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            autoComplete="off"
          />

          {/* Liste des suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0"
                >
                  <p className="text-sm font-medium text-slate-800">
                    {suggestion.properties.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {suggestion.properties.postcode} {suggestion.properties.city} — {suggestion.properties.context}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Code postal"
            placeholder="75001"
            maxLength={5}
            error={errors.codePostal?.message}
            {...register('codePostal')}
          />
          <Input
            label="Ville"
            placeholder={loadingVille ? 'Recherche...' : 'Ville'}
            error={errors.ville?.message}
            rightIcon={loadingVille ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            {...register('ville')}
          />
        </div>

        {/* Séparateur */}
        <div className="border-t border-slate-200 pt-6 mt-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4">
            Identification <span className="text-red-500">*</span>
          </h3>
        </div>

        {/* Choix du type de pièce */}
        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={() => {
              setValue('typePieceIdentite', 'passeport', { shouldValidate: true });
              setValue('numeroCni', '', { shouldValidate: false });
            }}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
              watch('typePieceIdentite') === 'passeport'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            Passeport
          </button>
          <button
            type="button"
            onClick={() => {
              setValue('typePieceIdentite', 'cni', { shouldValidate: true });
              setValue('numeroPasseport', '', { shouldValidate: false });
            }}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
              watch('typePieceIdentite') === 'cni'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            Carte d&apos;identité
          </button>
        </div>
        {errors.typePieceIdentite?.message && (
          <p className="text-xs text-red-600 -mt-2 mb-3">{errors.typePieceIdentite.message}</p>
        )}

        {/* Champ conditionnel selon le choix */}
        {watch('typePieceIdentite') === 'passeport' && (
          <Input
            label="Numéro de passeport"
            placeholder="Ex: 12AB34567"
            error={errors.numeroPasseport?.message}
            {...register('numeroPasseport')}
          />
        )}
        {watch('typePieceIdentite') === 'cni' && (
          <Input
            label="Numéro de carte d'identité"
            placeholder="Ex: 123456789012"
            error={errors.numeroCni?.message}
            {...register('numeroCni')}
          />
        )}

        {/* Informations complémentaires — visible uniquement après sélection du type de pièce */}
        {watch('typePieceIdentite') && (
          <>
            <div className="border-t border-slate-200 pt-6 mt-6">
              <h3 className="text-base font-semibold text-slate-800 mb-4">
                Informations complémentaires
              </h3>
            </div>

            {!hideAgence && (
              <Select
                label="Agence souhaitée"
                placeholder="Sélectionnez..."
                options={AGENCES}
                error={errors.agence?.message}
                {...register('agence')}
              />
            )}

            <Select
              label="Service souhaité"
              placeholder="Sélectionnez..."
              options={SERVICES_SOUHAITES}
              error={errors.serviceSouhaite?.message}
              {...register('serviceSouhaite')}
            />

            <Select
              label="Niveau actuel"
              placeholder="Sélectionnez..."
              options={NIVEAUX}
              error={errors.niveau?.message}
              {...register('niveau')}
            />

            <Select
              label="Motivation"
              placeholder="Sélectionnez..."
              options={motivations}
              error={errors.motivation?.message}
              {...register('motivation')}
            />

            {watch('motivation') === 'autre' && (
              <Input
                label="Précisez votre motivation"
                placeholder="Décrivez votre motivation..."
                error={errors.motivationAutre?.message}
                {...register('motivationAutre')}
              />
            )}

            {/* Téléversement du document d'identité */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {watch('typePieceIdentite') === 'passeport'
                  ? 'Passeport (page d\'identité)'
                  : 'Carte d\'identité (recto/verso)'
                } <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-2">
                {watch('typePieceIdentite') === 'passeport'
                  ? 'Veuillez fournir une photo de la page d\'identité de votre passeport'
                  : 'Veuillez fournir une photo recto et verso de votre carte d\'identité'
                }
              </p>

              {/* File list */}
              {pendingFiles.length > 0 && (
                <div className="space-y-2 mb-3">
                  {pendingFiles.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="flex items-center gap-3 p-2.5 bg-green-50 border border-green-200 rounded-lg">
                      <FileText className="h-4 w-4 text-green-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-green-700 truncate">{file.name}</p>
                        <p className="text-xs text-green-500">{(file.size / 1024 / 1024).toFixed(2)} Mo</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = pendingFiles.filter((_, i) => i !== index);
                          onFilesChange(updated);
                          if (updated.length > 0) {
                            clearErrors('pieceIdentite');
                          }
                        }}
                        className="p-1 hover:bg-green-100 rounded transition-colors"
                      >
                        <X className="h-4 w-4 text-green-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Drop zone */}
              {pendingFiles.length < 5 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const droppedFiles = Array.from(e.dataTransfer.files);
                    handleAddFiles(droppedFiles);
                  }}
                  className={`flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/50'
                  }`}
                >
                  <Upload className="h-5 w-5 text-slate-400" />
                  <span className="text-sm text-slate-500 text-center">
                    Cliquez ou glissez-déposez vos fichiers ici
                  </span>
                  <span className="text-xs text-slate-400">
                    PDF, JPG, PNG — max 10 Mo par fichier, max 5 fichiers
                  </span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    handleAddFiles(Array.from(e.target.files));
                    e.target.value = '';
                  }
                }}
              />

              {fileError && (
                <p className="mt-1 text-xs text-red-600">{fileError}</p>
              )}
              {errors.pieceIdentite?.message && (
                <p className="mt-1 text-xs text-red-600">{errors.pieceIdentite.message}</p>
              )}
            </div>

            {/* Agent inscripteur */}
            {!hideAgentSelector && (
              <Select
                label="Inscrit par"
                placeholder="Sélectionnez l'agent..."
                options={agents.map((a) => ({ value: a.id, label: `${a.prenom} ${a.nom}` }))}
                error={errors.agentId?.message}
                {...register('agentId')}
              />
            )}

            {/* Comment nous avez-vous connu (optionnel) */}
            <Select
              label="Comment nous avez-vous connu ?"
              placeholder="Sélectionnez... (optionnel)"
              options={SOURCES_CONNAISSANCE}
              error={errors.sourceConnaissance?.message}
              {...register('sourceConnaissance')}
            />
          </>
        )}
      </div>
    </div>
  );
}
