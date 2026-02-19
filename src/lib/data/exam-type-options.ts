import { createClient } from '@/lib/supabase/server';

export interface ExamTypeOption {
  id: number;
  examTypeId: number;
  examOptionId: number;
  ordre: number;
  createdAt: string;
  // Relations jointes
  examOption?: {
    id: number;
    code: string;
    label: string;
    description: string | null;
    categorie: string | null;
  };
}

interface DbExamTypeOption {
  id: number;
  exam_type_id: number;
  exam_option_id: number;
  ordre: number;
  created_at: string;
  exam_options?: {
    id: number;
    code: string;
    label: string;
    description: string | null;
    categorie: string | null;
  };
}

function dbToExamTypeOption(row: DbExamTypeOption): ExamTypeOption {
  return {
    id: row.id,
    examTypeId: row.exam_type_id,
    examOptionId: row.exam_option_id,
    ordre: row.ordre || 0,
    createdAt: row.created_at,
    examOption: row.exam_options ? {
      id: row.exam_options.id,
      code: row.exam_options.code,
      label: row.exam_options.label,
      description: row.exam_options.description,
      categorie: row.exam_options.categorie,
    } : undefined,
  };
}

// Récupérer toutes les options associées à un type d'examen
export async function getExamTypeOptions(examTypeId: number): Promise<ExamTypeOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('exam_type_options')
    .select(`
      *,
      exam_options (
        id,
        code,
        label,
        description,
        categorie
      )
    `)
    .eq('exam_type_id', examTypeId)
    .order('ordre', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map((row: DbExamTypeOption) => dbToExamTypeOption(row));
}

// Ajouter une option à un type d'examen
export async function addOptionToExamType(
  examTypeId: number,
  examOptionId: number,
  ordre?: number
): Promise<ExamTypeOption> {
  const supabase = await createClient();

  // Calculer l'ordre si non fourni
  let finalOrdre = ordre;
  if (finalOrdre === undefined) {
    const { data: existing } = await supabase
      .from('exam_type_options')
      .select('ordre')
      .eq('exam_type_id', examTypeId)
      .order('ordre', { ascending: false })
      .limit(1);

    finalOrdre = existing && existing.length > 0 ? existing[0].ordre + 1 : 0;
  }

  const { data, error } = await supabase
    .from('exam_type_options')
    .insert({
      exam_type_id: examTypeId,
      exam_option_id: examOptionId,
      ordre: finalOrdre,
    })
    .select(`
      *,
      exam_options (
        id,
        code,
        label,
        description,
        categorie
      )
    `)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Cette option est déjà associée à ce type d\'examen');
    }
    throw new Error(error.message);
  }
  return dbToExamTypeOption(data as DbExamTypeOption);
}

// Supprimer une option d'un type d'examen
export async function removeOptionFromExamType(
  examTypeId: number,
  examOptionId: number
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('exam_type_options')
    .delete()
    .eq('exam_type_id', examTypeId)
    .eq('exam_option_id', examOptionId);

  if (error) throw new Error(error.message);
}

// Mettre à jour l'ordre des options d'un type d'examen
export async function updateExamTypeOptionsOrder(
  examTypeId: number,
  optionIds: number[]
): Promise<void> {
  const supabase = await createClient();

  // Update each option's ordre
  const updates = optionIds.map((optionId, index) =>
    supabase
      .from('exam_type_options')
      .update({ ordre: index })
      .eq('exam_type_id', examTypeId)
      .eq('exam_option_id', optionId)
  );

  await Promise.all(updates);
}

// Remplacer toutes les options d'un type d'examen
export async function setExamTypeOptions(
  examTypeId: number,
  optionIds: number[]
): Promise<void> {
  const supabase = await createClient();

  // Supprimer les associations existantes
  await supabase
    .from('exam_type_options')
    .delete()
    .eq('exam_type_id', examTypeId);

  // Ajouter les nouvelles associations
  if (optionIds.length > 0) {
    const inserts = optionIds.map((optionId, index) => ({
      exam_type_id: examTypeId,
      exam_option_id: optionId,
      ordre: index,
    }));

    const { error } = await supabase
      .from('exam_type_options')
      .insert(inserts);

    if (error) throw new Error(error.message);
  }
}
