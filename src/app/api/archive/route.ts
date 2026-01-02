import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface ArchiveFolder {
  name: string;       // e.g., "2025-12"
  memoCount: number;  // number of .m4a files in the folder
}

export async function GET() {
  try {
    const VOICE_MEMOS_DIR = await fs.realpath(path.join(process.cwd(), 'VoiceMemos'));
    const ARCHIVE_DIR = path.join(VOICE_MEMOS_DIR, 'archive');

    let folders: ArchiveFolder[] = [];
    
    try {
      const archiveFolders = await fs.readdir(ARCHIVE_DIR);
      
      // Get memo count for each folder
      folders = await Promise.all(
        archiveFolders.map(async (folderName) => {
          const folderPath = path.join(ARCHIVE_DIR, folderName);
          const stat = await fs.stat(folderPath);
          
          if (!stat.isDirectory()) {
            return null;
          }
          
          const files = await fs.readdir(folderPath);
          const memoCount = files.filter(f => f.endsWith('.m4a')).length;
          
          return {
            name: folderName,
            memoCount
          };
        })
      ).then(results => results.filter((f): f is ArchiveFolder => f !== null));
      
      // Sort by name descending (newest first)
      folders.sort((a, b) => b.name.localeCompare(a.name));
    } catch {
      // Archive directory doesn't exist yet
    }

    return NextResponse.json(folders);
  } catch (error) {
    console.error('Error listing archive folders:', error);
    return NextResponse.json({ error: 'Failed to list archive folders' }, { status: 500 });
  }
}

