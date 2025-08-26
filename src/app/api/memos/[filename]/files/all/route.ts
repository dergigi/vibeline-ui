import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // Resolve the symlink to get the actual path
    const VOICE_MEMOS_DIR = await fs.realpath(path.join(process.cwd(), 'VoiceMemos'));
    
    const { filename } = await params;
    const baseFilename = filename;
    
    // Use glob to find ALL files matching the pattern (including audio)
    const pattern = path.join(VOICE_MEMOS_DIR, '**', `${baseFilename}.*`);
    const files = await glob(pattern, { nodir: true });
    
    // Group files by their parent directory (plugin/category)
    const filesByCategory: { [category: string]: Array<{ filename: string; fullPath: string }> } = {};
    
    for (const filePath of files) {
      const relativePath = path.relative(VOICE_MEMOS_DIR, filePath);
      const category = path.dirname(relativePath);
      const filename = path.basename(filePath);
      
      if (!filesByCategory[category]) {
        filesByCategory[category] = [];
      }
      
      filesByCategory[category].push({
        filename,
        fullPath: filePath
      });
    }
    
    // Convert to the expected format
    const allFiles = Object.entries(filesByCategory).flatMap(([category, files]) =>
      files.map(file => ({
        category: category === '.' ? '.' : category,
        filename: file.filename,
        fullPath: file.fullPath,
        exists: true
      }))
    );

    return NextResponse.json({
      filename: baseFilename,
      files: allFiles,
      totalFiles: allFiles.length
    });
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    );
  }
}
