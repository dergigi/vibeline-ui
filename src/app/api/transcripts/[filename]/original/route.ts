import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Resolve the symlink to get the actual path
    const VOICE_MEMOS_DIR = await fs.realpath(path.join(process.cwd(), 'VoiceMemos'));
    const TRANSCRIPTS_DIR = path.join(VOICE_MEMOS_DIR, 'transcripts');
    
    const originalTranscriptPath = path.join(TRANSCRIPTS_DIR, `${filename}.txt.orig`);
    
    try {
      const originalTranscript = await fs.readFile(originalTranscriptPath, 'utf-8');
      return new NextResponse(originalTranscript, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    } catch (error) {
      // If .txt.orig doesn't exist, return 404
      return new NextResponse('Original transcript not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching original transcript:', error);
    return NextResponse.json({ error: 'Failed to fetch original transcript' }, { status: 500 });
  }
}
