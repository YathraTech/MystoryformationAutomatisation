'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Upload, X, FileText, Image } from 'lucide-react';

const SOURCES = ['Appel', 'WhatsApp', 'CPF', 'Site', 'Bouche-à-oreille', 'Réseau social', 'Partenaire'];
const PRESTATIONS = ['Formation TEF IRN', 'Examen TEF IRN', 'Examen civique', 'Pack TEF+Civique', 'Pack complet'];

interface Agent {
  id: string;
  prenom: string;
  nom: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

export default function NouveauStagiairePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);

  // Fichiers uploads
  const [photoPiFiles, setPhotoPiFiles] = useState<File[]>([]);
  const [photoCandidatFiles, setPhotoCandidatFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState('');
  const piInputRef = useRef<HTMLInputElement>(null);
  const candidatInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    civilite: 'M.',
    nom: '',
    nomJeuneFille: '',
    prenom: '',
    dateNaissance: '',
    nationalite: '',
    telephone: '',
    email: '',
    adressePostale: '',
    numeroPieceIdentite: '',
    typePiece: 'Passeport',
    agence: 'Gagny',
    commercialeId: '',
    sourceProvenance: '',
    typePrestation: 'Formation TEF IRN',
  });

  // Charger la liste des commerciales
  useEffect(() => {
    fetch('/api/agents')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Agent[]) => setAgents(Array.isArray(data) ? data : []))
      .catch(() => setAgents([]));
  }, []);

  // Validation des fichiers
  const validateAndAddFiles = useCallback(
    (newFiles: File[], current: File[], setter: (files: File[]) => void) => {
      setFileError('');
      for (const file of newFiles) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setFileError(`"${file.name}" : format non autorisé. Formats acceptés : PDF, JPG, PNG`);
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          setFileError(`"${file.name}" : le fichier dépasse 10 Mo`);
          return;
        }
      }
      if (current.length + newFiles.length > 5) {
        setFileError('Maximum 5 fichiers autorisés');
        return;
      }
      setter([...current, ...newFiles]);
    },
    []
  );

  const removeFile = (files: File[], index: number, setter: (files: File[]) => void) => {
    setter(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Trouver le nom de la commerciale
      const selectedAgent = agents.find((a) => a.id === form.commercialeId);

      const res = await fetch('/api/admin/stagiaires-formation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          commercialeNom: selectedAgent ? `${selectedAgent.prenom} ${selectedAgent.nom}` : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erreur lors de la création');
        setSaving(false);
        return;
      }

      const data = await res.json();
      const stagiaireId = data.id;

      // Upload des fichiers Photo PI
      if (photoPiFiles.length > 0) {
        const urls: string[] = [];
        for (const file of photoPiFiles) {
          const uploadUrl = await uploadFileToStorage(stagiaireId, 'pieces_identite', file);
          if (uploadUrl) urls.push(uploadUrl);
        }
        if (urls.length > 0) {
          await fetch(`/api/admin/stagiaires-formation/${stagiaireId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoPieceIdentite: urls }),
          });
        }
      }

      // Upload des fichiers Photo Candidat
      if (photoCandidatFiles.length > 0) {
        const urls: string[] = [];
        for (const file of photoCandidatFiles) {
          const uploadUrl = await uploadFileToStorage(stagiaireId, 'photos_candidat', file);
          if (uploadUrl) urls.push(uploadUrl);
        }
        if (urls.length > 0) {
          await fetch(`/api/admin/stagiaires-formation/${stagiaireId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoCandidat: urls }),
          });
        }
      }

      router.push(`/admin/suivi-formation/${stagiaireId}`);
    } catch {
      setError('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/suivi-formation')}
          className="p-2 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Nouveau stagiaire</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {fileError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm">
          {fileError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        {/* Civilité & Identité */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Informations personnelles</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Civilité *</label>
              <select
                value={form.civilite}
                onChange={(e) => setForm({ ...form, civilite: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              >
                <option value="M.">M.</option>
                <option value="Mme">Mme</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Nom d'usage *</label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Nom de jeune fille</label>
              <input
                type="text"
                value={form.nomJeuneFille}
                onChange={(e) => setForm({ ...form, nomJeuneFille: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Prénom *</label>
              <input
                type="text"
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Date de naissance *</label>
              <input
                type="date"
                value={form.dateNaissance}
                onChange={(e) => setForm({ ...form, dateNaissance: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Nationalité *</label>
              <input
                type="text"
                value={form.nationalite}
                onChange={(e) => setForm({ ...form, nationalite: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Téléphone *</label>
              <input
                type="tel"
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Adresse postale *</label>
              <input
                type="text"
                value={form.adressePostale}
                onChange={(e) => setForm({ ...form, adressePostale: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>
          </div>
        </div>

        {/* Pièce d'identité */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Pièce d'identité</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Type de pièce *</label>
              <select
                value={form.typePiece}
                onChange={(e) => setForm({ ...form, typePiece: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              >
                <option value="Passeport">Passeport</option>
                <option value="CNI">CNI</option>
                <option value="Titre de séjour">Titre de séjour</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">N° pièce d'identité *</label>
              <input
                type="text"
                value={form.numeroPieceIdentite}
                onChange={(e) => setForm({ ...form, numeroPieceIdentite: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>
          </div>

          {/* Upload Photo PI */}
          <div className="mt-4">
            <label className="block text-xs text-slate-500 mb-1">
              Photo / Scan de la pièce d'identité *
            </label>
            <div
              onClick={() => piInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
            >
              <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">
                Cliquez pour ajouter un fichier (PDF, JPG, PNG - max 10 Mo)
              </p>
              <input
                ref={piInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    validateAndAddFiles(Array.from(e.target.files), photoPiFiles, setPhotoPiFiles);
                  }
                  e.target.value = '';
                }}
              />
            </div>
            {photoPiFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {photoPiFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      {file.type === 'application/pdf' ? (
                        <FileText className="h-4 w-4 text-red-500" />
                      ) : (
                        <Image className="h-4 w-4 text-blue-500" />
                      )}
                      <span className="text-slate-700 truncate max-w-[200px]">{file.name}</span>
                      <span className="text-xs text-slate-400">
                        ({(file.size / 1024 / 1024).toFixed(1)} Mo)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(photoPiFiles, idx, setPhotoPiFiles)}
                      className="p-1 hover:bg-red-50 rounded"
                    >
                      <X className="h-3 w-3 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Photo candidat */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Photo d'identité du candidat</h2>
          <div
            onClick={() => candidatInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
          >
            <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1" />
            <p className="text-xs text-slate-500">
              Cliquez pour ajouter la photo d'identité (JPG, PNG - max 10 Mo)
            </p>
            <input
              ref={candidatInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  validateAndAddFiles(Array.from(e.target.files), photoCandidatFiles, setPhotoCandidatFiles);
                }
                e.target.value = '';
              }}
            />
          </div>
          {photoCandidatFiles.length > 0 && (
            <div className="mt-2 space-y-1">
              {photoCandidatFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-blue-500" />
                    <span className="text-slate-700 truncate max-w-[200px]">{file.name}</span>
                    <span className="text-xs text-slate-400">
                      ({(file.size / 1024 / 1024).toFixed(1)} Mo)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(photoCandidatFiles, idx, setPhotoCandidatFiles)}
                    className="p-1 hover:bg-red-50 rounded"
                  >
                    <X className="h-3 w-3 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agence, Commerciale & Prestation */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Formation</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Agence *</label>
              <select
                value={form.agence}
                onChange={(e) => setForm({ ...form, agence: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              >
                <option value="Gagny">Gagny</option>
                <option value="Sarcelles">Sarcelles</option>
                <option value="Rosny">Rosny</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Commerciale en charge *</label>
              <select
                value={form.commercialeId}
                onChange={(e) => setForm({ ...form, commercialeId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              >
                <option value="">Sélectionner</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.prenom} {a.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Type de prestation *</label>
              <select
                value={form.typePrestation}
                onChange={(e) => setForm({ ...form, typePrestation: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              >
                {PRESTATIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Source / provenance</label>
              <select
                value={form.sourceProvenance}
                onChange={(e) => setForm({ ...form, sourceProvenance: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                <option value="">Non renseigné</option>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => router.push('/admin/suivi-formation')}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Création...' : 'Créer le stagiaire'}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Upload un fichier vers Supabase Storage via l'API
 * Retourne le chemin du fichier stocké
 */
async function uploadFileToStorage(
  stagiaireId: number,
  folder: string,
  file: File
): Promise<string | null> {
  try {
    // Créer le FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await fetch(`/api/admin/stagiaires-formation/${stagiaireId}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.path || null;
  } catch {
    return null;
  }
}
