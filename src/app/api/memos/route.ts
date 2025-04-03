import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { VoiceMemo } from '@/types/VoiceMemo';

const VOICE_MEMOS_DIR = path.join(process.cwd(), 'VoiceMemos');
const TRANSCRIPTS_DIR = path.join(VOICE_MEMOS_DIR, 'transcripts');
const SUMMARIES_DIR = path.join(VOICE_MEMOS_DIR, 'summaries');
const TODOS_DIR = path.join(VOICE_MEMOS_DIR, 'TODOs');
const ACTION_ITEMS_DIR = path.join(VOICE_MEMOS_DIR, 'action_items');
const APP_IDEAS_DIR = path.join(VOICE_MEMOS_DIR, 'app_ideas');
const BLOG_POSTS_DIR = path.join(VOICE_MEMOS_DIR, 'blog_posts');

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
        const summaryPath = path.join(SUMMARIES_DIR, `${baseFilename}_summary.txt`);
        const todosPath = path.join(TODOS_DIR, `${baseFilename}.txt`);
        const actionItemsPath = path.join(ACTION_ITEMS_DIR, `${baseFilename}.txt`);
        const appIdeasPath = path.join(APP_IDEAS_DIR, `${baseFilename}.txt`);
        const blogPostPath = path.join(BLOG_POSTS_DIR, `${baseFilename}.txt`);
        
        // Read all files if they exist
        const [transcript, summary, todos, actionItems, appIdeas, blogPost] = await Promise.all([
          readFileIfExists(transcriptPath),
          readFileIfExists(summaryPath),
          readFileIfExists(todosPath),
          readFileIfExists(actionItemsPath),
          readFileIfExists(appIdeasPath),
          readFileIfExists(blogPostPath)
        ]);

        const stats = await fs.stat(path.join(VOICE_MEMOS_DIR, file));
        
        memos.push({
          id: baseFilename,
          filename: file,
          path: path.join(VOICE_MEMOS_DIR, file),
          transcript,
          summary,
          todos,
          actionItems,
          appIdeas,
          blogPost,
          audioUrl: `/api/audio/${encodeURIComponent(file)}`,
          createdAt: stats.mtime
        });
      }
    }

    const sortedMemos = memos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return NextResponse.json(sortedMemos);
  } catch (err) {
    console.error('Error reading voice memos:', err instanceof Error ? err.message : 'Unknown error');
    return NextResponse.json([], { status: 500 });
  }
} 