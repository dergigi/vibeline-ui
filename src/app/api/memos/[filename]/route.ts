import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

async function readFileIfExists(filePath: string): Promise<string | undefined> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return undefined;
  }
}

function parseTimestampFromFilename(filename: string): string {
  const year = filename.slice(0, 4);
  const month = filename.slice(4, 6);
  const day = filename.slice(6, 8);
  const hour = filename.slice(9, 11);
  const minute = filename.slice(11, 13);
  const second = filename.slice(13, 15);
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // Resolve the symlink to get the actual path
    const VOICE_MEMOS_DIR = await fs.realpath(path.join(process.cwd(), 'VoiceMemos'));
    const TRANSCRIPTS_DIR = path.join(VOICE_MEMOS_DIR, 'transcripts');
    const SUMMARIES_DIR = path.join(VOICE_MEMOS_DIR, 'summaries');
    const TODOS_DIR = path.join(VOICE_MEMOS_DIR, 'TODOs');
    const TITLES_DIR = path.join(VOICE_MEMOS_DIR, 'titles');

    const { filename } = await params;
    const baseFilename = filename;
    
    // Get content from each plugin directory
    const [transcript, summary, todos, title] = await Promise.all([
      readFileIfExists(path.join(TRANSCRIPTS_DIR, `${baseFilename}.txt`)),
      readFileIfExists(path.join(SUMMARIES_DIR, `${baseFilename}.txt`)),
      readFileIfExists(path.join(TODOS_DIR, `${baseFilename}.md`)),
      readFileIfExists(path.join(TITLES_DIR, `${baseFilename}.txt`))
    ]);

    const memo = {
      filename: baseFilename,
      transcript,
      summary,
      todos,
      title: title?.trim() || undefined,
      path: path.join(TODOS_DIR, `${baseFilename}.md`),
      createdAt: parseTimestampFromFilename(baseFilename),
      audioUrl: `/api/audio/${baseFilename}.m4a`
    };

    return NextResponse.json(memo);
  } catch (error) {
    console.error('Error processing memo:', error);
    return NextResponse.json({ error: 'Failed to process memo' }, { status: 500 });
  }
} 