import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

const VOICE_MEMOS_DIR = path.join(process.cwd(), 'VoiceMemos');

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { filename, plugin } = await request.json();
    
    if (!filename) {
      return new NextResponse('Filename is required', { status: 400 });
    }
    
    if (!plugin) {
      return new NextResponse('Plugin name is required', { status: 400 });
    }

    // Get the base filename without extension
    const baseFilename = path.basename(filename, path.extname(filename));
    
    // Construct the plugin directory path
    const pluginDir = path.join(VOICE_MEMOS_DIR, plugin);
    
    // Check if the plugin directory exists
    if (!existsSync(pluginDir)) {
      return NextResponse.json(
        { error: `Plugin directory '${plugin}' does not exist` },
        { status: 404 }
      );
    }
    
    // Read all files in the plugin directory
    const files = await fs.readdir(pluginDir);
    
    // Find all files that match the base filename (regardless of extension)
    const filesToDelete = files.filter(file => {
      const fileBaseName = path.basename(file, path.extname(file));
      return fileBaseName === baseFilename;
    });

    // Delete all matching files
    await Promise.all(
      filesToDelete.map(async (file) => {
        const filePath = path.join(pluginDir, file);
        if (existsSync(filePath)) {
          await fs.unlink(filePath);
        }
      })
    );

    return NextResponse.json({ 
      success: true, 
      deletedFiles: filesToDelete,
      plugin
    });
  } catch (error) {
    console.error('Error deleting files:', error);
    return NextResponse.json(
      { error: 'Failed to delete files' },
      { status: 500 }
    );
  }
} 