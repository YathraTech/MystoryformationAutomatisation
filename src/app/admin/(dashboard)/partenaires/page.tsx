'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  Building2, Users, Euro, TrendingUp, Plus, Loader2, Mail, MapPin,
  Check, Eye, EyeOff, Calendar, ExternalLink, Copy, AlertCircle, Trash2, X,
} from 'lucide-react';

interface Partenaire {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  organisation: string | null;
  lieu: string | null;
  createdAt: string;
  totalCandidats: number;
  caMois: number;
  ventesMois: number;
  caTotal: number;
  reussi: number;
  echoue: number;
  absent: number;
  aVenir: number;
}

const formatEur = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PartenairesPage() {
  const { role } = useAdminAuth();
  const isAdmin = role === 'admin';

  const [partenaires, setPartenaires] = useState<Partenaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Formulaire de création
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [form, setForm] = useState({ email: '', password: '', nom: '', prenom: '', organisation: '', lieu: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Popup envoi identifiants
  const [confirmSendId, setConfirmSendId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendResult, setResendResult] = useState<{ id: string; success: boolean } | null>(null);

  // Suppression
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchPartenaires = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/partenaires');
      if (res.ok) {
        const data = await res.json();
        setPartenaires(data.partenaires);
      } else {
        setError('Erreur lors du chargement');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartenaires();
  }, [fetchPartenaires]);

  const handleCreate = async () => {
    setCreateError('');
    setCreateSuccess('');

    if (!form.email || !form.nom || !form.prenom || !form.password) {
      setCreateError('Tous les champs obligatoires doivent être remplis');
      return;
    }
    if (form.password.length < 6) {
      setCreateError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          nom: form.nom,
          prenom: form.prenom,
          role: 'partenaire',
          lieu: form.lieu || null,
          organisation: form.organisation || null,
        }),
      });

      if (res.ok) {
        setCreateSuccess(`Accès créé pour ${form.email}`);
        setForm({ email: '', password: '', nom: '', prenom: '', organisation: '', lieu: '' });
        fetchPartenaires();
        setTimeout(() => {
          setShowCreate(false);
          setCreateSuccess('');
        }, 3000);
      } else {
        const data = await res.json();
        setCreateError(data.error || 'Erreur lors de la création');
      }
    } catch {
      setCreateError('Erreur réseau');
    } finally {
      setCreating(false);
    }
  };

  const copyCredentials = () => {
    const text = `Email: ${form.email}\nMot de passe: ${form.password}\nURL: ${window.location.origin}/partenaire/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendCredentialsEmail = async (email: string, password: string, nom: string, prenom: string, organisation?: string) => {
    try {
      const res = await fetch('/api/admin/partenaires/send-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nom, prenom, organisation }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const handleSendAfterCreate = async () => {
    if (!form.email || !form.password) return;
    setSendingEmail(true);
    const ok = await sendCredentialsEmail(form.email, form.password, form.nom, form.prenom, form.organisation);
    if (ok) {
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    }
    setSendingEmail(false);
  };

  const handleConfirmSend = async (p: Partenaire) => {
    setResendingId(p.id);
    setResendResult(null);
    try {
      const res = await fetch('/api/admin/partenaires/send-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: p.email,
          nom: p.nom,
          prenom: p.prenom,
          organisation: p.organisation,
          userId: p.id,
        }),
      });
      setResendResult({ id: p.id, success: res.ok });
    } catch {
      setResendResult({ id: p.id, success: false });
    }
    setResendingId(null);
    setConfirmSendId(null);
    setTimeout(() => setResendResult(null), 3000);
  };

  const handleDeletePartenaire = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPartenaires((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      // silently fail
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  // Totaux
  const totalCandidats = partenaires.reduce((s, p) => s + p.totalCandidats, 0);
  const totalCaMois = partenaires.reduce((s, p) => s + p.caMois, 0);
  const totalCaGlobal = partenaires.reduce((s, p) => s + p.caTotal, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-3 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Partenaires</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gestion des entreprises partenaires et suivi du CA</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouvel accès partenaire
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Formulaire de création */}
      {showCreate && (
        <div className="bg-white rounded-xl border-2 border-violet-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-violet-800 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Créer un accès partenaire
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nom *</label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="Nom du contact"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Prénom *</label>
              <input
                type="text"
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="Prénom du contact"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="email@entreprise.fr"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Mot de passe *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 pr-10 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="Min. 6 caractères"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Organisation</label>
              <input
                type="text"
                value={form.organisation}
                onChange={(e) => setForm({ ...form, organisation: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="Nom de l'entreprise"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Centre rattaché</label>
              <select
                value={form.lieu}
                onChange={(e) => setForm({ ...form, lieu: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="">Aucun</option>
                <option value="Gagny">Gagny</option>
                <option value="Sarcelles">Sarcelles</option>
              </select>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Créer l&apos;accès
            </button>
            {form.email && form.password && (
              <>
                <button
                  onClick={copyCredentials}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copié !' : 'Copier les identifiants'}
                </button>
                <button
                  onClick={handleSendAfterCreate}
                  disabled={sendingEmail}
                  className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 transition-colors disabled:opacity-50"
                >
                  {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  {emailSent ? 'Envoyé !' : 'Envoyer par email'}
                </button>
              </>
            )}
            <button
              onClick={() => { setShowCreate(false); setCreateError(''); setCreateSuccess(''); }}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Annuler
            </button>
          </div>

          {createError && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {createError}
            </p>
          )}
          {createSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
              <Check className="h-4 w-4" />
              {createSuccess}
              <a
                href="/partenaire/login"
                target="_blank"
                className="ml-2 inline-flex items-center gap-1 text-green-800 font-medium hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Page de connexion
              </a>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Building2 className="h-4 w-4" />
            <span className="text-xs font-medium">Partenaires</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{partenaires.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium">Candidats total</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalCandidats}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Euro className="h-4 w-4" />
            <span className="text-xs font-medium">CA ce mois</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{formatEur(totalCaMois)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">CA total</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatEur(totalCaGlobal)}</p>
        </div>
      </div>

      {/* Liste des partenaires */}
      {partenaires.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Building2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Aucun partenaire enregistré</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-[1fr_100px_90px_90px_100px_120px] border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
            <div className="px-4 py-3">Partenaire</div>
            <div className="px-4 py-3">Candidats</div>
            <div className="px-4 py-3">CA mois</div>
            <div className="px-4 py-3">CA total</div>
            <div className="px-4 py-3">Résultats</div>
            <div className="px-4 py-3">Actions</div>
          </div>

          <div className="divide-y divide-slate-100">
            {partenaires.map((p) => (
              <div key={p.id} className="grid grid-cols-[1fr_100px_90px_90px_100px_120px] hover:bg-slate-50 transition-colors relative">
                <div className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">
                      {p.organisation || `${p.prenom} ${p.nom}`}
                    </span>
                    {p.lieu && (
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-none ${
                        p.lieu === 'Gagny' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                        {p.lieu}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail className="h-3 w-3" />
                    <span>{p.email}</span>
                    {!p.organisation && (
                      <>
                        <span className="text-slate-300">|</span>
                        <span>{p.prenom} {p.nom}</span>
                      </>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" />
                    Créé le {formatDate(p.createdAt)}
                  </p>
                </div>

                <div className="px-4 py-3.5 flex items-center">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{p.totalCandidats}</p>
                    {p.ventesMois > 0 && (
                      <p className="text-[10px] text-emerald-600">+{p.ventesMois} ce mois</p>
                    )}
                  </div>
                </div>

                <div className="px-4 py-3.5 flex items-center">
                  <p className="text-sm font-bold text-emerald-600">{formatEur(p.caMois)}</p>
                </div>

                <div className="px-4 py-3.5 flex items-center">
                  <p className="text-sm font-medium text-slate-700">{formatEur(p.caTotal)}</p>
                </div>

                <div className="px-4 py-3.5 flex items-center">
                  <div className="flex gap-1.5 text-[10px] font-medium">
                    {p.reussi > 0 && <span className="rounded-full bg-green-100 text-green-700 px-1.5 py-0.5">{p.reussi} R</span>}
                    {p.echoue > 0 && <span className="rounded-full bg-red-100 text-red-700 px-1.5 py-0.5">{p.echoue} E</span>}
                    {p.absent > 0 && <span className="rounded-full bg-orange-100 text-orange-700 px-1.5 py-0.5">{p.absent} A</span>}
                    {p.aVenir > 0 && <span className="rounded-full bg-blue-100 text-blue-700 px-1.5 py-0.5">{p.aVenir} V</span>}
                    {p.totalCandidats === 0 && <span className="text-slate-400">—</span>}
                  </div>
                </div>

                <div className="px-4 py-3.5 flex items-center gap-1.5">
                  <a
                    href="/partenaire/login"
                    target="_blank"
                    className="p-1 text-violet-500 hover:text-violet-700 hover:bg-violet-50 rounded transition-colors"
                    title="Ouvrir le portail partenaire"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => setConfirmSendId(p.id)}
                        disabled={resendingId === p.id}
                        className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                        title="Envoyer les identifiants par email"
                      >
                        {resendingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(p.id)}
                        disabled={deletingId === p.id}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Supprimer le partenaire"
                      >
                        {deletingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </>
                  )}
                  {resendResult?.id === p.id && (
                    <span className={`text-[10px] ${resendResult.success ? 'text-emerald-600' : 'text-red-500'}`}>
                      {resendResult.success ? 'Envoyé !' : 'Erreur'}
                    </span>
                  )}
                </div>

                {/* Popup confirmation envoi email */}
                {confirmSendId === p.id && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-80 bg-white rounded-xl border border-slate-200 shadow-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-800">Envoyer les identifiants</h3>
                      <button onClick={() => setConfirmSendId(null)} className="text-slate-400 hover:text-slate-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Êtes-vous sûr de vouloir envoyer un email à <strong>{p.email}</strong> avec les informations de connexion ?
                    </p>
                    <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Un nouveau mot de passe sera généré automatiquement et envoyé avec l&apos;email et le lien de connexion.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleConfirmSend(p)}
                        disabled={resendingId === p.id}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {resendingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                        Confirmer et envoyer
                      </button>
                      <button
                        onClick={() => setConfirmSendId(null)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {/* Popup confirmation suppression */}
                {confirmDeleteId === p.id && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-72 bg-white rounded-xl border border-red-200 shadow-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-red-700">Supprimer le partenaire</h3>
                      <button onClick={() => setConfirmDeleteId(null)} className="text-slate-400 hover:text-slate-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-600">
                      Supprimer <strong>{p.organisation || `${p.prenom} ${p.nom}`}</strong> ? Cette action est irréversible.
                      {p.totalCandidats > 0 && (
                        <span className="block mt-1 text-orange-600">
                          Ce partenaire a {p.totalCandidats} candidat{p.totalCandidats > 1 ? 's' : ''} enregistré{p.totalCandidats > 1 ? 's' : ''}.
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeletePartenaire(p.id)}
                        disabled={deletingId === p.id}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {deletingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Supprimer
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
