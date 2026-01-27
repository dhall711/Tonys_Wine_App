import { NextResponse } from 'next/server';
import { fetchAllWines, addWineToDb, bulkImportWines } from '@/lib/wineService';
import { Wine } from '@/lib/types';
import { uploadWineImages } from '@/lib/imageService';

// GET /api/wines - Fetch all wines
export async function GET() {
  try {
    const wines = await fetchAllWines();
    return NextResponse.json({ wines });
  } catch (error) {
    console.error('Error fetching wines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wines' },
      { status: 500 }
    );
  }
}

// POST /api/wines - Add a new wine or bulk import
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Check if this is a bulk import
    if (body.bulkImport && Array.isArray(body.wines)) {
      const count = await bulkImportWines(body.wines as Wine[], body.isUserAdded || false);
      return NextResponse.json({ success: true, count });
    }
    
    // Single wine add - upload images to storage first
    const wineData = body as Wine;
    
    // Upload images to Supabase Storage if they're base64
    if (wineData.frontImage?.startsWith('data:') || wineData.backImage?.startsWith('data:')) {
      const { frontUrl, backUrl } = await uploadWineImages(
        wineData.id,
        wineData.frontImage,
        wineData.backImage
      );
      
      if (frontUrl) wineData.frontImage = frontUrl;
      if (backUrl) wineData.backImage = backUrl;
    }
    
    const wine = await addWineToDb(wineData, true);
    return NextResponse.json({ wine });
  } catch (error) {
    console.error('Error adding wine:', error);
    return NextResponse.json(
      { error: 'Failed to add wine' },
      { status: 500 }
    );
  }
}
