'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { CheckCircle2, ArrowRight, Mail, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui';
function ConfirmationContent() {
  const searchParams = useSearchParams();
  const nom = searchParams.get('nom') || '';
  const prenom = searchParams.get('prenom') || '';
  const email = searchParams.get('email') || '';
  const formationNom = searchParams.get('formation') || '';

  return (
    <main className="flex-grow flex flex-col items-center justify-center px-4 py-12 md:py-16 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-b from-green-50/80 to-transparent blur-3xl -z-10 pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>

          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
            Inscription confirmée
          </h1>

          <p className="text-sm text-slate-500">
            Merci{prenom && ` ${prenom}`} ! Votre demande d&apos;inscription a bien
            été enregistrée.
          </p>
        </div>

        {/* Recap card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">
            Récapitulatif
          </h2>

          <div className="space-y-3">
            {(nom || prenom) && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Nom</span>
                <span className="font-medium text-slate-900">
                  {prenom} {nom}
                </span>
              </div>
            )}
            {email && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Email</span>
                <span className="font-medium text-slate-900">{email}</span>
              </div>
            )}
            {formationNom && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Formation</span>
                <span className="font-medium text-slate-900">
                  {formationNom}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Prochaines étapes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">
            Prochaines étapes
          </h2>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Email de confirmation
                </p>
                <p className="text-xs text-slate-500">
                  Un email récapitulatif vous sera envoyé sous peu.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Convention de formation
                </p>
                <p className="text-xs text-slate-500">
                  Vous recevrez votre convention à signer par email.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Démarrage de la formation
                </p>
                <p className="text-xs text-slate-500">
                  Nous vous contacterons pour confirmer les dates de votre session.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/">
            <Button
              variant="outline"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Retour à l&apos;accueil
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-grow flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
