import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth/session';
import { z } from 'zod';

const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
const postalCodeRegex = /^\d{5}$/;

const examenSchema = z.object({
  civilite: z.enum(['M.', 'Mme', 'Autre']),
  nom: z.string().min(2),
  prenom: z.string().min(2),
  email: z.string().email(),
  telephone: z.string().regex(phoneRegex),
  adresse: z.string().min(5),
  codePostal: z.string().regex(postalCodeRegex),
  ville: z.string().min(2),
  nationalite: z.string().min(2),
  villeNaissance: z.string().min(2),
  lieuNaissance: z.string().min(2),
  dateNaissance: z.string().min(1),
  langueMaternelle: z.string().min(2),
  agence: z.string().min(1),
  sourceConnaissance: z.string().optional(),
  pieceIdentite: z.string().optional(),
  numeroPasseport: z.string().optional(),
  numeroCni: z.string().optional(),
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

    // Récupérer l'utilisateur connecté (si staff/commercial)
    const currentUser = await getSessionUser();

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

    // Vérifier si une inscription existe déjà pour ce client
    const { data: existingInscription } = await supabase
      .from('inscriptions')
      .select('id')
      .eq('email', data.email.toLowerCase())
      .limit(1)
      .single();

    // Si pas d'inscription, créer une fiche minimale pour le client
    if (!existingInscription) {
      await supabase
        .from('inscriptions')
        .insert({
          client_id: clientId,
          timestamp: new Date().toISOString(),
          civilite: data.civilite,
          nom: data.nom,
          prenom: data.prenom,
          email: data.email.toLowerCase(),
          telephone: data.telephone,
          date_naissance: data.dateNaissance,
          adresse: data.adresse,
          code_postal: data.codePostal,
          ville: data.ville,
          numero_cpf: '',
          numero_securite_sociale: '',
          mode_financement: '',
          langue: '',
          niveau_actuel: '',
          objectif: '',
          formation_id: '',
          formation_nom: 'Examen uniquement',
          formation_duree: '',
          formation_prix: '',
          jours_disponibles: '',
          creneaux_horaires: '',
          date_debut_souhaitee: '',
          commentaires: 'Fiche créée automatiquement lors de l\'inscription à un examen',
          statut: 'En attente',
        });
    }

    // Créer l'examen avec le client_id
    // Si un membre du staff est connecté, pré-remplir le formateur_id avec son ID
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
        nationalite: data.nationalite,
        ville_naissance: data.villeNaissance,
        lieu_naissance: data.lieuNaissance,
        langue_maternelle: data.langueMaternelle,
        lieu: data.agence, // L'agence devient le lieu par défaut
        source_connaissance: data.sourceConnaissance || null,
        piece_identite: data.pieceIdentite || null,
        numero_passeport: data.numeroPasseport || null,
        numero_cni: data.numeroCni || null,
        // Pré-remplir le formateur avec l'utilisateur connecté
        formateur_id: currentUser?.id || null,
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
