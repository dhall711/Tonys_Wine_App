import { NextResponse } from 'next/server';
import { fetchConsumptionHistory, addConsumptionToDb, removeConsumptionFromDb } from '@/lib/wineService';

// GET /api/wines/[id]/consumption - Get consumption history
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const history = await fetchConsumptionHistory(id);
    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching consumption history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consumption history' },
      { status: 500 }
    );
  }
}

// POST /api/wines/[id]/consumption - Add consumption event
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { date, notes } = await request.json();
    const event = await addConsumptionToDb(id, date, notes || '');
    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error adding consumption:', error);
    return NextResponse.json(
      { error: 'Failed to add consumption' },
      { status: 500 }
    );
  }
}

// DELETE /api/wines/[id]/consumption - Remove consumption event
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { consumptionId } = await request.json();
    await removeConsumptionFromDb(consumptionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing consumption:', error);
    return NextResponse.json(
      { error: 'Failed to remove consumption' },
      { status: 500 }
    );
  }
}
