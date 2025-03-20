import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const VOICE_MEMOS_DIR = path.join(os.homedir(), 'Vibe', 'VoiceMemos');

export async function GET(
  request: NextRequest,
  context: { params: { filename: string } }
): Promise<NextResponse> {
  try {
    const filename = decodeURIComponent(await Promise.resolve(context.params.filename));
    const filePath = path.join(VOICE_MEMOS_DIR, filename);
    
    // Verify file exists and is within the voice memos directory
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(VOICE_MEMOS_DIR)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const file = await fs.readFile(filePath);
    
    return new NextResponse(file, {
      headers: {
        'Content-Type': 'audio/mp4',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error serving audio file:', error);
    return new NextResponse('Not Found', { status: 404 });
  }
} 