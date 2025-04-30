import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

const VOICE_MEMOS_DIR = path.join(process.cwd(), 'VoiceMemos');
const TRANSCRIPTS_DIR = path.join(VOICE_MEMOS_DIR, 'transcripts');

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { filename } = await request.json();
    if (!filename) {
      return new NextResponse('Filename is required', { status: 400 });
    }

    // Get the base filename without extension
    const baseFilename = path.basename(filename, path.extname(filename));
    
    // Read all files in the transcripts directory
    const files = await fs.readdir(TRANSCRIPTS_DIR);
    
    // Find all files that match the base filename (regardless of extension)
    const filesToDelete = files.filter(file => {
      const fileBaseName = path.basename(file, path.extname(file));
      return fileBaseName === baseFilename;
    });

    // Delete all matching files
    await Promise.all(
      filesToDelete.map(async (file) => {
        const filePath = path.join(TRANSCRIPTS_DIR, file);
        if (existsSync(filePath)) {
          await fs.unlink(filePath);
        }
      })
    );

    return NextResponse.json({ 
      success: true, 
      deletedFiles: filesToDelete 
    });
  } catch (error) {
    console.error('Error deleting transcript files:', error);
    return NextResponse.json(
      { error: 'Failed to delete transcript files' },
      { status: 500 }
    );
  }
} 