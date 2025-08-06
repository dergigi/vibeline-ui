import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
): Promise<NextResponse> {
  try {
    // Resolve the symlink to get the actual path
    const VOICE_MEMOS_DIR = await fs.realpath(path.join(process.cwd(), 'VoiceMemos'));
    
    const { filename } = await params;
    const decodedFilename = decodeURIComponent(filename);
    const filePath = path.join(VOICE_MEMOS_DIR, decodedFilename);
    
    // Verify file exists and is within the voice memos directory
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(VOICE_MEMOS_DIR)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const file = await fs.readFile(filePath);
    
    return new NextResponse(file, {
      headers: {
        'Content-Type': 'audio/mp4',
        'Content-Disposition': `inline; filename="${decodedFilename}"`,
      },
    });
  } catch (error) {
    console.error('Error serving audio file:', error);
    return new NextResponse('Not Found', { status: 404 });
  }
} 