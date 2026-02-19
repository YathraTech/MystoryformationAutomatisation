import { createClient } from '@/lib/supabase/server';
import type { ExamOption, ExamTimeSlot } from '@/types/admin';

interface DbExamOption {
  id: number;
  code: string;
  label: string;
  description: string | null;
  categorie: string | null;
  est_pack: boolean;
  visible_public: boolean;
  ordre: number;
  created_at: string;
  updated_at: string;
}

function mapDbToExamOption(db: DbExamOption): ExamOption {
  return {
    id: db.id,
    code: db.code,
    label: db.label,
    description: db.description,
    categorie: db.categorie,
    estPack: db.est_pack,
    visiblePublic: db.visible_public,
    ordre: db.ordre,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export async function getAllExamOptions(): Promise<ExamOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('exam_options')
    .select('*')
    .order('ordre')
    .order('label');

  if (error) throw error;
  return (data || []).map(mapDbToExamOption);
}

export async function getPublicExamOptions(): Promise<ExamOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('exam_options')
    .select('*')
    .eq('visible_public', true)
    .order('ordre')
    .order('label');

  if (error) throw error;
  return (data || []).map(mapDbToExamOption);
}

export async function getExamOptionById(id: number): Promise<ExamOption | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('exam_options')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return mapDbToExamOption(data);
}

export async function getExamOptionByCode(code: string): Promise<ExamOption | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('exam_options')
    .select('*')
    .eq('code', code)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return mapDbToExamOption(data);
}

export async function createExamOption(option: {
  code: string;
  label: string;
  description?: string | null;
  categorie?: string | null;
  estPack?: boolean;
  visiblePublic?: boolean;
  ordre?: number;
}): Promise<ExamOption> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('exam_options')
    .insert({
      code: option.code,
      label: option.label,
      description: option.description ?? null,
      categorie: option.categorie ?? null,
      est_pack: option.estPack ?? false,
      visible_public: option.visiblePublic ?? true,
      ordre: option.ordre ?? 0,
    })
    .select()
    .single();

  if (error) throw error;
  return mapDbToExamOption(data);
}

export async function updateExamOption(
  id: number,
  updates: Partial<{
    code: string;
    label: string;
    description: string | null;
    categorie: string | null;
    estPack: boolean;
    visiblePublic: boolean;
    ordre: number;
  }>
): Promise<ExamOption> {
  const supabase = await createClient();

  const dbUpdates: Record<string, unknown> = {};
  if (updates.code !== undefined) dbUpdates.code = updates.code;
  if (updates.label !== undefined) dbUpdates.label = updates.label;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.categorie !== undefined) dbUpdates.categorie = updates.categorie;
  if (updates.estPack !== undefined) dbUpdates.est_pack = updates.estPack;
  if (updates.visiblePublic !== undefined) dbUpdates.visible_public = updates.visiblePublic;
  if (updates.ordre !== undefined) dbUpdates.ordre = updates.ordre;

  const { data, error } = await supabase
    .from('exam_options')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapDbToExamOption(data);
}

export async function deleteExamOption(id: number): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('exam_options')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Pack items management
export async function getPackItems(packId: number): Promise<ExamOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('exam_pack_items')
    .select('option_id')
    .eq('pack_id', packId);

  if (error) throw error;

  if (!data || data.length === 0) return [];

  const optionIds = data.map((item) => item.option_id);

  const { data: options, error: optionsError } = await supabase
    .from('exam_options')
    .select('*')
    .in('id', optionIds)
    .order('ordre')
    .order('label');

  if (optionsError) throw optionsError;
  return (options || []).map(mapDbToExamOption);
}

export async function setPackItems(packId: number, optionIds: number[]): Promise<void> {
  const supabase = await createClient();

  // Delete existing pack items
  const { error: deleteError } = await supabase
    .from('exam_pack_items')
    .delete()
    .eq('pack_id', packId);

  if (deleteError) throw deleteError;

  // Insert new pack items
  if (optionIds.length > 0) {
    const { error: insertError } = await supabase
      .from('exam_pack_items')
      .insert(optionIds.map((optionId) => ({ pack_id: packId, option_id: optionId })));

    if (insertError) throw insertError;
  }
}

// Time slots management for options
export async function getOptionTimeSlots(optionId: number): Promise<ExamTimeSlot[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('exam_option_slots')
    .select('slot_id')
    .eq('option_id', optionId);

  if (error) throw error;

  if (!data || data.length === 0) return [];

  const slotIds = data.map((item) => item.slot_id);

  const { data: slots, error: slotsError } = await supabase
    .from('exam_time_slots')
    .select('*')
    .in('id', slotIds)
    .order('jour')
    .order('heure');

  if (slotsError) throw slotsError;

  return (slots || []).map((s) => ({
    id: s.id,
    label: s.label,
    jour: s.jour,
    heure: s.heure,
    actif: s.actif,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  }));
}

export async function setOptionTimeSlots(optionId: number, slotIds: number[]): Promise<void> {
  const supabase = await createClient();

  // Delete existing slots
  const { error: deleteError } = await supabase
    .from('exam_option_slots')
    .delete()
    .eq('option_id', optionId);

  if (deleteError) throw deleteError;

  // Insert new slots
  if (slotIds.length > 0) {
    const { error: insertError } = await supabase
      .from('exam_option_slots')
      .insert(slotIds.map((slotId) => ({ option_id: optionId, slot_id: slotId })));

    if (insertError) throw insertError;
  }
}

// Get options with their pack items loaded (for admin display)
export async function getExamOptionsWithPackItems(): Promise<ExamOption[]> {
  const options = await getAllExamOptions();

  // Load pack items and time slots for each option
  for (const option of options) {
    if (option.estPack) {
      option.packItems = await getPackItems(option.id);
    }
    option.timeSlots = await getOptionTimeSlots(option.id);
  }

  return options;
}
