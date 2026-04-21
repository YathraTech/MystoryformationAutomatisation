import { NextRequest, NextResponse } from 'next/server';
import { inscriptionCompleteSchema } from '@/lib/validations/inscription.schema';
import { getFormationById } from '@/lib/data/formations';
import { addInscription } from '@/lib/data/inscriptions';
import { createStagiaireFormation } from '@/lib/data/stagiaires-formation';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth/session';
import { buildPreinscriptionFormationEmail } from '@/lib/utils/email-templates';

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

    // Récupérer l'utilisateur connecté (si connecté) et son lieu
    let userLieu: string | null = null;
    let sessionUser: Awaited<ReturnType<typeof getSessionUser>> = null;
    try {
      sessionUser = await getSessionUser();
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
      numeroDossierCPF: '',
      numeroSecuriteSociale: data.numeroSecuriteSociale || '',
      modeFinancement: data.modeFinancement,
      langue: data.langue,
      niveauActuel: data.niveauActuel,
      objectif: data.objectif,
      formationId: data.formationId,
      formationNom: formation?.nom || '',
      formationDuree: formation?.dureeHeures ? `${formation.dureeHeures}h` : '',
      formationPrix: formation?.prix ? `${formation.prix}€` : '',
      joursDisponibles: (data.joursDisponibles || []).join(', '),
      creneauxHoraires: (data.creneauxHoraires || []).join(', '),
      dateDebutSouhaitee: data.dateDebutSouhaitee || '',
      dateFormation: null,
      heureFormation: null,
      commentaires: data.commentaires || '',
      lieu: userLieu,
    });

    // Créer la fiche Suivi Formation (non bloquant en cas d'erreur)
    try {
      const adresseComplete = [data.adresse, data.codePostal, data.ville]
        .filter((v) => v && v.trim().length > 0)
        .join(', ');

      await createStagiaireFormation({
        client_id: (clientId as number | undefined) ?? null,
        civilite: data.civilite,
        nom: data.nom.toUpperCase(),
        prenom: data.prenom,
        date_naissance: data.dateNaissance,
        email: data.email.toLowerCase(),
        telephone: data.telephone,
        adresse_postale: adresseComplete,
        agence: userLieu, // 'Gagny' | 'Sarcelles' | null (CHECK accepte NULL)
        commerciale_id: sessionUser?.id ?? null,
        commerciale_nom: sessionUser ? `${sessionUser.prenom} ${sessionUser.nom}`.trim() : null,
        source_provenance: 'Site',
        type_prestation: 'Formation TEF IRN',
        statut: 'inscription',
        heures_prevues: formation?.dureeHeures ?? 0,
        montant_total: formation?.prix ?? null,
        mode_paiement:
          data.modeFinancement === 'CPF'
            ? 'CPF'
            : data.modeFinancement === 'Personnel'
              ? null
              : null,
        numero_dossier_cpf: data.numeroCPF || null,
      });
    } catch (stagiaireError) {
      // Ne pas bloquer l'inscription si la création du stagiaire échoue
      console.error('[Inscription] Création stagiaire_formation échouée:', stagiaireError);
    }

    // Envoi webhook Make.com — Confirmation de pré-inscription
    const webhookUrl = process.env.MAKE_ATTESTATION_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const formationDuree = formation?.dureeHeures ? `${formation.dureeHeures}h` : '';
        const formationPrix = formation?.prix ? `${formation.prix} €` : '';

        const emailHtml = buildPreinscriptionFormationEmail(
          data.prenom,
          data.nom.toUpperCase(),
          formation?.nom || '',
          formationDuree,
          formationPrix,
          data.modeFinancement,
          data.langue,
          data.niveauActuel,
        );

        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'confirmation_preinscription',
            timestamp: new Date().toISOString(),
            candidat: {
              email: data.email.toLowerCase(),
              prenom: data.prenom,
              nom: data.nom.toUpperCase(),
            },
            email_subject: `MYSTORYFormation - Confirmation de pré-inscription - ${formation?.nom || 'Formation'}`,
            email_html: emailHtml,
          }),
        });
      } catch (webhookError) {
        console.error('Make webhook pré-inscription error (non-blocking):', webhookError);
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
