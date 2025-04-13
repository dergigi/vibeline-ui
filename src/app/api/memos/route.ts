import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const VOICE_MEMOS_DIR = path.join(process.cwd(), 'VoiceMemos');

// Define default plugins and their file extensions
const DEFAULT_PLUGINS = {
  TRANSCRIPTS: { dir: 'transcripts', ext: '.txt' },
  SUMMARIES: { dir: 'summaries', ext: '.txt' },
  TODOS: { dir: 'TODOs', ext: '.md' }
} as const;

type PluginKey = keyof typeof DEFAULT_PLUGINS;

interface Memo {
  filename: string;
  path: string;
  createdAt: string;
  [key: string]: string;
}

function parseTimestampFromFilename(filename: string): string {
  // Extract YYYYMMDD_HHMMSS from the filename
  const match = filename.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  if (!match) {
    return new Date().toISOString(); // Fallback to current time if pattern doesn't match
  }
  
  const [, year, month, day, hour, minute, second] = match;
  return new Date(
    parseInt(year),
    parseInt(month) - 1, // JavaScript months are 0-based
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  ).toISOString();
}

async function getPluginDirectories() {
  try {
    const entries = await fs.readdir(VOICE_MEMOS_DIR, { withFileTypes: true });
    const dirs = entries
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
      .reduce((acc, dir) => {
        const upperKey = dir.name.toUpperCase() as PluginKey;
        acc[upperKey] = {
          path: path.join(VOICE_MEMOS_DIR, dir.name),
          ext: DEFAULT_PLUGINS[upperKey]?.ext || '.md'
        };
        return acc;
      }, {} as Record<string, { path: string; ext: string }>);

    // Ensure default plugins are included
    for (const [key, value] of Object.entries(DEFAULT_PLUGINS)) {
      if (!dirs[key]) {
        const dirPath = path.join(VOICE_MEMOS_DIR, value.dir);
        // Create directory if it doesn't exist
        if (!existsSync(dirPath)) {
          await fs.mkdir(dirPath, { recursive: true });
        }
        dirs[key] = { path: dirPath, ext: value.ext };
      }
    }

    return dirs;
  } catch (error) {
    console.error('Error reading plugin directories:', error);
    return {};
  }
}

export async function GET() {
  try {
    const pluginDirs = await getPluginDirectories();
    const memos: Memo[] = [];

    // Read all files from each plugin directory
    await Promise.all(
      Object.entries(pluginDirs).map(async ([pluginType, { path: dirPath, ext }]) => {
        if (!existsSync(dirPath)) return;

        const files = await fs.readdir(dirPath);
        await Promise.all(
          files
            .filter(file => file.endsWith(ext))
            .map(async file => {
              const filePath = path.join(dirPath, file);
              try {
                const content = await fs.readFile(filePath, 'utf-8');
                const pluginKey = pluginType.toLowerCase().replace(/_/g, '');
                memos.push({
                  filename: file,
                  path: filePath,
                  createdAt: parseTimestampFromFilename(file),
                  [pluginKey]: content,
                });
              } catch (error) {
                console.error(`Error reading file ${filePath}:`, error);
              }
            })
        );
      })
    );

    // Sort memos by filename (which contains the timestamp)
    memos.sort((a, b) => b.filename.localeCompare(a.filename));

    // Group memos by their original filename (without extension)
    const groupedMemos = memos.reduce((acc, memo) => {
      const baseFilename = memo.filename.replace(/\.[^/.]+$/, '');
      if (!acc[baseFilename]) {
        acc[baseFilename] = {
          createdAt: memo.createdAt // Preserve the createdAt timestamp
        };
      }
      Object.entries(memo).forEach(([key, value]) => {
        if (key !== 'filename') {
          acc[baseFilename][key] = value;
        }
      });
      return acc;
    }, {} as Record<string, Record<string, string>>);

    // Convert back to array and sort
    const result = Object.entries(groupedMemos).map(([filename, content]) => ({
      filename,
      ...content,
    }));

    result.sort((a, b) => b.filename.localeCompare(a.filename));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing memos:', error);
    return NextResponse.json({ error: 'Failed to process memos' }, { status: 500 });
  }
} 