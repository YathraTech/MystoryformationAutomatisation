import { createClient } from '@/lib/supabase/server';

export interface ExamType {
  id: number;
  code: string;
  label: string;
  description: string | null;
  icon: string;
  color: string;
  visible: boolean;
  ordre: number;
  createdAt: string;
  updatedAt: string;
}

interface DbExamType {
  id: number;
  code: string;
  label: string;
  description: string | null;
  icon: string;
  color: string;
  visible: boolean;
  ordre: number;
  created_at: string;
  updated_at: string;
}

function dbToExamType(row: DbExamType): ExamType {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    description: row.description,
    icon: row.icon || 'BookOpen',
    color: row.color || 'blue',
    visible: row.visible ?? true,
    ordre: row.ordre || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllExamTypes(): Promise<ExamType[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('exam_types')
    .select('*')
    .order('ordre', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map((row: DbExamType) => dbToExamType(row));
}

export async function getVisibleExamTypes(): Promise<ExamType[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('exam_types')
    .select('*')
    .eq('visible', true)
    .order('ordre', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map((row: DbExamType) => dbToExamType(row));
}

export async function getExamTypeById(id: number): Promise<ExamType | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('exam_types')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return dbToExamType(data as DbExamType);
}

export interface CreateExamTypeData {
  code: string;
  label: string;
  description?: string | null;
  icon?: string;
  color?: string;
  visible?: boolean;
  ordre?: number;
}

export async function createExamType(data: CreateExamTypeData): Promise<ExamType> {
  const supabase = await createClient();
  const { data: result, error } = await supabase
    .from('exam_types')
    .insert({
      code: data.code,
      label: data.label,
      description: data.description ?? null,
      icon: data.icon ?? 'BookOpen',
      color: data.color ?? 'blue',
      visible: data.visible ?? true,
      ordre: data.ordre ?? 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return dbToExamType(result as DbExamType);
}

export interface UpdateExamTypeData {
  code?: string;
  label?: string;
  description?: string | null;
  icon?: string;
  color?: string;
  visible?: boolean;
  ordre?: number;
}

export async function updateExamType(id: number, data: UpdateExamTypeData): Promise<ExamType> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};
  if (data.code !== undefined) updateData.code = data.code;
  if (data.label !== undefined) updateData.label = data.label;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.visible !== undefined) updateData.visible = data.visible;
  if (data.ordre !== undefined) updateData.ordre = data.ordre;

  const { data: result, error } = await supabase
    .from('exam_types')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return dbToExamType(result as DbExamType);
}

export async function deleteExamType(id: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('exam_types')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
