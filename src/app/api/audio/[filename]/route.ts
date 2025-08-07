import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { createReadStream, statSync } from 'fs';

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

    // Get file stats for proper headers
    const stats = statSync(filePath);
    const fileSize = stats.size;
    
    // Check for range requests (for seeking support)
    const range = request.headers.get('range');
    
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      const file = createReadStream(filePath, { start, end });
      
      return new NextResponse(file as any, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': 'audio/mp4',
          'Content-Disposition': `inline; filename="${decodedFilename}"`,
        },
      });
    } else {
      // No range request, serve the full file
      const file = createReadStream(filePath);
      
      return new NextResponse(file as any, {
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': fileSize.toString(),
          'Content-Type': 'audio/mp4',
          'Content-Disposition': `inline; filename="${decodedFilename}"`,
        },
      });
    }
  } catch (error) {
    console.error('Error serving audio file:', error);
    return new NextResponse('Not Found', { status: 404 });
  }
} 