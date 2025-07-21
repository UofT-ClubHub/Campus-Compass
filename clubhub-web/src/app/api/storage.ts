import { admin } from './firebaseAdmin';

const storage = admin.storage();

// Upload an image to Firebase Storage
export async function uploadImage(
  fileBuffer: Buffer,
  fileName: string,
  folder: string = 'posts'
): Promise<string> {
  if (!fileBuffer) throw new Error("No file provided");

  // Validate file type
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  
  if (!allowedExtensions.includes(extension)) {
    throw new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.");
  }

  // Validate file size (5MB limit)
  if (fileBuffer.length > 5 * 1024 * 1024) {
    throw new Error("File size must be less than 5MB");
  }

  try {
    // Create unique filename
    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${folder}/${timestamp}_${safeName}`;
    
    // Get content type
    const contentType = getContentType(extension);
    
    // Upload to Firebase Storage
    const bucket = storage.bucket();
    const file = bucket.file(path);
    
    await file.save(fileBuffer, {
      metadata: { contentType }
    });

    // Make file public
    await file.makePublic();

    // Return Firebase Storage download URL
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media`;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload image');
  }
}

// Delete an image from Firebase Storage
export async function deleteImage(imageUrl: string): Promise<void> {
  if (!imageUrl || !imageUrl.includes('storage.googleapis.com')) {
    return;
  }

  try {
    // Extract path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    pathParts.shift(); // Remove empty string
    pathParts.shift(); // Remove bucket name
    const path = pathParts.join('/');

    // Delete from storage
    const bucket = storage.bucket();
    const file = bucket.file(path);
    
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
    }
  } catch (error) {
    // Don't throw errors for deletion failures
    console.warn('Delete failed:', error);
  }
}

// Helper function to get content type
function getContentType(extension: string): string {
  switch (extension.toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
} 