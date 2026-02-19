import { createClient } from '@/lib/supabase/server';
import type { ExamTimeSlot } from '@/types/admin';

interface DbTimeSlot {
  id: number;
  label: string;
  jour: string;
  heure: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

function mapDbToTimeSlot(db: DbTimeSlot): ExamTimeSlot {
  return {
    id: db.id,
    label: db.label,
    jour: db.jour,
    heure: db.heure,
    actif: db.actif,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export async function getAllTimeSlots(): Promise<ExamTimeSlot[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('exam_time_slots')
    .select('*')
    .order('jour')
    .order('heure');

  if (error) throw error;
  return (data || []).map(mapDbToTimeSlot);
}

export async function getActiveTimeSlots(): Promise<ExamTimeSlot[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('exam_time_slots')
    .select('*')
    .eq('actif', true)
    .order('jour')
    .order('heure');

  if (error) throw error;
  return (data || []).map(mapDbToTimeSlot);
}

export async function getTimeSlotById(id: number): Promise<ExamTimeSlot | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('exam_time_slots')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return mapDbToTimeSlot(data);
}

export async function createTimeSlot(slot: {
  label: string;
  jour: string;
  heure: string;
  actif?: boolean;
}): Promise<ExamTimeSlot> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('exam_time_slots')
    .insert({
      label: slot.label,
      jour: slot.jour,
      heure: slot.heure,
      actif: slot.actif ?? true,
    })
    .select()
    .single();

  if (error) throw error;
  return mapDbToTimeSlot(data);
}

export async function updateTimeSlot(
  id: number,
  updates: Partial<{
    label: string;
    jour: string;
    heure: string;
    actif: boolean;
  }>
): Promise<ExamTimeSlot> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('exam_time_slots')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapDbToTimeSlot(data);
}

export async function deleteTimeSlot(id: number): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('exam_time_slots')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
