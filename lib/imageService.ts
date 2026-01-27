// Image service - handles Supabase Storage operations
import { supabase } from './supabase';

const BUCKET_NAME = 'wine-labels';

// Generate a unique filename for uploaded images
function generateFilename(wineId: string, type: 'front' | 'back', extension: string = 'jpg'): string {
  const timestamp = Date.now();
  return `${wineId}/${type}-${timestamp}.${extension}`;
}

// Get the file extension from a data URL or mime type
function getExtension(dataUrl: string): string {
  if (dataUrl.includes('image/png')) return 'png';
  if (dataUrl.includes('image/gif')) return 'gif';
  if (dataUrl.includes('image/webp')) return 'webp';
  return 'jpg';
}

// Convert base64 data URL to Blob
function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// Upload an image to Supabase Storage
export async function uploadWineImage(
  wineId: string,
  type: 'front' | 'back',
  imageDataUrl: string
): Promise<string> {
  // Skip if it's already a URL (not a data URL)
  if (!imageDataUrl.startsWith('data:')) {
    return imageDataUrl;
  }

  const extension = getExtension(imageDataUrl);
  const filename = generateFilename(wineId, type, extension);
  const blob = dataUrlToBlob(imageDataUrl);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, blob, {
      contentType: blob.type,
      upsert: true,
    });

  if (error) {
    console.error('Error uploading image:', error);
    throw error;
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// Upload both front and back images
export async function uploadWineImages(
  wineId: string,
  frontImage?: string,
  backImage?: string
): Promise<{ frontUrl?: string; backUrl?: string }> {
  const result: { frontUrl?: string; backUrl?: string } = {};

  if (frontImage) {
    try {
      result.frontUrl = await uploadWineImage(wineId, 'front', frontImage);
    } catch (e) {
      console.error('Failed to upload front image:', e);
      // Keep the original if upload fails
      result.frontUrl = frontImage;
    }
  }

  if (backImage) {
    try {
      result.backUrl = await uploadWineImage(wineId, 'back', backImage);
    } catch (e) {
      console.error('Failed to upload back image:', e);
      result.backUrl = backImage;
    }
  }

  return result;
}

// Delete wine images from storage
export async function deleteWineImages(wineId: string): Promise<void> {
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(wineId);

  if (listError) {
    console.error('Error listing wine images:', listError);
    return;
  }

  if (files && files.length > 0) {
    const filesToDelete = files.map(f => `${wineId}/${f.name}`);
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filesToDelete);

    if (deleteError) {
      console.error('Error deleting wine images:', deleteError);
    }
  }
}

// Check if an image URL is from Supabase Storage
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('supabase.co/storage');
}

// Get the Supabase Storage URL for the project
export function getStorageBaseUrl(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}`;
}
