import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface Memo {
  filename: string;
  transcript?: string;
  summary?: string;
  todos?: string;
  createdAt: string;
  path: string;
  audioUrl: string;
}

async function readFileIfExists(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return '';
  }
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

export async function GET() {
  try {
    // Resolve the symlink to get the actual path
    const VOICE_MEMOS_DIR = await fs.realpath(path.join(process.cwd(), 'VoiceMemos'));
    const TRANSCRIPTS_DIR = path.join(VOICE_MEMOS_DIR, 'transcripts');
    const SUMMARIES_DIR = path.join(VOICE_MEMOS_DIR, 'summaries');
    const TODOS_DIR = path.join(VOICE_MEMOS_DIR, 'TODOs');

    // Ensure default directories exist
    await Promise.all([
      fs.mkdir(TRANSCRIPTS_DIR, { recursive: true }),
      fs.mkdir(SUMMARIES_DIR, { recursive: true }),
      fs.mkdir(TODOS_DIR, { recursive: true })
    ]);

    // Get all audio files as the source of truth
    const audioFiles = (await fs.readdir(VOICE_MEMOS_DIR))
      .filter(file => file.endsWith('.m4a'));

    // Process each audio file and gather related content
    const memos = await Promise.all(
      audioFiles.map(async (audioFile) => {
        const baseFilename = path.basename(audioFile, '.m4a');
        
        // Get content from each plugin directory
        const [transcript, summary, todos] = await Promise.all([
          readFileIfExists(path.join(TRANSCRIPTS_DIR, `${baseFilename}.txt`)),
          readFileIfExists(path.join(SUMMARIES_DIR, `${baseFilename}.txt`)),
          readFileIfExists(path.join(TODOS_DIR, `${baseFilename}.md`))
        ]);

        const memo: Memo = {
          filename: baseFilename,
          transcript,
          summary,
          todos,
          path: path.join(TODOS_DIR, `${baseFilename}.md`), // Keep the TODOs path for editing
          createdAt: parseTimestampFromFilename(baseFilename),
          audioUrl: `/api/audio/${baseFilename}.m4a`
        };

        return memo;
      })
    );

    // Sort by creation date (newest first)
    memos.sort((a, b) => b.filename.localeCompare(a.filename));

    return NextResponse.json(memos);
  } catch (error) {
    console.error('Error processing memos:', error);
    return NextResponse.json({ error: 'Failed to process memos' }, { status: 500 });
  }
} 