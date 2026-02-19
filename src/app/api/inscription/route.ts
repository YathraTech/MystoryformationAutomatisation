import { NextRequest, NextResponse } from 'next/server';
import { inscriptionCompleteSchema } from '@/lib/validations/inscription.schema';
import { getFormationById } from '@/lib/data/formations';
import { addInscription } from '@/lib/data/inscriptions';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = inscriptionCompleteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Données invalides',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    const formation = await getFormationById(data.formationId);

    // Récupérer le lieu de l'utilisateur connecté (si connecté)
    let userLieu: string | null = null;
    try {
      const sessionUser = await getSessionUser();
      if (sessionUser?.role === 'admin' && body.lieu) {
        // Admin peut choisir le centre manuellement
        userLieu = body.lieu;
      } else if (sessionUser?.lieu) {
        userLieu = sessionUser.lieu;
      }
    } catch {
      // Pas d'utilisateur connecté (formulaire public) - lieu reste null
    }

    // Trouver ou créer le client
    const supabase = await createClient();
    const { data: clientId, error: clientError } = await supabase
      .rpc('find_or_create_client', {
        p_email: data.email.toLowerCase(),
        p_telephone: data.telephone,
        p_civilite: data.civilite,
        p_nom: data.nom.toUpperCase(),
        p_prenom: data.prenom,
        p_date_naissance: data.dateNaissance,
        p_adresse: data.adresse,
        p_code_postal: data.codePostal,
        p_ville: data.ville,
      });

    if (clientError) {
      console.error('Error finding/creating client:', clientError);
      // Continue without client_id if function doesn't exist yet
    }

    // Save to Supabase
    await addInscription({
      clientId: clientId as number | undefined,
      timestamp: new Date().toISOString(),
      civilite: data.civilite,
      nom: data.nom.toUpperCase(),
      prenom: data.prenom,
      email: data.email.toLowerCase(),
      telephone: data.telephone,
      dateNaissance: data.dateNaissance,
      adresse: data.adresse,
      codePostal: data.codePostal,
      ville: data.ville,
      numeroCPF: data.numeroCPF || '',
      numeroSecuriteSociale: data.numeroSecuriteSociale || '',
      modeFinancement: data.modeFinancement,
      langue: data.langue,
      niveauActuel: data.niveauActuel,
      objectif: data.objectif,
      formationId: data.formationId,
      formationNom: formation?.nom || '',
      formationDuree: formation?.dureeHeures ? `${formation.dureeHeures}h` : '',
      formationPrix: formation?.prix ? `${formation.prix}€` : '',
      joursDisponibles: data.joursDisponibles.join(', '),
      creneauxHoraires: data.creneauxHoraires.join(', '),
      dateDebutSouhaitee: data.dateDebutSouhaitee,
      dateFormation: null,
      heureFormation: null,
      commentaires: data.commentaires || '',
      lieu: userLieu,
    });

    // Also send to Make webhook if configured
    const webhookUrl = process.env.MAKE_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            source: 'formulaire_web',
            civilite: data.civilite,
            nom: data.nom.toUpperCase(),
            prenom: data.prenom,
            email: data.email.toLowerCase(),
            telephone: data.telephone,
            date_naissance: data.dateNaissance,
            adresse: data.adresse,
            code_postal: data.codePostal,
            ville: data.ville,
            numero_cpf: data.numeroCPF || '',
            numero_securite_sociale: data.numeroSecuriteSociale || '',
            mode_financement: data.modeFinancement,
            langue: data.langue,
            niveau_actuel: data.niveauActuel,
            objectif: data.objectif,
            formation_id: data.formationId,
            formation_nom: formation?.nom || '',
            formation_duree: formation?.dureeHeures || 0,
            formation_prix: formation?.prix || 0,
            jours_disponibles: data.joursDisponibles.join(', '),
            creneaux_horaires: data.creneauxHoraires.join(', '),
            date_debut_souhaitee: data.dateDebutSouhaitee,
            commentaires: data.commentaires || '',
            accept_cgu: data.acceptCGU,
            accept_rgpd: data.acceptRGPD,
          }),
        });
      } catch (webhookError) {
        console.error('Make webhook error (non-blocking):', webhookError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Inscription enregistrée avec succès',
      data: {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        formation: formation?.nom,
      },
    });
  } catch (error) {
    console.error('Erreur inscription:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Une erreur est survenue',
      },
      { status: 500 }
    );
  }
}
