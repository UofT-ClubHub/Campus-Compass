import { NextRequest, NextResponse } from 'next/server';
import { uploadImage, deleteImage } from '../storage';
import { firestore } from '../firebaseAdmin';
import { checkClubPermissions, checkPostPermissions, withAuth } from '@/lib/auth-middleware';

export const POST = withAuth(async (request: NextRequest) => {
  try {
    // Handle file upload
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'posts';
    const originalImageUrl = formData.get('originalImageUrl') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // The only image that may be deleted: the one the authorized post/club currently uses
    let currentImage: string | undefined;

    // Additional authorization checks for specific resources
    if (folder === 'posts') {
      const postId = formData.get('postId') as string;
      if (!postId) {
        return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
      }
      const { authorized, error, status } = await checkPostPermissions(request, postId);
      if (!authorized) {
        return NextResponse.json({ error: error || 'Forbidden' }, { status: status || 403 });
      }
      if (originalImageUrl) currentImage = (await firestore.collection('Posts').doc(postId).get()).data()?.image;
    }
    else if (folder === 'clubs') {
      const clubId = formData.get('clubId') as string;
      const { authorized, error, status } = await checkClubPermissions(request, clubId);
      if (!authorized) {
        return NextResponse.json({ error: error || 'Forbidden' }, { status: status || 403 });
      }
      if (originalImageUrl && clubId) currentImage = (await firestore.collection('Clubs').doc(clubId).get()).data()?.image;
    }
    else if (folder === 'pending-clubs') {
      // No additional authorization checks needed for pending club images; never deletes an original
    }
    else {
      return NextResponse.json({ error: 'Invalid folder' }, { status: 400 });
    }
    
    // Delete the original only if it is the authorized post/club's current image
    if (originalImageUrl && originalImageUrl === currentImage && originalImageUrl.includes('firebase')) {
      try {
        await deleteImage(originalImageUrl);
      } catch (error) {
        console.warn('Failed to delete original image:', error);
      }
    }
    
    // Convert file to buffer and upload
    const buffer = Buffer.from(await file.arrayBuffer());
    const downloadURL = await uploadImage(buffer, file.name, folder);

    return NextResponse.json({ downloadURL });

  } catch (error) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
});