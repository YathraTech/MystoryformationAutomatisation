'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Mail, Phone, Loader2, MapPin } from 'lucide-react';
import { Input, Select, DatePicker } from '@/components/ui';
import { CIVILITES } from '@/lib/utils/constants';
import type { InscriptionCompleteData } from '@/types';

interface AddressSuggestion {
  properties: {
    label: string;
    name: string;
    postcode: string;
    city: string;
    context: string;
  };
}

export function StepPersonalInfo() {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<InscriptionCompleteData>();

  const codePostal = useWatch<InscriptionCompleteData, 'codePostal'>({ name: 'codePostal' });
  const [loadingVille, setLoadingVille] = useState(false);
  const prevCodePostal = useRef('');

  // Autocomplétion adresse
  const [adresseInput, setAdresseInput] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loadingAdresse, setLoadingAdresse] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fermer les suggestions quand on clique ailleurs
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
    prevCodePostal.current = postcode; // Éviter la recherche auto de ville

    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Auto-complétion ville par code postal (fallback si pas d'adresse sélectionnée)
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
          Renseignez vos coordonnées pour votre inscription.
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
            label="Email professionnel"
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

        <DatePicker
          label="Date de naissance"
          error={errors.dateNaissance?.message}
          maxDate={new Date().toISOString().split('T')[0]}
          {...register('dateNaissance')}
        />

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
      </div>
    </div>
  );
}
