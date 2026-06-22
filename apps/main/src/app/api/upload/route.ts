import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
  }

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      // Mock upload for local development if token is missing
      const mockUrl = `https://mock.blob.vercel-storage.com/${filename}`;
      return NextResponse.json({ url: mockUrl });
    }

    const blob = await put(filename, request.body!, {
      access: 'public',
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
