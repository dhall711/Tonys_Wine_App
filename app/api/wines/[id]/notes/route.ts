import { NextResponse } from 'next/server';
import { fetchUserNote, saveUserNoteToDb } from '@/lib/wineService';

// GET /api/wines/[id]/notes - Get user note
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const note = await fetchUserNote(id);
    return NextResponse.json({ note });
  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json(
      { error: 'Failed to fetch note' },
      { status: 500 }
    );
  }
}

// POST /api/wines/[id]/notes - Save user note
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { note } = await request.json();
    await saveUserNoteToDb(id, note || '');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving note:', error);
    return NextResponse.json(
      { error: 'Failed to save note' },
      { status: 500 }
    );
  }
}
