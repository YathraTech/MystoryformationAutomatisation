'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Clock,
  BookOpen,
  Package,
  Eye,
  EyeOff,
  AlertCircle,
  GraduationCap,
  FileText,
  Award,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Target,
  AlertTriangle,
} from 'lucide-react';
import type { ExamTimeSlot, ExamOption, ExamType, ExamObjectif } from '@/types/admin';

// Icônes disponibles pour les types d'examens
const ICONS: { value: string; label: string; icon: React.ElementType }[] = [
  { value: 'BookOpen', label: 'Livre', icon: BookOpen },
  { value: 'FileText', label: 'Document', icon: FileText },
  { value: 'GraduationCap', label: 'Diplôme', icon: GraduationCap },
  { value: 'Award', label: 'Récompense', icon: Award },
];

// Couleurs disponibles pour les types d'examens
const COLORS = [
  { value: 'blue', label: 'Bleu', bgClass: 'bg-blue-100', textClass: 'text-blue-600' },
  { value: 'emerald', label: 'Vert', bgClass: 'bg-emerald-100', textClass: 'text-emerald-600' },
  { value: 'purple', label: 'Violet', bgClass: 'bg-purple-100', textClass: 'text-purple-600' },
  { value: 'orange', label: 'Orange', bgClass: 'bg-orange-100', textClass: 'text-orange-600' },
  { value: 'red', label: 'Rouge', bgClass: 'bg-red-100', textClass: 'text-red-600' },
];

const JOURS = [
  { value: 'lundi', label: 'Lundi' },
  { value: 'mardi', label: 'Mardi' },
  { value: 'mercredi', label: 'Mercredi' },
  { value: 'jeudi', label: 'Jeudi' },
  { value: 'vendredi', label: 'Vendredi' },
  { value: 'samedi', label: 'Samedi' },
];

const CATEGORIES = [
  { value: 'niveau', label: 'Niveau de langue' },
  { value: 'carte', label: 'Carte / Titre de séjour' },
  { value: 'autre', label: 'Autre' },
];

export default function ParametresExamensPage() {
  const [timeSlots, setTimeSlots] = useState<ExamTimeSlot[]>([]);
  const [options, setOptions] = useState<ExamOption[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Exam Type form state
  const [showExamTypeForm, setShowExamTypeForm] = useState(false);
  const [editingExamType, setEditingExamType] = useState<ExamType | null>(null);
  const [examTypeForm, setExamTypeForm] = useState({
    code: '',
    label: '',
    description: '',
    icon: 'BookOpen',
    color: 'blue',
    visible: true,
    ordre: 0,
  });

  // Exam type options (options associées à chaque type)
  const [examTypeOptions, setExamTypeOptions] = useState<Record<number, ExamOption[]>>({});
  const [expandedTypes, setExpandedTypes] = useState<Set<number>>(new Set());
  const [draggingOption, setDraggingOption] = useState<ExamOption | null>(null);

  // Objectifs
  const [objectifs, setObjectifs] = useState<ExamObjectif[]>([]);
  const [showObjectifForm, setShowObjectifForm] = useState(false);
  const [editingObjectif, setEditingObjectif] = useState<ExamObjectif | null>(null);
  const [objectifForm, setObjectifForm] = useState({ code: '', label: '', ordre: 0, visible: true });

  // Sections collapsibles
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const isSectionCollapsed = (sectionId: string) => collapsedSections.has(sectionId);

  // Time slot form state
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ExamTimeSlot | null>(null);
  const [slotForm, setSlotForm] = useState({ label: '', jour: 'lundi', heure: '09:00', actif: true });

  // Option form state
  const [showOptionForm, setShowOptionForm] = useState(false);
  const [editingOption, setEditingOption] = useState<ExamOption | null>(null);
  const [optionForm, setOptionForm] = useState({
    code: '',
    label: '',
    description: '',
    categorie: 'niveau',
    estPack: false,
    visiblePublic: true,
    ordre: 0,
    packItemIds: [] as number[],
    timeSlotIds: [] as number[],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [slotsRes, optionsRes, examTypesRes, objectifsRes] = await Promise.all([
        fetch('/api/admin/exam-time-slots'),
        fetch('/api/admin/exam-options'),
        fetch('/api/admin/exam-types'),
        fetch('/api/admin/exam-objectifs'),
      ]);

      if (slotsRes.ok) {
        const data = await slotsRes.json();
        setTimeSlots(data.slots || []);
      }

      if (optionsRes.ok) {
        const data = await optionsRes.json();
        setOptions(data.options || []);
      }

      if (examTypesRes.ok) {
        const data = await examTypesRes.json();
        const types = data.types || [];
        setExamTypes(types);

        // Fetch options for each exam type
        const optionsMap: Record<number, ExamOption[]> = {};
        await Promise.all(
          types.map(async (type: ExamType) => {
            try {
              const res = await fetch(`/api/admin/exam-types/${type.id}/options`);
              if (res.ok) {
                const optData = await res.json();
                optionsMap[type.id] = (optData.options || []).map((o: { examOption?: ExamOption }) => o.examOption).filter(Boolean);
              }
            } catch {
              optionsMap[type.id] = [];
            }
          })
        );
        setExamTypeOptions(optionsMap);
      }

      if (objectifsRes.ok) {
        const data = await objectifsRes.json();
        setObjectifs(data.objectifs || []);
      }
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Time Slot CRUD
  const handleSaveSlot = async () => {
    try {
      const url = editingSlot
        ? `/api/admin/exam-time-slots/${editingSlot.id}`
        : '/api/admin/exam-time-slots';
      const method = editingSlot ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slotForm),
      });

      if (res.ok) {
        await fetchData();
        resetSlotForm();
      }
    } catch {
      setError('Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteSlot = async (id: number) => {
    if (!confirm('Supprimer ce créneau ?')) return;

    try {
      const res = await fetch(`/api/admin/exam-time-slots/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      setError('Erreur lors de la suppression');
    }
  };

  const startEditSlot = (slot: ExamTimeSlot) => {
    setEditingSlot(slot);
    setSlotForm({
      label: slot.label,
      jour: slot.jour,
      heure: slot.heure,
      actif: slot.actif,
    });
    setShowSlotForm(true);
  };

  const resetSlotForm = () => {
    setShowSlotForm(false);
    setEditingSlot(null);
    setSlotForm({ label: '', jour: 'lundi', heure: '09:00', actif: true });
  };

  // Option CRUD
  const handleSaveOption = async () => {
    try {
      const url = editingOption
        ? `/api/admin/exam-options/${editingOption.id}`
        : '/api/admin/exam-options';
      const method = editingOption ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: optionForm.code,
          label: optionForm.label,
          description: optionForm.description || null,
          categorie: optionForm.categorie,
          estPack: optionForm.estPack,
          visiblePublic: optionForm.visiblePublic,
          ordre: optionForm.ordre,
          timeSlotIds: optionForm.timeSlotIds,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const optionId = editingOption?.id || data.option.id;

        // Update time slots
        await fetch(`/api/admin/exam-options/${optionId}/time-slots`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slotIds: optionForm.timeSlotIds }),
        });

        // Update pack items if it's a pack
        if (optionForm.estPack) {
          await fetch(`/api/admin/exam-options/${optionId}/pack-items`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ optionIds: optionForm.packItemIds }),
          });
        }

        await fetchData();
        resetOptionForm();
      }
    } catch {
      setError('Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteOption = async (id: number) => {
    if (!confirm('Supprimer cette option ?')) return;

    try {
      const res = await fetch(`/api/admin/exam-options/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      setError('Erreur lors de la suppression');
    }
  };

  const startEditOption = async (option: ExamOption) => {
    setEditingOption(option);

    // Fetch time slots for this option
    let timeSlotIds: number[] = [];
    let packItemIds: number[] = [];

    try {
      const slotsRes = await fetch(`/api/admin/exam-options/${option.id}/time-slots`);
      if (slotsRes.ok) {
        const data = await slotsRes.json();
        timeSlotIds = (data.slots || []).map((s: ExamTimeSlot) => s.id);
      }

      if (option.estPack) {
        const itemsRes = await fetch(`/api/admin/exam-options/${option.id}/pack-items`);
        if (itemsRes.ok) {
          const data = await itemsRes.json();
          packItemIds = (data.items || []).map((i: ExamOption) => i.id);
        }
      }
    } catch {
      // Ignore errors
    }

    setOptionForm({
      code: option.code,
      label: option.label,
      description: option.description || '',
      categorie: option.categorie || 'niveau',
      estPack: option.estPack,
      visiblePublic: option.visiblePublic,
      ordre: option.ordre,
      packItemIds,
      timeSlotIds,
    });
    setShowOptionForm(true);
  };

  const resetOptionForm = () => {
    setShowOptionForm(false);
    setEditingOption(null);
    setOptionForm({
      code: '',
      label: '',
      description: '',
      categorie: 'niveau',
      estPack: false,
      visiblePublic: true,
      ordre: 0,
      packItemIds: [],
      timeSlotIds: [],
    });
  };

  const toggleTimeSlot = (slotId: number) => {
    setOptionForm((prev) => ({
      ...prev,
      timeSlotIds: prev.timeSlotIds.includes(slotId)
        ? prev.timeSlotIds.filter((id) => id !== slotId)
        : [...prev.timeSlotIds, slotId],
    }));
  };

  const togglePackItem = (optionId: number) => {
    setOptionForm((prev) => ({
      ...prev,
      packItemIds: prev.packItemIds.includes(optionId)
        ? prev.packItemIds.filter((id) => id !== optionId)
        : [...prev.packItemIds, optionId],
    }));
  };

  // Available options for pack (exclude current option and other packs)
  const availablePackOptions = options.filter(
    (o) => !o.estPack && o.id !== editingOption?.id
  );

  // Exam Type CRUD
  const handleSaveExamType = async () => {
    try {
      const url = editingExamType
        ? `/api/admin/exam-types/${editingExamType.id}`
        : '/api/admin/exam-types';
      const method = editingExamType ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examTypeForm),
      });

      if (res.ok) {
        await fetchData();
        resetExamTypeForm();
      } else {
        const data = await res.json();
        setError(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch {
      setError('Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteExamType = async (id: number) => {
    if (!confirm('Supprimer ce type d\'examen ?')) return;

    try {
      const res = await fetch(`/api/admin/exam-types/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      setError('Erreur lors de la suppression');
    }
  };

  const startEditExamType = (examType: ExamType) => {
    setEditingExamType(examType);
    setExamTypeForm({
      code: examType.code,
      label: examType.label,
      description: examType.description || '',
      icon: examType.icon,
      color: examType.color,
      visible: examType.visible,
      ordre: examType.ordre,
    });
    setShowExamTypeForm(true);
  };

  const resetExamTypeForm = () => {
    setShowExamTypeForm(false);
    setEditingExamType(null);
    setExamTypeForm({
      code: '',
      label: '',
      description: '',
      icon: 'BookOpen',
      color: 'blue',
      visible: true,
      ordre: 0,
    });
  };

  const getIconComponent = (iconName: string) => {
    const iconEntry = ICONS.find((i) => i.value === iconName);
    return iconEntry?.icon || BookOpen;
  };

  const getColorClasses = (colorName: string) => {
    const colorEntry = COLORS.find((c) => c.value === colorName);
    return colorEntry || COLORS[0];
  };

  // Toggle expanded exam type
  const toggleExamTypeExpanded = (typeId: number) => {
    setExpandedTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(typeId)) {
        newSet.delete(typeId);
      } else {
        newSet.add(typeId);
      }
      return newSet;
    });
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, option: ExamOption) => {
    setDraggingOption(option);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', option.id.toString());
  };

  const handleDragEnd = () => {
    setDraggingOption(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDropOnExamType = async (e: React.DragEvent, examTypeId: number) => {
    e.preventDefault();
    if (!draggingOption) return;

    // Check if already exists
    const currentOptions = examTypeOptions[examTypeId] || [];
    if (currentOptions.some((o) => o.id === draggingOption.id)) {
      setError('Cette option est déjà associée à ce type d\'examen');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const res = await fetch(`/api/admin/exam-types/${examTypeId}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examOptionId: draggingOption.id }),
      });

      if (res.ok) {
        // Add to local state
        setExamTypeOptions((prev) => ({
          ...prev,
          [examTypeId]: [...(prev[examTypeId] || []), draggingOption],
        }));
        // Auto-expand if not already
        setExpandedTypes((prev) => new Set(prev).add(examTypeId));
      } else {
        const data = await res.json();
        setError(data.error || 'Erreur lors de l\'ajout');
      }
    } catch {
      setError('Erreur lors de l\'ajout');
    }

    setDraggingOption(null);
  };

  const handleRemoveOptionFromType = async (examTypeId: number, optionId: number) => {
    try {
      const res = await fetch(
        `/api/admin/exam-types/${examTypeId}/options?examOptionId=${optionId}`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        setExamTypeOptions((prev) => ({
          ...prev,
          [examTypeId]: (prev[examTypeId] || []).filter((o) => o.id !== optionId),
        }));
      }
    } catch {
      setError('Erreur lors de la suppression');
    }
  };

  // Objectif CRUD
  const handleSaveObjectif = async () => {
    try {
      const url = editingObjectif
        ? `/api/admin/exam-objectifs/${editingObjectif.id}`
        : '/api/admin/exam-objectifs';
      const method = editingObjectif ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(objectifForm),
      });

      if (res.ok) {
        await fetchData();
        resetObjectifForm();
      } else {
        const data = await res.json();
        setError(data.error || 'Erreur lors de la sauvegarde');
        setTimeout(() => setError(''), 5000);
      }
    } catch {
      setError('Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteObjectif = async (objectif: ExamObjectif) => {
    if (objectif.usageCount && objectif.usageCount > 0) {
      setError(`Impossible de supprimer : cet objectif est utilisé par ${objectif.usageCount} examen(s)`);
      setTimeout(() => setError(''), 5000);
      return;
    }

    if (!confirm(`Supprimer l'objectif "${objectif.label}" ?`)) return;

    try {
      const res = await fetch(`/api/admin/exam-objectifs/${objectif.id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'Erreur lors de la suppression');
        setTimeout(() => setError(''), 5000);
      }
    } catch {
      setError('Erreur lors de la suppression');
    }
  };

  const startEditObjectif = (objectif: ExamObjectif) => {
    setEditingObjectif(objectif);
    setObjectifForm({
      code: objectif.code,
      label: objectif.label,
      ordre: objectif.ordre,
      visible: objectif.visible,
    });
    setShowObjectifForm(true);
  };

  const resetObjectifForm = () => {
    setShowObjectifForm(false);
    setEditingObjectif(null);
    setObjectifForm({ code: '', label: '', ordre: 0, visible: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-3 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Paramètres d&apos;examen</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configurez les types d&apos;examens et les créneaux horaires disponibles
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Section: Créneaux horaires */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div
          className="px-5 py-4 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => toggleSection('timeSlots')}
        >
          <div className="flex items-center gap-2">
            {isSectionCollapsed('timeSlots') ? (
              <ChevronRight className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
            <Clock className="h-5 w-5 text-slate-500" />
            <h2 className="font-semibold text-slate-800">Créneaux horaires</h2>
            <span className="text-xs text-slate-400">({timeSlots.length})</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSlotForm(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>

        {/* Contenu collapsible */}
        {!isSectionCollapsed('timeSlots') && (
          <>
        {/* Formulaire pour NOUVEAU créneau uniquement */}
        {showSlotForm && !editingSlot && (
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Label</label>
                <input
                  type="text"
                  value={slotForm.label}
                  onChange={(e) => setSlotForm({ ...slotForm, label: e.target.value })}
                  placeholder="Ex: Lundi après-midi"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Jour</label>
                <select
                  value={slotForm.jour}
                  onChange={(e) => setSlotForm({ ...slotForm, jour: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {JOURS.map((j) => (
                    <option key={j.value} value={j.value}>
                      {j.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Heure</label>
                <input
                  type="time"
                  value={slotForm.heure}
                  onChange={(e) => setSlotForm({ ...slotForm, heure: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={slotForm.actif}
                    onChange={(e) => setSlotForm({ ...slotForm, actif: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-600">Actif</span>
                </label>
                <div className="flex-1" />
                <button
                  onClick={resetSlotForm}
                  className="rounded-lg border border-slate-300 p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={handleSaveSlot}
                  className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Slots List */}
        <div className="divide-y divide-slate-100">
          {timeSlots.map((slot) => (
            <div key={slot.id}>
              {/* Formulaire d'édition inline */}
              {editingSlot?.id === slot.id ? (
                <div className="px-5 py-4 bg-blue-50 border-b border-blue-200">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Label</label>
                      <input
                        type="text"
                        value={slotForm.label}
                        onChange={(e) => setSlotForm({ ...slotForm, label: e.target.value })}
                        placeholder="Ex: Lundi après-midi"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Jour</label>
                      <select
                        value={slotForm.jour}
                        onChange={(e) => setSlotForm({ ...slotForm, jour: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        {JOURS.map((j) => (
                          <option key={j.value} value={j.value}>
                            {j.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Heure</label>
                      <input
                        type="time"
                        value={slotForm.heure}
                        onChange={(e) => setSlotForm({ ...slotForm, heure: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={slotForm.actif}
                          onChange={(e) => setSlotForm({ ...slotForm, actif: e.target.checked })}
                          className="rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-600">Actif</span>
                      </label>
                      <div className="flex-1" />
                      <button
                        onClick={resetSlotForm}
                        className="rounded-lg border border-slate-300 p-2 text-slate-500 hover:bg-slate-100 bg-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleSaveSlot}
                        className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-slate-800">{slot.label}</span>
                    <span className="text-sm text-slate-500 capitalize">{slot.jour}</span>
                    <span className="text-sm text-slate-500">{slot.heure}</span>
                    {!slot.actif && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        Inactif
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditSlot(slot)}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {timeSlots.length === 0 && (
            <div className="px-5 py-8 text-center text-slate-400">
              Aucun créneau horaire configuré
            </div>
          )}
        </div>
          </>
        )}
      </section>

      {/* Section: Examens par défaut */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div
          className="px-5 py-4 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => toggleSection('examOptions')}
        >
          <div className="flex items-center gap-2">
            {isSectionCollapsed('examOptions') ? (
              <ChevronRight className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
            <BookOpen className="h-5 w-5 text-slate-500" />
            <h2 className="font-semibold text-slate-800">Examens par défaut</h2>
            <span className="text-xs text-slate-400">({options.length})</span>
            <span className="text-xs text-slate-400 ml-2">
              (Glissez vers un type d&apos;examen pour associer)
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowOptionForm(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>

        {/* Contenu collapsible */}
        {!isSectionCollapsed('examOptions') && (
          <>
        {/* Formulaire pour NOUVELLE option uniquement */}
        {showOptionForm && !editingOption && (
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={optionForm.code}
                  onChange={(e) => setOptionForm({ ...optionForm, code: e.target.value })}
                  placeholder="Ex: A1, B2, naturalisation"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={optionForm.label}
                  onChange={(e) => setOptionForm({ ...optionForm, label: e.target.value })}
                  placeholder="Ex: Diplôme A1"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Catégorie</label>
                <select
                  value={optionForm.categorie}
                  onChange={(e) => setOptionForm({ ...optionForm, categorie: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <textarea
                value={optionForm.description}
                onChange={(e) => setOptionForm({ ...optionForm, description: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Description optionnelle..."
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={optionForm.estPack}
                  onChange={(e) => setOptionForm({ ...optionForm, estPack: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <Package className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-600">C&apos;est un pack</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={optionForm.visiblePublic}
                  onChange={(e) => setOptionForm({ ...optionForm, visiblePublic: e.target.checked })}
                  className="rounded border-slate-300"
                />
                {optionForm.visiblePublic ? (
                  <Eye className="h-4 w-4 text-slate-400" />
                ) : (
                  <EyeOff className="h-4 w-4 text-slate-400" />
                )}
                <span className="text-sm text-slate-600">Visible pour les clients</span>
              </label>

              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600">Ordre :</label>
                <input
                  type="number"
                  value={optionForm.ordre}
                  onChange={(e) =>
                    setOptionForm({ ...optionForm, ordre: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Pack items selection */}
            {optionForm.estPack && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">
                  Options incluses dans le pack
                </label>
                <div className="flex flex-wrap gap-2">
                  {availablePackOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => togglePackItem(opt.id)}
                      className={`rounded-full px-3 py-1 text-sm transition-colors ${
                        optionForm.packItemIds.includes(opt.id)
                          ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  {availablePackOptions.length === 0 && (
                    <span className="text-sm text-slate-400">Aucune option disponible</span>
                  )}
                </div>
              </div>
            )}

            {/* Time slots selection */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Créneaux disponibles
              </label>
              <div className="flex flex-wrap gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => toggleTimeSlot(slot.id)}
                    className={`rounded-full px-3 py-1 text-sm transition-colors ${
                      optionForm.timeSlotIds.includes(slot.id)
                        ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
                {timeSlots.length === 0 && (
                  <span className="text-sm text-slate-400">
                    Créez d&apos;abord des créneaux horaires
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={resetOptionForm}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveOption}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Créer
              </button>
            </div>
          </div>
        )}

        {/* Options List - Compact Grid */}
        <div className="px-4 py-3 flex flex-wrap">
          {options.map((option) => (
            <div key={option.id}>
              {/* Formulaire d'édition inline */}
              {editingOption?.id === option.id ? (
                <div className="px-5 py-4 bg-blue-50 border-b border-blue-200 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={optionForm.code}
                        onChange={(e) => setOptionForm({ ...optionForm, code: e.target.value })}
                        placeholder="Ex: A1, B2, naturalisation"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Label <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={optionForm.label}
                        onChange={(e) => setOptionForm({ ...optionForm, label: e.target.value })}
                        placeholder="Ex: Diplôme A1"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Catégorie</label>
                      <select
                        value={optionForm.categorie}
                        onChange={(e) => setOptionForm({ ...optionForm, categorie: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                    <textarea
                      value={optionForm.description}
                      onChange={(e) => setOptionForm({ ...optionForm, description: e.target.value })}
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                      placeholder="Description optionnelle..."
                    />
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={optionForm.estPack}
                        onChange={(e) => setOptionForm({ ...optionForm, estPack: e.target.checked })}
                        className="rounded border-slate-300"
                      />
                      <Package className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-600">C&apos;est un pack</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={optionForm.visiblePublic}
                        onChange={(e) => setOptionForm({ ...optionForm, visiblePublic: e.target.checked })}
                        className="rounded border-slate-300"
                      />
                      {optionForm.visiblePublic ? (
                        <Eye className="h-4 w-4 text-slate-400" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      )}
                      <span className="text-sm text-slate-600">Visible pour les clients</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <label className="text-sm text-slate-600">Ordre :</label>
                      <input
                        type="number"
                        value={optionForm.ordre}
                        onChange={(e) =>
                          setOptionForm({ ...optionForm, ordre: parseInt(e.target.value, 10) || 0 })
                        }
                        className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>

                  {/* Pack items selection */}
                  {optionForm.estPack && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-2">
                        Options incluses dans le pack
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {availablePackOptions.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => togglePackItem(opt.id)}
                            className={`rounded-full px-3 py-1 text-sm transition-colors ${
                              optionForm.packItemIds.includes(opt.id)
                                ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-300'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                        {availablePackOptions.length === 0 && (
                          <span className="text-sm text-slate-400">Aucune option disponible</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Time slots selection */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">
                      Créneaux disponibles
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => toggleTimeSlot(slot.id)}
                          className={`rounded-full px-3 py-1 text-sm transition-colors ${
                            optionForm.timeSlotIds.includes(slot.id)
                              ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {slot.label}
                        </button>
                      ))}
                      {timeSlots.length === 0 && (
                        <span className="text-sm text-slate-400">
                          Créez d&apos;abord des créneaux horaires
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={resetOptionForm}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white bg-white"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSaveOption}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Mettre à jour
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, option)}
                  onDragEnd={handleDragEnd}
                  className="inline-flex items-center gap-2 m-1 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 cursor-grab active:cursor-grabbing shadow-sm transition-all"
                >
                  <GripVertical className="h-3 w-3 text-slate-300" />
                  <span className="text-sm font-medium text-slate-700">{option.label}</span>
                  {option.estPack && (
                    <Package className="h-3 w-3 text-purple-500" />
                  )}
                  {!option.visiblePublic && (
                    <EyeOff className="h-3 w-3 text-slate-400" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditOption(option);
                    }}
                    className="p-0.5 text-slate-400 hover:text-blue-600"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteOption(option.id);
                    }}
                    className="p-0.5 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {options.length === 0 && (
            <div className="w-full py-8 text-center text-slate-400">
              Aucun examen par défaut configuré
            </div>
          )}
        </div>
          </>
        )}
      </section>

      {/* Section: Examens Souhaités */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div
          className="px-5 py-4 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => toggleSection('examTypes')}
        >
          <div className="flex items-center gap-2">
            {isSectionCollapsed('examTypes') ? (
              <ChevronRight className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
            <GraduationCap className="h-5 w-5 text-slate-500" />
            <h2 className="font-semibold text-slate-800">Examens Souhaités</h2>
            <span className="text-xs text-slate-400">({examTypes.length})</span>
            <span className="text-xs text-slate-400 ml-2">
              (Affiché sur la page de choix client)
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowExamTypeForm(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>

        {/* Contenu collapsible */}
        {!isSectionCollapsed('examTypes') && (
          <>
        {/* Formulaire pour NOUVEAU type d'examen uniquement */}
        {showExamTypeForm && !editingExamType && (
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={examTypeForm.code}
                  onChange={(e) => setExamTypeForm({ ...examTypeForm, code: e.target.value })}
                  placeholder="Ex: TEF_IRN, CIVIQUE"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={examTypeForm.label}
                  onChange={(e) => setExamTypeForm({ ...examTypeForm, label: e.target.value })}
                  placeholder="Ex: TEF IRN"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Icône</label>
                  <select
                    value={examTypeForm.icon}
                    onChange={(e) => setExamTypeForm({ ...examTypeForm, icon: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {ICONS.map((ic) => (
                      <option key={ic.value} value={ic.value}>
                        {ic.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Couleur</label>
                  <select
                    value={examTypeForm.color}
                    onChange={(e) => setExamTypeForm({ ...examTypeForm, color: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {COLORS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <textarea
                value={examTypeForm.description}
                onChange={(e) => setExamTypeForm({ ...examTypeForm, description: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Description affichée au client..."
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={examTypeForm.visible}
                  onChange={(e) => setExamTypeForm({ ...examTypeForm, visible: e.target.checked })}
                  className="rounded border-slate-300"
                />
                {examTypeForm.visible ? (
                  <Eye className="h-4 w-4 text-slate-400" />
                ) : (
                  <EyeOff className="h-4 w-4 text-slate-400" />
                )}
                <span className="text-sm text-slate-600">Visible pour les clients</span>
              </label>

              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600">Ordre :</label>
                <input
                  type="number"
                  value={examTypeForm.ordre}
                  onChange={(e) =>
                    setExamTypeForm({ ...examTypeForm, ordre: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={resetExamTypeForm}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveExamType}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Créer
              </button>
            </div>
          </div>
        )}

        {/* Exam Types List */}
        <div className="divide-y divide-slate-100">
          {examTypes.map((examType) => {
            const IconComponent = getIconComponent(examType.icon);
            const colorClasses = getColorClasses(examType.color);

            return (
              <div key={examType.id}>
                {/* Formulaire d'édition inline */}
                {editingExamType?.id === examType.id ? (
                  <div className="px-5 py-4 bg-blue-50 border-b border-blue-200 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={examTypeForm.code}
                          onChange={(e) => setExamTypeForm({ ...examTypeForm, code: e.target.value })}
                          placeholder="Ex: TEF_IRN, CIVIQUE"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Label <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={examTypeForm.label}
                          onChange={(e) => setExamTypeForm({ ...examTypeForm, label: e.target.value })}
                          placeholder="Ex: TEF IRN"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-slate-600 mb-1">Icône</label>
                          <select
                            value={examTypeForm.icon}
                            onChange={(e) => setExamTypeForm({ ...examTypeForm, icon: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                          >
                            {ICONS.map((ic) => (
                              <option key={ic.value} value={ic.value}>
                                {ic.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-slate-600 mb-1">Couleur</label>
                          <select
                            value={examTypeForm.color}
                            onChange={(e) => setExamTypeForm({ ...examTypeForm, color: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                          >
                            {COLORS.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                      <textarea
                        value={examTypeForm.description}
                        onChange={(e) => setExamTypeForm({ ...examTypeForm, description: e.target.value })}
                        rows={2}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                        placeholder="Description affichée au client..."
                      />
                    </div>

                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={examTypeForm.visible}
                          onChange={(e) => setExamTypeForm({ ...examTypeForm, visible: e.target.checked })}
                          className="rounded border-slate-300"
                        />
                        {examTypeForm.visible ? (
                          <Eye className="h-4 w-4 text-slate-400" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-slate-400" />
                        )}
                        <span className="text-sm text-slate-600">Visible pour les clients</span>
                      </label>

                      <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-600">Ordre :</label>
                        <input
                          type="number"
                          value={examTypeForm.ordre}
                          onChange={(e) =>
                            setExamTypeForm({ ...examTypeForm, ordre: parseInt(e.target.value, 10) || 0 })
                          }
                          className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={resetExamTypeForm}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white bg-white"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSaveExamType}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        Mettre à jour
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Header avec drop zone */}
                    <div
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropOnExamType(e, examType.id)}
                      className={`px-5 py-3 transition-colors ${
                        draggingOption ? 'bg-blue-50 border-2 border-dashed border-blue-300' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Expand/Collapse button */}
                          <button
                            onClick={() => toggleExamTypeExpanded(examType.id)}
                            className="p-1 rounded hover:bg-slate-100"
                          >
                            {expandedTypes.has(examType.id) ? (
                              <ChevronDown className="h-4 w-4 text-slate-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate-500" />
                            )}
                          </button>

                          {/* Icon preview */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses.bgClass}`}>
                            <IconComponent className={`h-5 w-5 ${colorClasses.textClass}`} />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-800">{examType.label}</span>
                              <span className="text-xs text-slate-400 font-mono">{examType.code}</span>
                              {/* Badge count */}
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                                {(examTypeOptions[examType.id] || []).length} examen(s)
                              </span>
                            </div>
                            {examType.description && (
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                {examType.description}
                              </p>
                            )}
                          </div>

                          {!examType.visible && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                              <EyeOff className="h-3 w-3" />
                              Masqué
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditExamType(examType)}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExamType(examType.id)}
                            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Drop hint */}
                      {draggingOption && (
                        <div className="mt-2 text-center">
                          <span className="text-xs text-blue-600 font-medium">
                            Déposez ici pour associer &quot;{draggingOption.label}&quot; à {examType.label}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Collapsible section - Options associées */}
                    {expandedTypes.has(examType.id) && (
                      <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
                        {(examTypeOptions[examType.id] || []).length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-slate-500 mb-2">
                              Examens associés à {examType.label} :
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {(examTypeOptions[examType.id] || []).map((opt) => (
                                <div
                                  key={opt.id}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3 py-1.5 text-sm text-slate-700 shadow-sm"
                                >
                                  <span>{opt.label}</span>
                                  <button
                                    onClick={() => handleRemoveOptionFromType(examType.id, opt.id)}
                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-sm text-slate-400">
                              Aucun examen associé. Glissez-déposez des examens depuis &quot;Examens par défaut&quot;.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {examTypes.length === 0 && (
            <div className="px-5 py-8 text-center text-slate-400">
              Aucun type d&apos;examen souhaité configuré
            </div>
          )}
        </div>
          </>
        )}
      </section>

      {/* Section: Objectifs / Motivations */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div
          className="px-5 py-4 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => toggleSection('objectifs')}
        >
          <div className="flex items-center gap-2">
            {isSectionCollapsed('objectifs') ? (
              <ChevronRight className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
            <Target className="h-5 w-5 text-slate-500" />
            <h2 className="font-semibold text-slate-800">Objectifs / Motivations</h2>
            <span className="text-xs text-slate-400">({objectifs.length})</span>
            <span className="text-xs text-slate-400 ml-2">
              (Affiché dans le formulaire d&apos;inscription)
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowObjectifForm(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>

        {!isSectionCollapsed('objectifs') && (
          <>
            {/* Formulaire pour NOUVEL objectif uniquement */}
            {showObjectifForm && !editingObjectif && (
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={objectifForm.code}
                      onChange={(e) => setObjectifForm({ ...objectifForm, code: e.target.value })}
                      placeholder="Ex: nationalite_francaise"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Label <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={objectifForm.label}
                      onChange={(e) => setObjectifForm({ ...objectifForm, label: e.target.value })}
                      placeholder="Ex: Accès à la nationalité française"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Ordre</label>
                    <input
                      type="number"
                      value={objectifForm.ordre}
                      onChange={(e) => setObjectifForm({ ...objectifForm, ordre: parseInt(e.target.value, 10) || 0 })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={objectifForm.visible}
                        onChange={(e) => setObjectifForm({ ...objectifForm, visible: e.target.checked })}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-600">Visible</span>
                    </label>
                    <div className="flex-1" />
                    <button
                      onClick={resetObjectifForm}
                      className="rounded-lg border border-slate-300 p-2 text-slate-500 hover:bg-slate-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleSaveObjectif}
                      disabled={!objectifForm.code.trim() || !objectifForm.label.trim()}
                      className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Objectifs List */}
            <div className="divide-y divide-slate-100">
              {objectifs.map((objectif) => (
                <div key={objectif.id}>
                  {/* Formulaire d'édition inline */}
                  {editingObjectif?.id === objectif.id ? (
                    <div className="px-5 py-4 bg-blue-50 border-b border-blue-200">
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Code</label>
                          <input
                            type="text"
                            value={objectifForm.code}
                            onChange={(e) => setObjectifForm({ ...objectifForm, code: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Label</label>
                          <input
                            type="text"
                            value={objectifForm.label}
                            onChange={(e) => setObjectifForm({ ...objectifForm, label: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Ordre</label>
                          <input
                            type="number"
                            value={objectifForm.ordre}
                            onChange={(e) => setObjectifForm({ ...objectifForm, ordre: parseInt(e.target.value, 10) || 0 })}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={objectifForm.visible}
                              onChange={(e) => setObjectifForm({ ...objectifForm, visible: e.target.checked })}
                              className="rounded border-slate-300"
                            />
                            <span className="text-sm text-slate-600">Visible</span>
                          </label>
                          <div className="flex-1" />
                          <button
                            onClick={resetObjectifForm}
                            className="rounded-lg border border-slate-300 p-2 text-slate-500 hover:bg-slate-100 bg-white"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleSaveObjectif}
                            disabled={!objectifForm.code.trim() || !objectifForm.label.trim()}
                            className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-slate-800">{objectif.label}</span>
                        <span className="text-xs text-slate-400 font-mono">{objectif.code}</span>
                        {!objectif.visible && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                            <EyeOff className="h-3 w-3" />
                            Masqué
                          </span>
                        )}
                        {objectif.usageCount && objectif.usageCount > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                            {objectif.usageCount} utilisé(s)
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditObjectif(objectif)}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {objectif.usageCount && objectif.usageCount > 0 ? (
                          <button
                            disabled
                            className="rounded p-1.5 text-slate-200 cursor-not-allowed"
                            title={`Utilisé par ${objectif.usageCount} examen(s) — suppression impossible`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeleteObjectif(objectif)}
                            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {objectifs.length === 0 && (
                <div className="px-5 py-8 text-center text-slate-400">
                  Aucun objectif configuré
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
