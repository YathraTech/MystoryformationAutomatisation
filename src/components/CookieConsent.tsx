'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui';

const COOKIE_CONSENT_KEY = 'cpf-cookie-consent';

interface CookieConsentProps {
  onAccept: () => void;
}

export function CookieConsent({ onAccept }: CookieConsentProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent === 'accepted') {
      onAccept();
    } else {
      setVisible(true);
    }
  }, [onAccept]);

  const handleAccept = () => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setVisible(false);
    onAccept();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8 animate-in slide-in-from-bottom">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
          <ShieldCheck className="h-6 w-6 text-blue-600" />
        </div>

        <h2 className="text-center text-lg font-semibold text-slate-900 mb-2">
          Protection de vos données
        </h2>

        <p className="text-center text-sm text-slate-600 mb-4">
          Avant de commencer, nous souhaitons être transparents sur l&apos;utilisation de vos données.
        </p>

        {/* Details */}
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 mb-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-green-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Données strictement fonctionnelles
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Les informations recueillies sont uniquement utilisées pour le bon fonctionnement de votre inscription et le suivi de votre formation.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-green-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Aucune revente de données
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Vos données personnelles ne sont jamais vendues, cédées ou partagées à des tiers à des fins commerciales ou publicitaires.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-green-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Pas de marketing ni de prospection
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Nous n&apos;utilisons pas vos informations pour vous envoyer des publicités ou des communications non sollicitées.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Cookies techniques uniquement
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Nous utilisons uniquement des cookies nécessaires à la sauvegarde de votre progression dans le formulaire. Aucun cookie de tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Conformité */}
        <p className="text-center text-[10px] text-slate-400 mb-5">
          Conforme au Règlement Général sur la Protection des Données (RGPD).
        </p>

        {/* Actions */}
        <Button onClick={handleAccept} className="w-full">
          J&apos;ai compris, commencer
        </Button>
      </div>
    </div>
  );
}

export function useCookieConsent() {
  const [accepted, setAccepted] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const consent = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    setAccepted(consent === 'accepted');
    setChecked(true);
  }, []);

  return { accepted, checked, setAccepted };
}
