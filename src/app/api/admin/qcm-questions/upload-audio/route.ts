import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4'];
const MAX_SIZE = 20 * 1024 * 1024; // 20 Mo

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const questionId = formData.get('questionId') as string;

    if (!file) {
      return NextResponse.json({ error: 'Fichier audio manquant' }, { status: 400 });
    }

    if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Format non autorisé. Formats acceptés : MP3, WAV, OGG` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 20 Mo)' }, { status: 400 });
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `qcm-audio/${Date.now()}_${sanitizedName}`;

    const supabase = createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('[Upload audio error]', uploadError);
      return NextResponse.json({ error: 'Erreur lors de l\'upload' }, { status: 500 });
    }

    // Générer l'URL publique
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Si questionId fourni, mettre à jour la question
    if (questionId) {
      const { error: updateError } = await supabase
        .from('qcm_questions')
        .update({ media_url: publicUrl })
        .eq('id', parseInt(questionId));

      if (updateError) {
        console.error('[Update question audio]', updateError);
      }
    }

    return NextResponse.json({ url: publicUrl, path: storagePath });
  } catch (error) {
    console.error('[POST upload-audio]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
