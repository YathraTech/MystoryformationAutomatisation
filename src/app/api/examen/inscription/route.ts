import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
const postalCodeRegex = /^\d{5}$/;

const examenSchema = z.object({
  civilite: z.enum(['M.', 'Mme', 'Autre']),
  nom: z.string().min(2),
  prenom: z.string().min(2),
  email: z.string().email(),
  telephone: z.string().regex(phoneRegex),
  dateNaissance: z.string().min(1),
  adresse: z.string().min(5),
  codePostal: z.string().regex(postalCodeRegex),
  ville: z.string().min(2),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = examenSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;
    const supabase = await createClient();

    // Trouver ou créer le client
    const { data: clientResult, error: clientError } = await supabase
      .rpc('find_or_create_client', {
        p_email: data.email.toLowerCase(),
        p_telephone: data.telephone,
        p_civilite: data.civilite,
        p_nom: data.nom,
        p_prenom: data.prenom,
        p_date_naissance: data.dateNaissance,
        p_adresse: data.adresse,
        p_code_postal: data.codePostal,
        p_ville: data.ville,
      });

    if (clientError) {
      console.error('Error finding/creating client:', clientError);
      return NextResponse.json(
        { error: 'Erreur lors de la création du client' },
        { status: 500 }
      );
    }

    const clientId = clientResult as number;

    // Créer l'examen avec le client_id
    const { data: examen, error } = await supabase
      .from('examens')
      .insert({
        client_id: clientId,
        civilite: data.civilite,
        nom: data.nom,
        prenom: data.prenom,
        email: data.email.toLowerCase(),
        telephone: data.telephone,
        date_naissance: data.dateNaissance,
        adresse: data.adresse,
        code_postal: data.codePostal,
        ville: data.ville,
      })
      .select('id, token')
      .single();

    if (error || !examen) {
      console.error('Error creating examen:', error);
      return NextResponse.json(
        { error: error?.message || 'Erreur lors de la création' },
        { status: 500 }
      );
    }

    // Générer l'URL client
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const clientUrl = `${baseUrl}/examen/${examen.token}`;

    return NextResponse.json({
      id: examen.id,
      token: examen.token,
      clientUrl,
    });
  } catch (err) {
    console.error('Error in examen inscription:', err);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
