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
    const { markdownPath, lineNumber, isChecked } = await request.json(); // Expect markdownPath

    // --- Input Validation ---
    if (!markdownPath || typeof markdownPath !== 'string') {
      return new NextResponse(JSON.stringify({ error: 'markdownPath is required and must be a string' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (typeof lineNumber !== 'number' || !Number.isInteger(lineNumber) || lineNumber < 0) {
      return new NextResponse(JSON.stringify({ error: 'Line number must be a non-negative integer' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (typeof isChecked !== 'boolean') {
      return new NextResponse(JSON.stringify({ error: 'isChecked must be a boolean' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // --- File Path and Security ---
    // Use markdownPath directly as it should be the full path from the source
    const normalizedPath = path.normalize(markdownPath);

    // Security check: Ensure the path is still within an expected base directory
    // Adjust VOICE_MEMOS_DIR if markdown files are stored elsewhere, or use a more general project root check.
    // Assuming markdown files are also expected within the project structure:
    const projectRoot = process.cwd();
    if (!normalizedPath.startsWith(projectRoot)) { // Check against project root or a specific markdown directory
      console.error(`Forbidden access attempt: ${normalizedPath} is outside project root ${projectRoot}`);
      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // --- File Operations ---
    let fileContent: string;
    // Check if the file exists before reading
    if (!existsSync(normalizedPath)) {
       return new NextResponse(JSON.stringify({ error: `File not found: ${markdownPath}` }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    try {
      fileContent = await fs.readFile(normalizedPath, 'utf-8');
    } catch (readError: any) {
      // ENOENT check is less likely now due to existsSync, but keep for robustness
      // if (readError.code === 'ENOENT') { // This case is handled by existsSync above
      //   return new NextResponse(JSON.stringify({ error: `File not found: ${markdownPath}` }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      // }
      console.error(`Error reading file ${normalizedPath}:`, readError);
      return new NextResponse(JSON.stringify({ error: 'Failed to read file' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const lines = fileContent.split('\n');

    if (lineNumber >= lines.length) {
      return new NextResponse(JSON.stringify({ error: `Line number ${lineNumber} is out of bounds for file ${markdownPath}` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // --- Modify the Line ---
    const lineToModify = lines[lineNumber];
    // Regex to find markdown checkbox, capturing indentation and text
    const match = lineToModify.match(/^(\s*-\s*\[\s*)([ x])(\s*\]\s*)(.*)/);

    if (!match) {
      // Line is not a checkbox, maybe return an error or log?
      console.warn(`Line ${lineNumber} in ${markdownPath} is not a valid markdown checkbox: "${lineToModify}"`);
      // For now, we'll proceed without modifying non-checkbox lines, but return success
      // Alternatively, return an error:
      // return new NextResponse(JSON.stringify({ error: `Line ${lineNumber} is not a checkbox` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    } else {
      const prefix = match[1]; // e.g., "  - [ "
      const suffix = match[3]; // e.g., "] "
      const text = match[4];   // e.g., "Buy milk"
      const newCheckboxState = isChecked ? 'x' : ' ';
      lines[lineNumber] = `${prefix}${newCheckboxState}${suffix}${text}`;
    }

    // --- Write Updated Content ---
    const updatedContent = lines.join('\n');
    try {
      await fs.writeFile(normalizedPath, updatedContent, 'utf-8');
    } catch (writeError) {
      console.error(`Error writing file ${normalizedPath}:`, writeError);
      return new NextResponse(JSON.stringify({ error: 'Failed to write file' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // --- Success Response ---
    return new NextResponse(JSON.stringify({ message: 'Todo updated successfully' }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Error in /api/todos/toggle:', error);
    // Generic error for unexpected issues
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}