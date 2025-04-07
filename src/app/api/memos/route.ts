import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { VoiceMemo } from '@/types/VoiceMemo';

const VOICE_MEMOS_DIR = path.join(process.cwd(), 'VoiceMemos');
const TRANSCRIPTS_DIR = path.join(VOICE_MEMOS_DIR, 'transcripts');
const SUMMARIES_DIR = path.join(VOICE_MEMOS_DIR, 'summaries');
const TODOS_DIR = path.join(VOICE_MEMOS_DIR, 'TODOs');
const PROMPTS_DIR = path.join(VOICE_MEMOS_DIR, 'app_ideas');
const DRAFTS_DIR = path.join(VOICE_MEMOS_DIR, 'blog_posts');

function parseTimestampFromFilename(filename: string): Date {
  // Extract YYYYMMDD_HHMMSS from the filename
  const match = filename.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  if (!match) {
    return new Date(); // Fallback to current time if pattern doesn't match
  }
  
  const [, year, month, day, hour, minute, second] = match;
  return new Date(
    parseInt(year),
    parseInt(month) - 1, // JavaScript months are 0-based
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  );
}

async function readFileIfExists(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return '';
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const files = await fs.readdir(VOICE_MEMOS_DIR);
    const memos: VoiceMemo[] = [];

    for (const file of files) {
      if (file.endsWith('.m4a')) {
        const baseFilename = path.basename(file, '.m4a');
        const transcriptPath = path.join(TRANSCRIPTS_DIR, `${baseFilename}.txt`);
        const summaryPath = path.join(SUMMARIES_DIR, `${baseFilename}.txt`);
        const todosPath = path.join(TODOS_DIR, `${baseFilename}.md`);
        const promptsPath = path.join(PROMPTS_DIR, `${baseFilename}.txt`);
        const draftsPath = path.join(DRAFTS_DIR, `${baseFilename}.md`);
        
        // Read all files if they exist
        const [transcript, summary, todos, prompts, drafts] = await Promise.all([
          readFileIfExists(transcriptPath),
          readFileIfExists(summaryPath),
          readFileIfExists(todosPath),
          readFileIfExists(promptsPath),
          readFileIfExists(draftsPath)
        ]);
        
        memos.push({
          id: baseFilename,
          filename: file, // Keep the audio filename here
          path: todosPath, // Assign the path to the TODOs markdown file
          transcript,
          summary,
          todos,
          prompts,
          drafts,
          audioUrl: `/api/audio/${encodeURIComponent(file)}`,
          createdAt: parseTimestampFromFilename(baseFilename)
        });
      }
    }

    const sortedMemos = memos.sort((a, b) => {
      // Ensure both are Date objects before comparing
      const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt) : a.createdAt;
      const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt;
      return dateB.getTime() - dateA.getTime();
    });
    return NextResponse.json(sortedMemos);
  } catch (err) {
    console.error('Error reading voice memos:', err instanceof Error ? err.message : 'Unknown error');
    return NextResponse.json([], { status: 500 });
  }
} 