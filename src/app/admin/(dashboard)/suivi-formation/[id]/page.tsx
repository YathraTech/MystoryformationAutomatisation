'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  FileText,
  ClipboardList,
  BookOpen,
  CheckCircle2,
  Star,
  Award,
  Mail,
  Clock,
  Download,
  Link2,
  Send,
  Loader2,
} from 'lucide-react';
import type {
  StagiaireFormation,
  TestFormation,
  AnalyseBesoin,
  Evaluation,
  SatisfactionChaud,
  SatisfactionFroid,
  Emargement,
  StagiaireStatut,
  Inscription,
} from '@/types/admin';
import TestInitialForm from '@/components/admin/formation/TestInitialForm';
import AnalyseBesoinForm from '@/components/admin/formation/AnalyseBesoinForm';
import EvaluationInitialeForm from '@/components/admin/formation/EvaluationInitialeForm';
import InscriptionPaiementForm from '@/components/admin/formation/InscriptionPaiementForm';
import DesignationForm from '@/components/admin/formation/DesignationForm';
import EmargementSection from '@/components/admin/formation/EmargementSection';
import TestFinalSection from '@/components/admin/formation/TestFinalSection';
import SatisfactionFroidSection from '@/components/admin/formation/SatisfactionFroidSection';
import FicheStagiaireCard from '@/components/admin/formation/FicheStagiaireCard';
import { generateEmploiDuTempsPdf } from '@/lib/utils/formation-pdf-generator';

interface StagiaireData {
  stagiaire: StagiaireFormation;
  testInitial: TestFormation | null;
  testFinal: TestFormation | null;
  analyse: AnalyseBesoin | null;
  evalInitiale: Evaluation | null;
  evalFinale: Evaluation | null;
  emargements: Emargement[];
  satisfactionChaud: SatisfactionChaud[];
  satisfactionFroid: SatisfactionFroid | null;
  inscription: Inscription | null;
}

const WORKFLOW_STEPS: {
  key: StagiaireStatut;
  label: string;
  icon: typeof User;
  description: string;
}[] = [
  { key: 'inscription', label: 'Inscription', icon: User, description: 'Fiche client créée' },
  { key: 'test_initial', label: 'Test initial', icon: FileText, description: 'CO + CE auto, EE + EO manuel' },
  { key: 'analyse_besoin', label: 'Analyse besoin', icon: ClipboardList, description: 'Fiche d\'analyse remplie' },
  { key: 'evaluation_initiale', label: 'Éval. initiale', icon: BookOpen, description: 'Générée automatiquement' },
  { key: 'en_formation', label: 'Formation', icon: Clock, description: 'Émargement + suivi présences' },
  { key: 'test_final', label: 'Test final', icon: FileText, description: 'Comparaison initial vs final' },
  { key: 'evaluation_finale', label: 'Éval. finale', icon: CheckCircle2, description: 'Comparaison + axes' },
  { key: 'terminee', label: 'Terminée', icon: Award, description: 'Attestation générée' },
];

const STATUT_ORDER: StagiaireStatut[] = [
  'inscription', 'test_initial', 'analyse_besoin', 'evaluation_initiale',
  'en_formation', 'test_final', 'evaluation_finale', 'terminee',
];

export default function StagiaireDetailPage() {
  const params = useParams();
  const router = useRouter();
  const stagiaireId = parseInt(params.id as string);

  const [data, setData] = useState<StagiaireData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<StagiaireStatut>('inscription');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/stagiaires-formation/${stagiaireId}`);
      if (!res.ok) throw new Error('Not found');
      const result = await res.json();
      setData(result);
      setActiveStep(result.stagiaire.statut);
    } catch {
      router.push('/admin/suivi-formation');
    } finally {
      setLoading(false);
    }
  }, [stagiaireId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const { stagiaire } = data;
  const currentStepIndex = STATUT_ORDER.indexOf(stagiaire.statut);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/suivi-formation')}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">
            {stagiaire.civilite} {stagiaire.nom} {stagiaire.prenom}
          </h1>
          <p className="text-sm text-slate-500">
            {stagiaire.typePrestation} - {stagiaire.agence} - {stagiaire.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Lien test QCM pour le client */}
          {(stagiaire.statut === 'inscription' || stagiaire.statut === 'test_initial') && (
            <button
              onClick={() => {
                const testToken = Buffer.from(stagiaireId.toString()).toString('base64');
                const testUrl = `${window.location.origin}/test/${testToken}`;
                navigator.clipboard.writeText(testUrl);
                alert(`Lien copié !\n\n${testUrl}\n\nEnvoyez ce lien au client pour qu'il passe le test QCM.`);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Link2 className="h-4 w-4" />
              Lien test QCM
            </button>
          )}
          {stagiaire.statut === 'terminee' && stagiaire.pdfAttestationFin && (
            <a
              href={stagiaire.pdfAttestationFin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Download className="h-4 w-4" />
              Attestation
            </a>
          )}
          {!stagiaire.mailInscriptionEnvoye && stagiaire.statut !== 'inscription' && (
            <button
              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              onClick={async () => {
                // TODO: Envoyer les docs par mail
                alert('Envoi des documents par mail...');
              }}
            >
              <Mail className="h-4 w-4" />
              Envoyer docs
            </button>
          )}
        </div>
      </div>

      {/* Workflow Progress */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center overflow-x-auto gap-1">
          {WORKFLOW_STEPS.map((step, idx) => {
            const isCompleted = STATUT_ORDER.indexOf(step.key) < currentStepIndex;
            const isCurrent = step.key === stagiaire.statut;
            const isClickable = STATUT_ORDER.indexOf(step.key) <= currentStepIndex;
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex items-center">
                <button
                  onClick={() => isClickable && setActiveStep(step.key)}
                  disabled={!isClickable}
                  className={`flex flex-col items-center min-w-[80px] p-2 rounded-lg transition-colors ${
                    activeStep === step.key
                      ? 'bg-blue-50'
                      : isClickable
                        ? 'hover:bg-slate-50 cursor-pointer'
                        : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                      isCompleted
                        ? 'bg-green-100 text-green-600'
                        : isCurrent
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-medium text-center leading-tight ${
                      isCurrent ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
                {idx < WORKFLOW_STEPS.length - 1 && (
                  <div
                    className={`w-4 h-0.5 ${
                      isCompleted ? 'bg-green-300' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info résumé */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg border border-slate-200 p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">
            Heures besoin
          </p>
          <p className="text-lg font-bold text-slate-900 mt-1">
            {stagiaire.heuresEffectuees}/{
              (() => {
                const raw = data.analyse?.dureeEstimeeFormation || '';
                const match = raw.match(/(\d+(?:[.,]\d+)?)/);
                const hoursFromAnalyse = match ? parseFloat(match[1].replace(',', '.')) : 0;
                return hoursFromAnalyse > 0 ? hoursFromAnalyse : stagiaire.heuresPrevues;
              })()
            }h
          </p>
          {data.analyse?.dureeEstimeeFormation && (
            <span className="text-[10px] text-slate-400">
              Issu de l&apos;analyse de besoin
            </span>
          )}
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Paiement</p>
          <p className="text-lg font-bold text-slate-900 mt-1">
            {stagiaire.montantTotal ? `${stagiaire.montantTotal}€` : '-'}
          </p>
          <span className="text-[10px] text-slate-500">{stagiaire.statutPaiement}</span>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Formatrice</p>
          <p className="text-sm font-medium text-slate-900 mt-1">
            {stagiaire.formatriceNom || 'Non assignée'}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Commerciale</p>
          <p className="text-sm font-medium text-slate-900 mt-1">
            {stagiaire.commercialeNom || '-'}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Satisfaction</p>
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span className="text-lg font-bold text-slate-900">
              {data.satisfactionChaud.length > 0
                ? (
                    data.satisfactionChaud.reduce(
                      (sum, s) =>
                        sum +
                        (s.q1ContenuClair + s.q2FormateurExplique + s.q3Progression + s.q4Accueil + s.q5Recommandation) / 5,
                      0
                    ) / data.satisfactionChaud.length
                  ).toFixed(1)
                : '-'}
            </span>
            <span className="text-[10px] text-slate-500">/5</span>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {(() => {
          const activeIdx = STATUT_ORDER.indexOf(activeStep);
          if (activeIdx <= 0) return null;
          const prevStep = STATUT_ORDER[activeIdx - 1];
          const prevLabel =
            WORKFLOW_STEPS.find((s) => s.key === prevStep)?.label || 'Précédent';
          return (
            <div className="mb-4 pb-4 border-b border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setActiveStep(prevStep);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg px-2 py-1 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Précédent : {prevLabel}
              </button>
            </div>
          );
        })()}

        {activeStep === 'inscription' && (
          <FicheStagiaireCard
            stagiaireId={stagiaireId}
            stagiaire={stagiaire}
            onSaved={fetchData}
          />
        )}

        {activeStep === 'test_initial' && (
          <TestInitialForm
            stagiaireId={stagiaireId}
            existingTest={data.testInitial}
            onSaved={fetchData}
          />
        )}

        {activeStep === 'analyse_besoin' && (
          <AnalyseBesoinForm
            stagiaireId={stagiaireId}
            existingAnalyse={data.analyse}
            testInitial={data.testInitial}
            stagiaire={stagiaire}
            inscription={data.inscription}
            onSaved={fetchData}
          />
        )}

        {activeStep === 'evaluation_initiale' && (
          <EvaluationInitialeForm
            stagiaireId={stagiaireId}
            existingEval={data.evalInitiale}
            testInitial={data.testInitial}
            analyse={data.analyse}
            stagiaire={stagiaire}
            onSaved={fetchData}
          />
        )}

        {activeStep === 'en_formation' && (
          <EnFormationStep
            stagiaireId={stagiaireId}
            stagiaire={stagiaire}
            emargements={data.emargements}
            onSaved={fetchData}
          />
        )}

        {activeStep === 'test_final' && (
          <TestFinalSection
            stagiaireId={stagiaireId}
            testFinal={data.testFinal}
            testInitial={data.testInitial}
            onSaved={fetchData}
          />
        )}

        {activeStep === 'evaluation_finale' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Évaluation finale</h2>
            {data.evalFinale ? (
              <div className="space-y-4">
                <p className="text-sm text-green-600 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Évaluation finale générée
                </p>
                {data.evalFinale.comparaisonInitialeFinale && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-2">
                      Comparaison initiale vs finale
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                      {Object.entries(data.evalFinale.comparaisonInitialeFinale).map(
                        ([comp, scores]) => (
                          <div
                            key={comp}
                            className="bg-slate-50 rounded-lg p-3 text-center"
                          >
                            <p className="text-xs text-slate-500 mb-1">{comp}</p>
                            <p className="text-sm">
                              <span className="text-slate-400">
                                {(scores as { initial: number; final: number }).initial}/20
                              </span>
                              {' → '}
                              <span className="font-bold text-slate-900">
                                {(scores as { initial: number; final: number }).final}/20
                              </span>
                            </p>
                            <p
                              className={`text-xs mt-1 ${
                                (scores as { initial: number; final: number }).final >
                                (scores as { initial: number; final: number }).initial
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {(scores as { initial: number; final: number }).final -
                                (scores as { initial: number; final: number }).initial >
                              0
                                ? '+'
                                : ''}
                              {(scores as { initial: number; final: number }).final -
                                (scores as { initial: number; final: number }).initial}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={async () => {
                  await fetch(
                    `/api/admin/stagiaires-formation/${stagiaireId}/evaluation`,
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ typeEvaluation: 'finale' }),
                    }
                  );
                  fetchData();
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Générer l&apos;évaluation finale
              </button>
            )}
          </div>
        )}

        {activeStep === 'terminee' && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <Award className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900">Formation terminée</h2>
              <p className="text-sm text-slate-500 mt-2">
                Attestation de fin de formation disponible
              </p>
            </div>
            <SatisfactionFroidSection
              stagiaireId={stagiaireId}
              existing={data.satisfactionFroid}
              onSaved={fetchData}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Étape en_formation : sous-étape 1 (paiement + désignation)
// puis sous-étape 2 (émargements) après envoi des docs.
// ============================================================
function EnFormationStep({
  stagiaireId,
  stagiaire,
  emargements,
  onSaved,
}: {
  stagiaireId: number;
  stagiaire: StagiaireFormation;
  emargements: Emargement[];
  onSaved: () => void;
}) {
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<'idle' | 'ok' | 'err'>('idle');
  const [errMsg, setErrMsg] = useState('');

  const designationComplete =
    !!stagiaire.formatriceNom
    && !!stagiaire.dateDebutFormation
    && !!stagiaire.horairesFormation
    && Array.isArray(stagiaire.joursFormation)
    && stagiaire.joursFormation.length > 0
    && stagiaire.heuresPrevues > 0;
  const paiementComplete =
    stagiaire.statutPaiement === 'Payé' || stagiaire.statutPaiement === 'Partiel';
  const canSendDocs = designationComplete && paiementComplete;

  const handleSendDocs = async () => {
    setSending(true);
    setSendResult('idle');
    setErrMsg('');
    try {
      // 1. Génère le PDF emploi du temps et l'upload vers Supabase Storage
      //    (via l'endpoint /upload existant, en multipart pour éviter la limite JSON 4.5MB)
      let emploiDuTempsPath: string | null = null;
      try {
        const doc = await generateEmploiDuTempsPdf(stagiaire, emargements);
        const pdfBlob = doc.output('blob');
        const filename = `programme-formation-${(stagiaire.nom || 'stagiaire').replace(/\s+/g, '_')}-${Date.now()}.pdf`;
        const file = new File([pdfBlob], filename, { type: 'application/pdf' });

        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'programmes');

        const upRes = await fetch(
          `/api/admin/stagiaires-formation/${stagiaireId}/upload`,
          { method: 'POST', body: fd },
        );
        if (upRes.ok) {
          const upData = await upRes.json();
          emploiDuTempsPath = upData.path || null;
        } else {
          const txt = await upRes.text().catch(() => '');
          console.warn('[upload PDF] échec HTTP', upRes.status, txt);
        }
      } catch (e) {
        console.warn('[PDF emploi du temps] génération/upload échoués:', e);
      }

      // 2. Envoie à l'endpoint (qui génère une URL signée et forwarde à Make)
      const res = await fetch(
        `/api/admin/stagiaires-formation/${stagiaireId}/send-program-docs`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emploiDuTempsPath }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur' }));
        setSendResult('err');
        setErrMsg(err.error || 'Envoi échoué');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data?.pdfReady === false) {
        setSendResult('err');
        setErrMsg(
          'Mail envoyé mais le PDF du programme n\'a pas pu être uploadé (bucket Supabase ?). Le lien du mail affichera « programme indisponible » — vérifiez la configuration du bucket « documents ».',
        );
      } else {
        setSendResult('ok');
      }
      onSaved();
    } catch {
      setSendResult('err');
      setErrMsg('Erreur réseau');
    } finally {
      setSending(false);
    }
  };

  // Sous-étape 2 : émargements (une fois le mail envoyé)
  if (stagiaire.mailInscriptionEnvoye) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Documents du programme envoyés au stagiaire. Vous pouvez désormais suivre les émargements.
        </div>
        <EmargementSection
          stagiaireId={stagiaireId}
          stagiaire={stagiaire}
          emargements={emargements}
          onRefresh={onSaved}
        />
      </div>
    );
  }

  // Sous-étape 1 : paiement + désignation + bouton Valider
  return (
    <div className="space-y-6">
      <InscriptionPaiementForm
        stagiaireId={stagiaireId}
        stagiaire={stagiaire}
        onSaved={onSaved}
      />
      <hr className="border-slate-200" />
      <DesignationForm
        stagiaireId={stagiaireId}
        stagiaire={stagiaire}
        onSaved={onSaved}
      />

      <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-5">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          Prêt à valider et envoyer les documents ?
        </h3>
        <p className="text-xs text-blue-700 mb-4">
          En validant, un mail est envoyé au stagiaire avec : convention de formation · livret
          d&apos;accueil · règlement intérieur · CGV · convocation · programme pédagogique.
          Vous passerez ensuite à la phase d&apos;émargement.
        </p>

        {!canSendDocs && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <p className="font-semibold mb-1">
              Avant d&apos;envoyer, complétez :
            </p>
            <ul className="list-disc list-inside space-y-0.5">
              {!paiementComplete && <li>Statut paiement à « Payé » (ou « Partiel »)</li>}
              {!designationComplete && (
                <li>Désignation formatrice &amp; planning (tous les champs obligatoires)</li>
              )}
            </ul>
          </div>
        )}

        {sendResult === 'err' && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {errMsg}
          </div>
        )}

        <button
          type="button"
          onClick={handleSendDocs}
          disabled={sending || !canSendDocs}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Valider et envoyer le mail du programme
        </button>
      </div>
    </div>
  );
}

