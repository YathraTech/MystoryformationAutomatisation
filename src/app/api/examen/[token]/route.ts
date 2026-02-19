import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const diplomeSchema = z.object({
  diplome: z.string().min(1),
  motivation: z.string().min(1),
  motivationAutre: z.string().nullable().optional(),
});

// GET - Récupérer les infos de l'examen par token (accessible sans auth)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createAdminClient();

    const { data: examen, error } = await supabase
      .from('examens')
      .select('id, civilite, nom, prenom, diplome')
      .eq('token', token)
      .single();

    if (error || !examen) {
      return NextResponse.json(
        { error: 'Examen non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(examen);
  } catch (err) {
    console.error('Error fetching examen:', err);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// Helper function to get exam option label from database
async function getExamOptionLabel(code: string): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('exam_options')
      .select('label')
      .eq('code', code)
      .single();

    if (error) {
      console.error('Error fetching exam option label:', error);
      return null;
    }
    return data?.label || null;
  } catch (err) {
    console.error('Exception fetching exam option label:', err);
    return null;
  }
}

// Helper function to validate exam type exists in database
async function validateExamType(code: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('exam_types')
      .select('id')
      .eq('code', code)
      .eq('visible', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`Exam type "${code}" not found in database`);
        return false;
      }
      // Table doesn't exist or other error - fallback to allowing
      console.error('Error validating exam type:', error);
      return true;
    }

    return !!data;
  } catch (err) {
    console.error('Exception validating exam type:', err);
    return true;
  }
}

// Helper function to validate exam option exists in database
// Returns true if table doesn't exist (fallback mode) or if option exists
async function validateExamOption(code: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('exam_options')
      .select('id')
      .eq('code', code)
      .eq('visible_public', true)
      .single();

    // If table doesn't exist or other DB error, allow the option (fallback mode)
    if (error) {
      // PGRST116 = no rows found - this means option doesn't exist
      if (error.code === 'PGRST116') {
        console.log(`Exam option "${code}" not found in database`);
        return false;
      }
      // Other errors (like table not existing) - fallback to allowing
      console.error('Error validating exam option:', error);
      return true; // Allow in fallback mode
    }

    return !!data;
  } catch (err) {
    console.error('Exception validating exam option:', err);
    return true; // Allow in fallback mode
  }
}

// Helper function to validate the diplome format (TYPE_CODE:OPTION_CODE or just TYPE_CODE)
async function validateDiplome(diplome: string): Promise<{ valid: boolean; error?: string }> {
  const parts = diplome.split(':');

  if (parts.length === 2) {
    // New format: TYPE_CODE:OPTION_CODE
    const [typeCode, optionCode] = parts;

    // Validate exam type
    const isValidType = await validateExamType(typeCode);
    if (!isValidType) {
      return { valid: false, error: `Type d'examen invalide: ${typeCode}` };
    }

    // Validate exam option
    const isValidOption = await validateExamOption(optionCode);
    if (!isValidOption) {
      return { valid: false, error: `Option de diplôme invalide: ${optionCode}` };
    }

    return { valid: true };
  } else if (parts.length === 1) {
    // Could be just a type code (no options associated) or old format
    const code = parts[0];

    // Try as exam type first
    const isValidType = await validateExamType(code);
    if (isValidType) {
      return { valid: true };
    }

    // Try as exam option (old format compatibility)
    const isValidOption = await validateExamOption(code);
    if (isValidOption) {
      return { valid: true };
    }

    // If both fail, still allow in fallback mode for old data
    console.log(`Diplome "${code}" not found as type or option, allowing in fallback mode`);
    return { valid: true };
  }

  return { valid: false, error: 'Format de diplôme invalide' };
}

// PATCH - Mettre à jour le diplôme choisi (accessible sans auth)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    console.log('[Examen PATCH] Token:', token);

    const body = await request.json();
    console.log('[Examen PATCH] Body:', body);

    const result = diplomeSchema.safeParse(body);
    if (!result.success) {
      console.log('[Examen PATCH] Validation failed:', result.error);
      return NextResponse.json(
        { error: 'Diplôme invalide' },
        { status: 400 }
      );
    }

    const selectedDiplome = result.data.diplome;
    const selectedMotivation = result.data.motivation;
    const selectedMotivationAutre = result.data.motivationAutre;
    console.log('[Examen PATCH] Selected diplome:', selectedDiplome);
    console.log('[Examen PATCH] Selected motivation:', selectedMotivation);

    // Validate that the diploma format and codes are valid
    const validationResult = await validateDiplome(selectedDiplome);
    console.log('[Examen PATCH] Validation result:', validationResult);

    if (!validationResult.valid) {
      return NextResponse.json(
        { error: validationResult.error || 'Option de diplôme invalide' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Vérifier que l'examen existe et n'a pas déjà un diplôme choisi
    const { data: existing, error: fetchError } = await supabase
      .from('examens')
      .select('id, diplome, email')
      .eq('token', token)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Examen non trouvé' },
        { status: 404 }
      );
    }

    if (existing.diplome) {
      return NextResponse.json(
        { error: 'Le diplôme a déjà été choisi' },
        { status: 400 }
      );
    }

    // Vérifier si le client a d'autres examens en cours (non passés)
    const { data: autresExamens } = await supabase
      .from('examens')
      .select('id, diplome, date_examen, resultat')
      .eq('email', existing.email)
      .neq('id', existing.id)
      .in('resultat', ['a_venir']);

    let noteAutreExamen = '';

    if (autresExamens && autresExamens.length > 0) {
      // Vérifier si un examen avec le MÊME diplôme est déjà en cours
      const memeExamen = autresExamens.find(ex => ex.diplome === selectedDiplome);

      if (memeExamen) {
        const diplomeLabel = await getExamOptionLabel(selectedDiplome) || selectedDiplome;
        return NextResponse.json(
          {
            error: `Vous êtes déjà inscrit(e) pour l'examen "${diplomeLabel}". Veuillez d'abord passer cet examen avant de pouvoir vous réinscrire.`,
            code: 'MEME_EXAMEN_EN_COURS'
          },
          { status: 409 }
        );
      }

      // Si c'est un autre examen, ajouter une note pour le staff
      const autresDetailsPromises = autresExamens
        .filter(ex => ex.diplome)
        .map(async ex => {
          const label = await getExamOptionLabel(ex.diplome) || ex.diplome;
          const date = ex.date_examen
            ? new Date(ex.date_examen).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
            : 'date non définie';
          return `${label} (${date})`;
        });

      const autresDetails = await Promise.all(autresDetailsPromises);

      if (autresDetails.length > 0) {
        noteAutreExamen = `⚠️ Ce client a déjà un autre examen prévu : ${autresDetails.join(', ')}`;
      }
    }

    // Mettre à jour le diplôme et la motivation
    const updateData: Record<string, string | null> = {
      diplome: selectedDiplome,
      diplome_choisi_at: new Date().toISOString(),
      motivation: selectedMotivation,
      motivation_autre: selectedMotivationAutre || null,
    };

    if (noteAutreExamen) {
      updateData.note_staff = noteAutreExamen;
    }

    const { error: updateError } = await supabase
      .from('examens')
      .update(updateData)
      .eq('token', token);

    if (updateError) {
      console.error('Error updating examen:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating examen:', err);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
