import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

const VOICE_MEMOS_DIR = path.join(process.cwd(), 'VoiceMemos');

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = path.join(VOICE_MEMOS_DIR, ...params.path);
    
    // Security check: ensure the file is within VOICE_MEMOS_DIR
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(VOICE_MEMOS_DIR)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    if (!existsSync(filePath)) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const content = await fs.readFile(filePath);
    const mimeType = getMimeType(filePath);

    return new NextResponse(content, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.json': 'application/json',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.pdf': 'application/pdf',
  };
  return mimeTypes[ext] || 'application/octet-stream';
} 