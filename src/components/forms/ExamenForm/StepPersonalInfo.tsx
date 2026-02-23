'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Mail, Phone, Loader2, MapPin, Upload, X } from 'lucide-react';
import { Input, Select, DatePicker } from '@/components/ui';
import { CIVILITES } from '@/lib/utils/constants';
import type { ExamenFormData } from './index';
import { SOURCES_CONNAISSANCE, AGENCES } from './index';

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
const NATIONALITES = [
  'Française', 'Algérienne', 'Marocaine', 'Tunisienne', 'Sénégalaise', 'Malienne',
  'Ivoirienne', 'Camerounaise', 'Congolaise', 'Guinéenne', 'Turque', 'Portugaise',
  'Espagnole', 'Italienne', 'Roumaine', 'Polonaise', 'Britannique', 'Allemande',
  'Belge', 'Suisse', 'Américaine', 'Canadienne', 'Brésilienne', 'Chinoise',
  'Indienne', 'Pakistanaise', 'Sri Lankaise', 'Bangladaise', 'Afghane', 'Syrienne',
  'Libanaise', 'Égyptienne', 'Autre'
].map(n => ({ value: n, label: n }));

// Langues maternelles courantes
const LANGUES = [
  'Français', 'Arabe', 'Berbère', 'Anglais', 'Espagnol', 'Portugais', 'Italien',
  'Allemand', 'Turc', 'Wolof', 'Bambara', 'Peul', 'Soninké', 'Mandingue',
  'Lingala', 'Swahili', 'Chinois (Mandarin)', 'Hindi', 'Ourdou', 'Bengali',
  'Tamoul', 'Roumain', 'Polonais', 'Russe', 'Ukrainien', 'Autre'
].map(l => ({ value: l, label: l }));

export function StepPersonalInfo({ hideAgence }: { hideAgence?: boolean }) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<ExamenFormData>();

  const codePostal = useWatch<ExamenFormData, 'codePostal'>({ name: 'codePostal' });
  const [loadingVille, setLoadingVille] = useState(false);
  const prevCodePostal = useRef('');

  // Upload de fichier
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const pieceIdentite = watch('pieceIdentite');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Autocomplétion adresse
  const [adresseInput, setAdresseInput] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loadingAdresse, setLoadingAdresse] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Autocomplétion pays de naissance
  const [paysNaissanceInput, setPaysNaissanceInput] = useState('');
  const [paysSuggestions, setPaysSuggestions] = useState<string[]>([]);
  const [showPaysSuggestions, setShowPaysSuggestions] = useState(false);
  const paysSuggestionsRef = useRef<HTMLDivElement>(null);

  // Fermer les suggestions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (paysSuggestionsRef.current && !paysSuggestionsRef.current.contains(e.target as Node)) {
        setShowPaysSuggestions(false);
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

  // Recherche de pays de naissance
  const searchPaysNaissance = useCallback((query: string) => {
    if (query.length < 1) {
      setPaysSuggestions([]);
      setShowPaysSuggestions(false);
      return;
    }

    const queryLower = query.toLowerCase();
    const results = PAYS_LIST.filter(pays =>
      pays.toLowerCase().includes(queryLower)
    ).slice(0, 8);

    setPaysSuggestions(results);
    setShowPaysSuggestions(results.length > 0);
  }, []);

  const handlePaysNaissanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPaysNaissanceInput(value);
    setValue('lieuNaissance', value, { shouldValidate: true });
    searchPaysNaissance(value);
  };

  const handleSelectPaysSuggestion = (pays: string) => {
    setPaysNaissanceInput(pays);
    setValue('lieuNaissance', pays, { shouldValidate: true });
    setPaysSuggestions([]);
    setShowPaysSuggestions(false);
  };

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
          {/* Pays de naissance avec autocomplétion */}
          <div className="relative" ref={paysSuggestionsRef}>
            <Input
              label="Pays de naissance"
              placeholder="Ex: France, Algérie, Maroc..."
              leftIcon={<MapPin className="h-4 w-4" />}
              error={errors.lieuNaissance?.message}
              value={paysNaissanceInput}
              onChange={handlePaysNaissanceChange}
              onFocus={() => paysSuggestions.length > 0 && setShowPaysSuggestions(true)}
              autoComplete="off"
            />

            {/* Liste des suggestions de pays */}
            {showPaysSuggestions && paysSuggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {paysSuggestions.map((pays, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectPaysSuggestion(pays)}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0"
                  >
                    <p className="text-sm font-medium text-slate-800">{pays}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Nationalité"
            placeholder="Sélectionnez..."
            options={NATIONALITES}
            error={errors.nationalite?.message}
            {...register('nationalite')}
          />
          <Select
            label="Langue maternelle"
            placeholder="Sélectionnez..."
            options={LANGUES}
            error={errors.langueMaternelle?.message}
            {...register('langueMaternelle')}
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
            Pièces d&apos;identité
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Numéro de passeport"
            placeholder="Ex: 12AB34567"
            error={errors.numeroPasseport?.message}
            {...register('numeroPasseport')}
          />
          <Input
            label="Numéro de carte d'identité"
            placeholder="Ex: 123456789012"
            error={errors.numeroCni?.message}
            {...register('numeroCni')}
          />
        </div>

        {/* Séparateur */}
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

        {/* Pièce d'identité (optionnel) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Pièce d&apos;identité <span className="text-slate-400 font-normal">(optionnel)</span>
          </label>
          <div className="relative">
            {pieceIdentite ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex-1 truncate text-sm text-green-700">
                  Fichier téléchargé
                </div>
                <button
                  type="button"
                  onClick={() => setValue('pieceIdentite', '')}
                  className="p-1 hover:bg-green-100 rounded transition-colors"
                >
                  <X className="h-4 w-4 text-green-600" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
              >
                {uploadingFile ? (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-slate-400" />
                    <span className="text-sm text-slate-500">
                      Cliquez pour télécharger (PDF, JPG, PNG - max 10 Mo)
                    </span>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                // Vérifier la taille (10 Mo max)
                if (file.size > 10 * 1024 * 1024) {
                  setUploadError('Le fichier ne doit pas dépasser 10 Mo');
                  return;
                }

                setUploadingFile(true);
                setUploadError(null);

                try {
                  // Pour l'instant, on stocke juste le nom du fichier
                  // L'upload réel vers Supabase Storage peut être implémenté plus tard
                  setValue('pieceIdentite', file.name);
                } catch {
                  setUploadError('Erreur lors du téléchargement');
                } finally {
                  setUploadingFile(false);
                }
              }}
            />
          </div>
          {uploadError && (
            <p className="mt-1 text-xs text-red-600">{uploadError}</p>
          )}
          <p className="mt-1 text-xs text-slate-400">
            Demandable plus tard si non fourni maintenant
          </p>
        </div>

        {/* Comment nous avez-vous connu (optionnel) */}
        <Select
          label="Comment nous avez-vous connu ?"
          placeholder="Sélectionnez... (optionnel)"
          options={SOURCES_CONNAISSANCE}
          error={errors.sourceConnaissance?.message}
          {...register('sourceConnaissance')}
        />
      </div>
    </div>
  );
}
