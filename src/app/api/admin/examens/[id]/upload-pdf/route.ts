import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateExamenFields } from '@/lib/data/examens';

type DocType = 'attestation_paiement' | 'fiche_inscription' | 'convocation';

const DOC_TYPE_FIELD_MAP: Record<DocType, 'pdfAttestationPaiement' | 'pdfFicheInscription' | 'pdfConvocation'> = {
  attestation_paiement: 'pdfAttestationPaiement',
  fiche_inscription: 'pdfFicheInscription',
  convocation: 'pdfConvocation',
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const examenId = parseInt(id, 10);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const docType = formData.get('docType') as DocType | null;

    if (!file || !docType || !DOC_TYPE_FIELD_MAP[docType]) {
      return NextResponse.json(
        { error: 'file et docType requis' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const storagePath = `examens/${examenId}/${docType}_${file.name}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('[Upload PDF Error]', uploadError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'upload du PDF' },
        { status: 500 }
      );
    }

    // Save the storage path in DB
    const fieldName = DOC_TYPE_FIELD_MAP[docType];
    await updateExamenFields(examenId, { [fieldName]: storagePath });

    return NextResponse.json({ success: true, path: storagePath });
  } catch (error) {
    console.error('[Upload PDF Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload' },
      { status: 500 }
    );
  }
}
