import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { uploadToGCS } from "@/lib/storage";

/**
 * POST /api/upload/task-cover
 * Upload task cover image to GCS
 */
export async function POST(req) {
  const authResult = await requireAuth(req);
  
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  
  const { user } = authResult;
  
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      );
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit.' },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Upload to GCS in task-covers folder
    const folder = `task-covers/${user.id}`;
    const result = await uploadToGCS(buffer, file.name, file.type, folder);
    
    return NextResponse.json({
      url: result.url,
      filename: result.filename,
      path: result.path,
    }, { status: 200 });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
