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

    const body = await request.json();
    const { docType, fileName } = body as { docType: DocType; fileName: string };

    if (!docType || !fileName || !DOC_TYPE_FIELD_MAP[docType]) {
      return NextResponse.json(
        { error: 'docType et fileName requis' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const storagePath = `examens/${examenId}/${docType}_${fileName}`;

    // Create a signed upload URL so the client uploads directly to Storage
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      console.error('[Signed Upload URL Error]', error);
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'URL d\'upload' },
        { status: 500 }
      );
    }

    // Save the storage path in DB now (the client will upload the file next)
    const fieldName = DOC_TYPE_FIELD_MAP[docType];
    await updateExamenFields(examenId, { [fieldName]: storagePath });

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: storagePath,
    });
  } catch (error) {
    console.error('[Upload PDF Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload' },
      { status: 500 }
    );
  }
}
