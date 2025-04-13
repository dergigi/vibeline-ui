import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises'; // Use promises API for async operations
import { existsSync } from 'fs'; // Use existsSync for initial check

const VOICE_MEMOS_DIR = path.join(process.cwd(), 'VoiceMemos');

// Ensure the VoiceMemos directory exists
if (!existsSync(VOICE_MEMOS_DIR)) {
  console.warn(`VoiceMemos directory not found at ${VOICE_MEMOS_DIR}. Creating it.`);
  fs.mkdir(VOICE_MEMOS_DIR, { recursive: true });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { filePath, lineNumber, completed } = await request.json();
    
    // Read the file
    const fullPath = path.join(process.cwd(), 'VoiceMemos', filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    const lines = content.split('\n');

    // Update the specific line
    if (lineNumber >= 0 && lineNumber < lines.length) {
      const line = lines[lineNumber];
      const match = line.match(/^(\s*-\s*\[)[ x](\]\s*.*)/);
      if (match) {
        lines[lineNumber] = `${match[1]}${completed ? 'x' : ' '}${match[2]}`;
        await fs.writeFile(fullPath, lines.join('\n'));
        return NextResponse.json({ success: true });
      }
    }

    throw new Error('Invalid line number or line format');
  } catch (error) {
    console.error('Error toggling todo:', error);
    return NextResponse.json(
      { error: 'Failed to toggle todo' },
      { status: 500 }
    );
  }
}