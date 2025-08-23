import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { BlossomData } from '@/types/VoiceMemo';

interface Memo {
  filename: string;
  transcript?: string;
  isCleanedTranscript?: boolean;
  summary?: string;
  todos?: string;
  title?: string;
  createdAt: string;
  path: string;
  audioUrl: string;
  blossom?: {
    url: string;
    sha256: string;
    size: number;
    type: string;
    uploaded: number;
  };
}

async function readFileIfExists(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return '';
  }
}

async function readBlossomDataIfExists(filePath: string): Promise<BlossomData | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    if (content.trim()) {
      const data = JSON.parse(content);
      // Only return blossom data if it has a valid URL
      if (data && data.url && data.url.trim()) {
        return data;
      }
    }
    return null;
  } catch {
    return null;
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
    const TITLES_DIR = path.join(VOICE_MEMOS_DIR, 'titles');
    const BLOSSOMS_DIR = path.join(VOICE_MEMOS_DIR, 'blossoms');

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
        // Check for cleaned transcript (main .txt file) and original (.txt.orig file)
        const [transcript, originalTranscript, summary, todos, title, blossomData] = await Promise.all([
          readFileIfExists(path.join(TRANSCRIPTS_DIR, `${baseFilename}.txt`)),
          readFileIfExists(path.join(TRANSCRIPTS_DIR, `${baseFilename}.txt.orig`)),
          readFileIfExists(path.join(SUMMARIES_DIR, `${baseFilename}.txt`)),
          readFileIfExists(path.join(TODOS_DIR, `${baseFilename}.md`)),
          readFileIfExists(path.join(TITLES_DIR, `${baseFilename}.txt`)),
          readBlossomDataIfExists(path.join(BLOSSOMS_DIR, `${baseFilename}.json`))
        ]);

        // If .txt.orig exists, it means the main .txt file is cleaned
        const isCleanedTranscript = !!originalTranscript;

        const memo: Memo = {
          filename: baseFilename,
          transcript,
          isCleanedTranscript,
          summary,
          todos,
          title: title.trim() || undefined,
          path: path.join(TODOS_DIR, `${baseFilename}.md`), // Keep the TODOs path for editing
          createdAt: parseTimestampFromFilename(baseFilename),
          audioUrl: `/api/audio/${baseFilename}.m4a`,
          blossom: blossomData || undefined
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