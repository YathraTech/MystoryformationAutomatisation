'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  UserPlus,
  Trash2,
  AlertCircle,
  Shield,
  Briefcase,
  Mail,
  Check,
  Lock,
  Pencil,
  X,
  Target,
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

type UserRole = 'admin' | 'commercial';

interface StaffUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: UserRole;
  lieu: string;
  objectifCa: number | null;
  createdAt: string;
}

const ROLES: { value: UserRole; label: string; icon: typeof Shield; color: string }[] = [
  { value: 'admin', label: 'Administrateur', icon: Shield, color: 'bg-purple-50 text-purple-700' },
  { value: 'commercial', label: 'Commercial', icon: Briefcase, color: 'bg-green-50 text-green-700' },
];

const LIEUX = [
  { value: 'Gagny', label: 'Gagny' },
  { value: 'Sarcelles', label: 'Sarcelles' },
] as const;

type UserLieu = typeof LIEUX[number]['value'];

function getRoleConfig(role: UserRole) {
  return ROLES.find((r) => r.value === role) || ROLES[1];
}

export default function StaffPage() {
  const { role, loading: authLoading } = useAdminAuth();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [sendingReset, setSendingReset] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState<string | null>(null);
  const [editingObjectifId, setEditingObjectifId] = useState<string | null>(null);
  const [editingObjectifValue, setEditingObjectifValue] = useState('');
  const [savingObjectif, setSavingObjectif] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    nom: '',
    prenom: '',
    role: 'commercial' as UserRole,
    lieu: 'Gagny' as UserLieu,
    definePassword: false,
  });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/staff');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const payload = {
        email: form.email,
        nom: form.nom,
        prenom: form.prenom,
        role: form.role,
        lieu: form.lieu,
        ...(form.definePassword && form.password ? { password: form.password } : {}),
      };

      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setForm({ email: '', password: '', nom: '', prenom: '', role: 'commercial', lieu: 'Gagny', definePassword: false });
        setShowForm(false);
        await fetchUsers();
      } else {
        const data = await res.json();
        setFormError(data.error || 'Erreur lors de la création');
      }
    } catch {
      setFormError('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setDeleting(null);
    }
  };

  const handleSendPasswordReset = async (id: string, email: string) => {
    if (!confirm(`Envoyer un email de réinitialisation de mot de passe à ${email} ?`)) return;

    setSendingReset(id);
    try {
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: 'POST',
      });

      if (res.ok) {
        setResetSent(id);
        setTimeout(() => setResetSent(null), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de l\'envoi');
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setSendingReset(null);
    }
  };

  const handleUpdateObjectif = async (userId: string) => {
    setSavingObjectif(true);
    try {
      const value = editingObjectifValue.trim() === '' ? null : parseFloat(editingObjectifValue);
      const res = await fetch(`/api/admin/staff/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectifCa: value }),
      });
      if (res.ok) {
        await fetchUsers();
        setEditingObjectifId(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur');
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setSavingObjectif(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-3 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Accès restreint</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          Cette page est réservée aux administrateurs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Équipe</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Ajouter un membre
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">
            Nouveau membre
          </h2>

          {formError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {formError}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Prénom *
                </label>
                <input
                  type="text"
                  required
                  value={form.prenom}
                  onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  placeholder="Jean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  placeholder="Dupont"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  placeholder="jean@mystoryformation.fr"
                />
              </div>
            </div>

            {/* Option mot de passe */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.definePassword}
                  onChange={(e) => setForm({ ...form, definePassword: e.target.checked, password: '' })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Définir un mot de passe
                </span>
              </label>

              {form.definePassword ? (
                <div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    placeholder="Min. 6 caractères"
                  />
                  <p className="mt-1.5 text-xs text-slate-500">
                    Le membre recevra un email de confirmation de création d&apos;accès.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                  Le membre recevra un email avec un lien pour définir son mot de passe.
                </p>
              )}
            </div>

            {/* Sélection du rôle avec boutons */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rôle *
              </label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  const isSelected = form.role === role.value;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setForm({ ...form, role: role.value })}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {role.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {form.role === 'admin' && 'Accès complet à toutes les fonctionnalités'}
                {form.role === 'commercial' && 'Gestion des inscriptions et des relances'}
              </p>
            </div>

            {/* Sélection du lieu */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Lieu d&apos;affectation *
              </label>
              <div className="flex flex-wrap gap-2">
                {LIEUX.map((lieu) => {
                  const isSelected = form.lieu === lieu.value;
                  return (
                    <button
                      key={lieu.value}
                      type="button"
                      onClick={() => setForm({ ...form, lieu: lieu.value })}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {lieu.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors disabled:opacity-60"
              >
                {submitting ? 'Création...' : 'Créer le membre'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Users table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-5 py-3 font-semibold text-slate-600">
                  Membre
                </th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">
                  Email
                </th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">
                  Rôle
                </th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">
                  Lieu
                </th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">
                  Objectif CA
                </th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">
                  Créé le
                </th>
                <th className="text-right px-5 py-3 font-semibold text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const roleConfig = getRoleConfig(user.role);
                const Icon = roleConfig.icon;
                return (
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-800">
                        {user.prenom} {user.nom}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{user.email}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${roleConfig.color}`}
                      >
                        <Icon className="h-3 w-3" />
                        {roleConfig.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {user.lieu || '-'}
                    </td>
                    <td className="px-5 py-3.5">
                      {user.role === 'commercial' ? (
                        editingObjectifId === user.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="100"
                              min="0"
                              value={editingObjectifValue}
                              onChange={(e) => setEditingObjectifValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdateObjectif(user.id);
                                if (e.key === 'Escape') setEditingObjectifId(null);
                              }}
                              className="w-24 rounded-lg border border-blue-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                              autoFocus
                              disabled={savingObjectif}
                            />
                            <button
                              onClick={() => handleUpdateObjectif(user.id)}
                              disabled={savingObjectif}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingObjectifId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-50 rounded"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            className="flex items-center gap-1.5 group cursor-pointer"
                            onClick={() => {
                              setEditingObjectifId(user.id);
                              setEditingObjectifValue(user.objectifCa?.toString() || '');
                            }}
                          >
                            {user.objectifCa ? (
                              <span className="flex items-center gap-1 text-sm text-slate-700">
                                <Target className="h-3.5 w-3.5 text-blue-500" />
                                {user.objectifCa.toLocaleString('fr-FR')} €
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Non défini</span>
                            )}
                            <Pencil className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Bouton réinitialiser mot de passe */}
                        <button
                          onClick={() => handleSendPasswordReset(user.id, user.email)}
                          disabled={sendingReset === user.id}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            resetSent === user.id
                              ? 'text-green-700 bg-green-50 border border-green-200'
                              : 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                          } disabled:opacity-40`}
                        >
                          {sendingReset === user.id ? (
                            <>
                              <span className="h-3 w-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin block" />
                              Envoi...
                            </>
                          ) : resetSent === user.id ? (
                            <>
                              <Check className="h-3 w-3" />
                              Envoyé
                            </>
                          ) : (
                            <>
                              <Mail className="h-3 w-3" />
                              Réinitialiser MDP
                            </>
                          )}
                        </button>
                        {/* Bouton supprimer */}
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={deleting === user.id}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    Aucun membre
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
