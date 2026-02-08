'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import LoginForm from '@/components/admin/LoginForm';
import { CookieConsent } from '@/components/CookieConsent';

export default function LoginPage() {
  const [cookiesAccepted, setCookiesAccepted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleCookieAccept = useCallback(() => {
    setCookiesAccepted(true);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8">
          <div className="flex flex-col items-center mb-6">
            <Image
              src="/logo-mystory.png"
              alt="MyStoryFormation"
              width={160}
              height={48}
              className="mb-4"
            />
            <h1 className="text-xl font-bold text-slate-800">
              Espace MyStoryFormation
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Connectez-vous pour accéder à l&apos;espace d&apos;inscription
            </p>
          </div>

          {cookiesAccepted ? (
            <LoginForm redirectTo="/" />
          ) : (
            <div className="text-center text-sm text-slate-500 py-4">
              Veuillez accepter les cookies pour continuer.
            </div>
          )}
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">
          MyStoryFormation &copy; {new Date().getFullYear()}
        </p>
      </div>

      {hydrated && !cookiesAccepted && (
        <CookieConsent onAccept={handleCookieAccept} />
      )}
    </div>
  );
}
