import { NextRequest, NextResponse } from 'next/server';
import { getExamensByClientId, getExamensByEmail } from '@/lib/data/examens';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = parseInt(id, 10);

    if (isNaN(clientId)) {
      // If not a number, treat as email
      const examens = await getExamensByEmail(id);
      return NextResponse.json({ examens });
    }

    // Try to get client info first
    const supabase = await createClient();
    const { data: client } = await supabase
      .from('clients')
      .select('email')
      .eq('id', clientId)
      .single();

    // If we have a client, get examens by both client_id and email
    if (client?.email) {
      const [byClientId, byEmail] = await Promise.all([
        getExamensByClientId(clientId),
        getExamensByEmail(client.email),
      ]);

      // Merge and deduplicate by ID
      const examensMap = new Map<number, typeof byClientId[0]>();
      [...byClientId, ...byEmail].forEach((e) => examensMap.set(e.id, e));
      const examens = Array.from(examensMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return NextResponse.json({ examens });
    }

    // Fallback to just client_id
    const examens = await getExamensByClientId(clientId);
    return NextResponse.json({ examens });
  } catch (error) {
    console.error('Error fetching client examens:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des examens' },
      { status: 500 }
    );
  }
}
