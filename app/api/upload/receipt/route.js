import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the form data
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type - allow images and PDFs for receipts
    const allowedTypes = [
      "image/jpeg",
      "image/png", 
      "image/jpg",
      "image/webp",
      "image/gif",
      "application/pdf"
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images (JPEG, PNG, WebP, GIF) and PDF files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max for receipts)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get user ID from session
    const userId = session.user.id;

    // Upload to GCS in receipts folder
    const result = await uploadFile(
      buffer,
      file.name,
      file.type,
      "receipts",
      userId
    );

    return NextResponse.json(
      {
        message: "Receipt uploaded successfully",
        url: result.url,
        filename: result.filename,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Receipt upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload receipt" },
      { status: 500 }
    );
  }
}
