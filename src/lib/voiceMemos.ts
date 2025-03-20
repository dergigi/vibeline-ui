import fs from 'fs/promises';
import path from 'path';
import { VoiceMemo } from '@/types/VoiceMemo';
import os from 'os';

const VOICE_MEMOS_DIR = path.join(os.homedir(), 'Vibe', 'VoiceMemos');

export async function getVoiceMemos(): Promise<VoiceMemo[]> {
  try {
    const files = await fs.readdir(VOICE_MEMOS_DIR);
    const memos: VoiceMemo[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(VOICE_MEMOS_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);
        
        const audioFile = file.replace('.json', '.m4a');
        const audioPath = path.join(VOICE_MEMOS_DIR, audioFile);
        
        // Check if audio file exists
        try {
          await fs.access(audioPath);
          memos.push({
            id: path.basename(file, '.json'),
            filename: file,
            path: filePath,
            transcript: data.transcript || '',
            summary: data.summary || '',
            audioUrl: `/api/audio/${encodeURIComponent(audioFile)}`,
            createdAt: new Date(data.createdAt || Date.now())
          });
        } catch {
          console.warn(`Audio file not found for ${file}`);
        }
      }
    }

    return memos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (err) {
    console.error('Error reading voice memos:', err instanceof Error ? err.message : 'Unknown error');
    return [];
  }
} 