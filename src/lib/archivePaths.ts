import path from 'path';

/**
 * Get the base path for a memo's files, accounting for archive structure.
 * @param voiceMemosDir - The root VoiceMemos directory path
 * @param archivePath - Optional archive folder name (e.g., "2025-12")
 * @returns The base path where memo files are located
 */
export function getBasePath(voiceMemosDir: string, archivePath?: string): string {
  return archivePath 
    ? path.join(voiceMemosDir, 'archive', archivePath)
    : voiceMemosDir;
}

/**
 * Build the audio URL for a memo, including archive query param if needed.
 * @param baseFilename - The memo's base filename (without extension)
 * @param archivePath - Optional archive folder name
 * @returns The audio URL path
 */
export function buildAudioUrl(baseFilename: string, archivePath?: string): string {
  const base = `/api/audio/${baseFilename}.m4a`;
  return archivePath ? `${base}?archive=${archivePath}` : base;
}

