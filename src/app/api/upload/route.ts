import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert the image to a base64 string
    const mimeType = file.type || 'image/jpeg';
    const base64String = buffer.toString('base64');
    const fileUrl = `data:${mimeType};base64,${base64String}`;

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
