'use client';

import { useState } from 'react';
import { CheckCircle2, FileText, ArrowRight, Loader2, Download } from 'lucide-react';
import type { Evaluation, TestFormation, AnalyseBesoin, StagiaireFormation } from '@/types/admin';
import { generateEvaluationInitialePdf } from '@/lib/utils/formation-pdf-generator';

interface Props {
  stagiaireId: number;
  existingEval: Evaluation | null;
  testInitial: TestFormation | null;
  analyse: AnalyseBesoin | null;
  stagiaire: StagiaireFormation;
  onSaved: () => void;
}

const NIVEAUX_GRILLE = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
type NiveauGrille = typeof NIVEAUX_GRILLE[number];

function niveauFromScore(score: number | null | undefined): NiveauGrille {
  if (score === null || score === undefined) return 'A0';
  if (score >= 19) return 'C2';
  if (score >= 17) return 'C1';
  if (score >= 15) return 'B2';
  if (score >= 12) return 'B1';
  if (score >= 8) return 'A2';
  if (score >= 4) return 'A1';
  return 'A0';
}

export default function EvaluationInitialeForm({
  stagiaireId, existingEval, testInitial, analyse, stagiaire, onSaved,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [recueil, setRecueil] = useState({
    // FORMATION
    scolarisationFrance: existingEval?.scolarisationFrance ?? false,
    scolarisationEtranger: existingEval?.scolarisationEtranger ?? false,
    scolarisationOu: existingEval?.scolarisationOu ?? '',
    scolarisationQuand: existingEval?.scolarisationQuand ?? '',
    alphabetisation: existingEval?.alphabetisation ?? false,
    // FORMATION LINGUISTIQUE
    coursFrancais: existingEval?.coursFrancais ?? false,
    coursFrancaisDetail: existingEval?.coursFrancaisDetail ?? '',
    anglais: existingEval?.anglais ?? false,
    diplomesLangues: existingEval?.diplomesLangues ?? '',
    languesParlees: existingEval?.languesParlees ?? '',
    // OUTILS INFORMATIQUES
    smartphoneTablette: existingEval?.smartphoneTablette ?? false,
    ordinateurMaison: existingEval?.ordinateurMaison ?? false,
    accesInternet: existingEval?.accesInternet ?? false,
    utilisationBoiteMail: existingEval?.utilisationBoiteMail ?? false,
    usageOrdinateur: existingEval?.usageOrdinateur ?? true,
    maitriseClavier: existingEval?.maitriseClavier ?? true,
    sessionOrdinateur: existingEval?.sessionOrdinateur ?? false,
    // MOTIVATION & OBJECTIF
    motivation: existingEval?.motivation ?? '',
    apresFormation: existingEval?.apresFormation ?? '',
    besoinsVieQuotidienne: existingEval?.besoinsVieQuotidienne ?? 0,
    besoinsVieProfessionnelle: existingEval?.besoinsVieProfessionnelle ?? 0,
    certificationVisee: existingEval?.certificationVisee ?? true,
    certificationViseeDetail:
      existingEval?.certificationViseeDetail
      ?? analyse?.typeCertificationVisee?.join(', ')
      ?? 'TEF IRN',
    besoinsSpecifiques: existingEval?.besoinsSpecifiques ?? '',
  });

  const [remarques, setRemarques] = useState(existingEval?.remarques ?? '');

  const grilleFromTest: Record<'CE' | 'CO' | 'EE' | 'EO', NiveauGrille> = {
    CE: niveauFromScore(testInitial?.scoreCe),
    CO: niveauFromScore(testInitial?.scoreCo),
    EE: niveauFromScore(testInitial?.scoreEe),
    EO: niveauFromScore(testInitial?.scoreEo),
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/stagiaires-formation/${stagiaireId}/evaluation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typeEvaluation: 'initiale',
          recueil,
          remarques,
          signatureIntervenant: stagiaire.formatriceNom || stagiaire.commercialeNom,
        }),
      });
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAdvance = async () => {
    setAdvancing(true);
    try {
      await fetch(`/api/admin/stagiaires-formation/${stagiaireId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'en_formation' }),
      });
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setAdvancing(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!existingEval) return;
    setDownloading(true);
    try {
      const doc = await generateEvaluationInitialePdf(stagiaire, existingEval, testInitial);
      const nomFichier = `Evaluation-initiale-${stagiaire.nom}-${stagiaire.prenom}.pdf`
        .replace(/\s+/g, '_');
      doc.save(nomFichier);
    } catch (err) {
      console.error('[PDF evaluation initiale]', err);
    } finally {
      setDownloading(false);
    }
  };

  const formateurNom = stagiaire.formatriceNom || stagiaire.commercialeNom || '—';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Évaluation initiale</h2>
        {existingEval && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Générée
          </span>
        )}
      </div>

      {/* ===== Identification (auto-remplie depuis la fiche) ===== */}
      <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <InfoRead label="Nom" value={stagiaire.nom} />
          <InfoRead label="Nom de jeune fille" value={stagiaire.nomJeuneFille || '—'} />
          <InfoRead label="Prénom" value={stagiaire.prenom} />
          <InfoRead label="Formateur" value={formateurNom} />
        </div>
      </div>

      {/* ===== SECTION 1 : FORMATION ===== */}
      <SectionHeader title="FORMATION" />
      <div className="mb-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <OuiNon
            label="Scolarisation en France"
            value={recueil.scolarisationFrance}
            onChange={(v) =>
              setRecueil({
                ...recueil,
                scolarisationFrance: v,
                // Exclusion mutuelle : si OUI ici, l'étranger passe à NON
                scolarisationEtranger: v ? false : recueil.scolarisationEtranger,
              })
            }
          />
          <OuiNon
            label="Scolarisation à l'étranger"
            value={recueil.scolarisationEtranger}
            onChange={(v) =>
              setRecueil({
                ...recueil,
                scolarisationEtranger: v,
                scolarisationFrance: v ? false : recueil.scolarisationFrance,
              })
            }
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Où</label>
            <input
              type="text"
              placeholder="Pays, ville, établissement..."
              value={recueil.scolarisationOu}
              onChange={(e) => setRecueil({ ...recueil, scolarisationOu: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Quand</label>
            <input
              type="text"
              placeholder="Années, période..."
              value={recueil.scolarisationQuand}
              onChange={(e) => setRecueil({ ...recueil, scolarisationQuand: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* ===== SECTION 2 : FORMATION LINGUISTIQUE ===== */}
      <SectionHeader title="FORMATION LINGUISTIQUE" />
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <OuiNon
            label="Cours dans la langue étudiée"
            value={recueil.coursFrancais}
            onChange={(v) => setRecueil({ ...recueil, coursFrancais: v })}
          />
          <OuiNon
            label="Anglais"
            value={recueil.anglais}
            onChange={(v) => setRecueil({ ...recueil, anglais: v })}
          />
        </div>
        {recueil.coursFrancais && (
          <div>
            <label className="block text-xs text-slate-500 mb-1">Précisez (où, quand)</label>
            <input
              type="text"
              value={recueil.coursFrancaisDetail}
              onChange={(e) => setRecueil({ ...recueil, coursFrancaisDetail: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
        )}
        <div>
          <label className="block text-xs text-slate-500 mb-1">Langues parlée(s) / écrite(s)</label>
          <input
            type="text"
            value={recueil.languesParlees}
            onChange={(e) => setRecueil({ ...recueil, languesParlees: e.target.value })}
            placeholder="Ex: Arabe (parlée, écrite), Anglais (parlée)"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </div>
      </div>

      {/* ===== SECTION 3 : OUTILS INFORMATIQUES ET NUMÉRIQUES ===== */}
      <SectionHeader title="OUTILS INFORMATIQUES ET NUMÉRIQUES" />
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        <OuiNon
          label="Smartphone / tablette"
          value={recueil.smartphoneTablette}
          onChange={(v) => setRecueil({ ...recueil, smartphoneTablette: v })}
        />
        <OuiNon
          label="Ordinateur à la maison"
          value={recueil.ordinateurMaison}
          onChange={(v) => setRecueil({ ...recueil, ordinateurMaison: v })}
        />
        <OuiNon
          label="Accès à internet"
          value={recueil.accesInternet}
          onChange={(v) => setRecueil({ ...recueil, accesInternet: v })}
        />
        <OuiNon
          label="Utilisation boîte mail"
          value={recueil.utilisationBoiteMail}
          onChange={(v) => setRecueil({ ...recueil, utilisationBoiteMail: v })}
        />
      </div>

      {/* ===== SECTION 4 : MOTIVATION ET OBJECTIF DE L'APPRENTISSAGE ===== */}
      <SectionHeader title="MOTIVATION ET OBJECTIF DE L'APPRENTISSAGE" />
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">
            Pourquoi voulez-vous apprendre ? <span className="text-red-500">*</span>
          </label>
          <textarea
            value={recueil.motivation}
            onChange={(e) => setRecueil({ ...recueil, motivation: e.target.value })}
            placeholder="Objectifs personnels, professionnels..."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ScaleField
            label="Besoins — vie quotidienne (0 à 5)"
            value={recueil.besoinsVieQuotidienne}
            onChange={(v) => setRecueil({ ...recueil, besoinsVieQuotidienne: v })}
          />
          <ScaleField
            label="Besoins — vie professionnelle (0 à 5)"
            value={recueil.besoinsVieProfessionnelle}
            onChange={(v) => setRecueil({ ...recueil, besoinsVieProfessionnelle: v })}
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <input
              type="checkbox"
              checked={recueil.certificationVisee}
              onChange={(e) => setRecueil({ ...recueil, certificationVisee: e.target.checked })}
              className="rounded border-slate-300"
            />
            Certificat visé
          </label>
          {recueil.certificationVisee && (
            <input
              type="text"
              placeholder="TEF IRN, DELF, DALF..."
              value={recueil.certificationViseeDetail}
              onChange={(e) => setRecueil({ ...recueil, certificationViseeDetail: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          )}
        </div>
      </div>

      {/* ===== Besoins spécifiques (avant la grille de résultats) ===== */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Besoins spécifiques
        </label>
        <textarea
          value={recueil.besoinsSpecifiques}
          onChange={(e) => setRecueil({ ...recueil, besoinsSpecifiques: e.target.value })}
          placeholder="Décrivez les besoins spécifiques du stagiaire (aménagements, points à travailler en priorité...)"
          rows={3}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
        />
      </div>

      {/* ===== SECTION 5 : RÉSULTATS ÉVALUATION ===== */}
      <SectionHeader title="RÉSULTATS ÉVALUATION" />
      {testInitial ? (
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-slate-600 border-b border-slate-200">
                  Compétence
                </th>
                {NIVEAUX_GRILLE.map((n) => (
                  <th
                    key={n}
                    className="text-center px-2 py-2 font-semibold text-slate-600 border-b border-slate-200 w-12"
                  >
                    {n}
                  </th>
                ))}
                <th className="text-center px-3 py-2 font-medium text-slate-600 border-b border-slate-200">
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Compréhension écrite', key: 'CE' as const, score: testInitial.scoreCe },
                { label: 'Compréhension orale', key: 'CO' as const, score: testInitial.scoreCo },
                { label: 'Expression écrite', key: 'EE' as const, score: testInitial.scoreEe },
                { label: 'Expression orale', key: 'EO' as const, score: testInitial.scoreEo },
              ].map(({ label, key, score }) => {
                const niveau = grilleFromTest[key];
                return (
                  <tr key={key} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2 font-medium text-slate-700">{label}</td>
                    {NIVEAUX_GRILLE.map((n) => (
                      <td key={n} className="text-center px-2 py-2">
                        <span
                          className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                            niveau === n
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-50 text-slate-300'
                          }`}
                        >
                          {niveau === n ? '✓' : ''}
                        </span>
                      </td>
                    ))}
                    <td className="text-center px-3 py-2 font-bold text-slate-900">
                      {score}/20
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-xs text-slate-500 mt-2">
            Niveau global estimé : <strong className="text-slate-700">{testInitial.niveauEstime}</strong> —
            Profil : <strong className="text-slate-700">{testInitial.profilPedagogique || '—'}</strong>
          </p>
        </div>
      ) : (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Aucun test initial enregistré. Retournez à l&apos;étape « Test initial » pour saisir les scores.
        </div>
      )}

      {/* ===== Remarques ===== */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Remarques</label>
        <textarea
          value={remarques}
          onChange={(e) => setRemarques(e.target.value)}
          placeholder="Observations, points d'attention, besoins spécifiques..."
          rows={3}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
        />
      </div>

      <div className="mt-6 flex items-center justify-end gap-2">
        {existingEval && (
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
            title="Télécharger l'évaluation au format PDF"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Télécharger PDF
          </button>
        )}

        <button
          disabled={saving}
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          {saving ? 'Génération...' : existingEval ? 'Mettre à jour' : 'Générer l\'évaluation initiale'}
        </button>

        {existingEval && (
          <button
            onClick={handleAdvance}
            disabled={advancing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {advancing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Passer à la formation
          </button>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-3 mt-2 rounded-md bg-slate-800 px-3 py-1.5">
      <h3 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h3>
    </div>
  );
}

function InfoRead({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="font-medium text-slate-900">{value || '—'}</p>
    </div>
  );
}

function OuiNon({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
      <span className="text-sm text-slate-700">{label}</span>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
            value
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'
          }`}
        >
          OUI
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
            !value
              ? 'bg-red-600 text-white'
              : 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-700'
          }`}
        >
          NON
        </button>
      </div>
    </div>
  );
}

function ScaleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <div className="flex items-center gap-1">
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-8 w-8 rounded border text-sm font-semibold transition-colors ${
              value === n
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
