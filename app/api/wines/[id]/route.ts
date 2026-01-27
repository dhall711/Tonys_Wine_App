import { NextResponse } from 'next/server';
import { fetchWineById, updateWineInDb, deleteWineFromDb, restoreWineInDb } from '@/lib/wineService';

// GET /api/wines/[id] - Fetch single wine
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const wine = await fetchWineById(id);
    
    if (!wine) {
      return NextResponse.json(
        { error: 'Wine not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ wine });
  } catch (error) {
    console.error('Error fetching wine:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wine' },
      { status: 500 }
    );
  }
}

// PATCH /api/wines/[id] - Update wine
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const wine = await updateWineInDb(id, updates);
    return NextResponse.json({ wine });
  } catch (error) {
    console.error('Error updating wine:', error);
    return NextResponse.json(
      { error: 'Failed to update wine' },
      { status: 500 }
    );
  }
}

// DELETE /api/wines/[id] - Soft delete wine
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteWineFromDb(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting wine:', error);
    return NextResponse.json(
      { error: 'Failed to delete wine' },
      { status: 500 }
    );
  }
}

// PUT /api/wines/[id] - Restore deleted wine
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (body.action === 'restore') {
      await restoreWineInDb(id);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error restoring wine:', error);
    return NextResponse.json(
      { error: 'Failed to restore wine' },
      { status: 500 }
    );
  }
}
