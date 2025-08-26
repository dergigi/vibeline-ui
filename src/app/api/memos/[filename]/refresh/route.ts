import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // Resolve the symlink to get the actual path
    const VOICE_MEMOS_DIR = await fs.realpath(path.join(process.cwd(), 'VoiceMemos'));
    
    const { filename } = await params;
    const baseFilename = filename;
    
    // Use glob to find all files matching the pattern
    const pattern = path.join(VOICE_MEMOS_DIR, '**', `${baseFilename}.*`);
    const files = await glob(pattern, { nodir: true });
    
    // Filter out the audio file - NEVER delete the audio file
    const filesToDelete = files.filter(filePath => {
      const ext = path.extname(filePath).toLowerCase();
      return ext !== '.m4a' && ext !== '.mp3' && ext !== '.wav' && ext !== '.aac';
    });
    
    // Delete all matching files (excluding audio)
    const deletedFiles: string[] = [];
    const errors: string[] = [];
    
    for (const filePath of filesToDelete) {
      try {
        await fs.unlink(filePath);
        deletedFiles.push(path.relative(VOICE_MEMOS_DIR, filePath));
      } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error);
        errors.push(path.relative(VOICE_MEMOS_DIR, filePath));
      }
    }
    
    return NextResponse.json({
      success: true,
      filename: baseFilename,
      deletedFiles,
      totalDeleted: deletedFiles.length,
      errors,
      totalErrors: errors.length
    });
  } catch (error) {
    console.error('Error refreshing memo:', error);
    return NextResponse.json(
      { error: 'Failed to refresh memo' },
      { status: 500 }
    );
  }
}
