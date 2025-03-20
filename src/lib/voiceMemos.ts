import fs from 'fs/promises';
import path from 'path';
import { VoiceMemo } from '@/types/VoiceMemo';
import os from 'os';

const VOICE_MEMOS_DIR = path.join(os.homedir(), 'Vibe', 'VoiceMemos');
const TRANSCRIPTS_DIR = path.join(VOICE_MEMOS_DIR, 'transcripts');
const SUMMARIES_DIR = path.join(VOICE_MEMOS_DIR, 'summaries');

async function readFileIfExists(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return '';
  }
}

export async function getVoiceMemos(): Promise<VoiceMemo[]> {
  try {
    const files = await fs.readdir(VOICE_MEMOS_DIR);
    const memos: VoiceMemo[] = [];

    for (const file of files) {
      if (file.endsWith('.m4a')) {
        const baseFilename = path.basename(file, '.m4a');
        const transcriptPath = path.join(TRANSCRIPTS_DIR, `${baseFilename}.txt`);
        const summaryPath = path.join(SUMMARIES_DIR, `${baseFilename}.txt`);
        
        // Read transcript and summary if they exist
        const [transcript, summary] = await Promise.all([
          readFileIfExists(transcriptPath),
          readFileIfExists(summaryPath)
        ]);

        const stats = await fs.stat(path.join(VOICE_MEMOS_DIR, file));
        
        memos.push({
          id: baseFilename,
          filename: file,
          path: path.join(VOICE_MEMOS_DIR, file),
          transcript,
          summary,
          audioUrl: `/api/audio/${encodeURIComponent(file)}`,
          createdAt: stats.mtime
        });
      }
    }

    return memos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (err) {
    console.error('Error reading voice memos:', err instanceof Error ? err.message : 'Unknown error');
    return [];
  }
} 