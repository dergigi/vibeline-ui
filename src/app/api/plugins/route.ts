import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const VOICE_MEMOS_DIR = path.join(process.cwd(), 'VoiceMemos');

export async function GET(): Promise<NextResponse> {
  try {
    const entries = await fs.readdir(VOICE_MEMOS_DIR, { withFileTypes: true });
    const plugins = entries
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
      .map(entry => ({
        id: entry.name,
        name: entry.name.charAt(0).toUpperCase() + entry.name.slice(1).replace(/_/g, ' '),
        path: `/plugins/${entry.name}`
      }));

    return NextResponse.json(plugins);
  } catch (error) {
    console.error('Error reading plugins:', error);
    return NextResponse.json([], { status: 500 });
  }
} 