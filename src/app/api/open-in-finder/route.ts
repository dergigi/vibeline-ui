import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { existsSync } from 'fs';

const execAsync = promisify(exec);
const VOICE_MEMOS_DIR = path.join(process.cwd(), 'VoiceMemos');

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { filename } = await request.json();
    if (!filename) {
      return new NextResponse('Filename is required', { status: 400 });
    }

    // Try both with and without .m4a extension
    let filePath = path.join(VOICE_MEMOS_DIR, filename);
    let normalizedPath = path.normalize(filePath);
    
    // If the file doesn't exist, try adding .m4a extension
    if (!existsSync(normalizedPath)) {
      filePath = path.join(VOICE_MEMOS_DIR, `${filename}.m4a`);
      normalizedPath = path.normalize(filePath);
    }
    
    // Security check: ensure the file is within the voice memos directory
    if (!normalizedPath.startsWith(VOICE_MEMOS_DIR)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Check if the file exists after trying both paths
    if (!existsSync(normalizedPath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    // On macOS, use the 'open -R' command to reveal the file in Finder
    await execAsync(`open -R "${normalizedPath}"`);
    
    return new NextResponse('File opened in Finder', { status: 200 });
  } catch (error) {
    console.error('Error opening file in Finder:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 