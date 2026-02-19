import { NextResponse } from 'next/server';
import { getAllExamTypes, createExamType } from '@/lib/data/exam-types';

export async function GET() {
  try {
    const types = await getAllExamTypes();
    return NextResponse.json({ types });
  } catch (error) {
    console.error('Error fetching exam types:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des types d\'examens' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { code, label, description, icon, color, visible, ordre } = body;

    if (!code || !label) {
      return NextResponse.json(
        { error: 'Code et label sont requis' },
        { status: 400 }
      );
    }

    const examType = await createExamType({
      code,
      label,
      description: description || null,
      icon: icon || 'BookOpen',
      color: color || 'blue',
      visible: visible !== false,
      ordre: ordre || 0,
    });

    return NextResponse.json({ type: examType }, { status: 201 });
  } catch (error) {
    console.error('Error creating exam type:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du type d\'examen' },
      { status: 500 }
    );
  }
}
