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

// Copy an image from one folder to another in Firebase Storage
export async function copyImageToFolder(
  imageUrl: string,
  targetFolder: string
): Promise<string> {
  if (!imageUrl || !imageUrl.includes('storage.googleapis.com')) {
    return imageUrl; // Return original if not a Firebase Storage URL
  }

  try {
    const bucket = storage.bucket();

    // Extract the source path from URL
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)/);
    if (!pathMatch) {
      throw new Error('Invalid storage URL format');
    }

    const encodedPath = pathMatch[1].split('?')[0];
    const sourcePath = decodeURIComponent(encodedPath);

    const sourceFile = bucket.file(sourcePath);

    // Check if source file exists
    const [exists] = await sourceFile.exists();
    if (!exists) {
      console.warn(`Source file does not exist: ${sourcePath}`);
      return imageUrl; // Return original URL if file doesn't exist
    }

    // Extract filename from source path
    const fileName = sourcePath.split('/').pop() || 'image.jpg';

    // Create destination path
    const timestamp = Date.now();
    const destinationPath = `${targetFolder}/${timestamp}_${fileName}`;
    const destinationFile = bucket.file(destinationPath);

    // Copy the file
    await sourceFile.copy(destinationFile);

    // Make the copied file public
    await destinationFile.makePublic();

    // Return new URL
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destinationPath)}?alt=media`;
  } catch (error) {
    console.error('Error copying image:', error);
    return imageUrl; // Return original URL on error to avoid breaking the flow
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