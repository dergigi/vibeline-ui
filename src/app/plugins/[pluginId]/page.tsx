import { Suspense } from 'react';
import fs from 'fs/promises';
import path from 'path';
import { notFound } from 'next/navigation';

const VOICE_MEMOS_DIR = path.join(process.cwd(), 'VoiceMemos');

async function getPluginContent(pluginId: string) {
  const pluginDir = path.join(VOICE_MEMOS_DIR, pluginId);
  
  try {
    const entries = await fs.readdir(pluginDir, { withFileTypes: true });
    const files = entries
      .filter(entry => entry.isFile())
      .map(entry => ({
        name: entry.name,
        path: path.join(pluginId, entry.name)
      }));
    
    return files;
  } catch (error) {
    console.error(`Error reading plugin ${pluginId}:`, error);
    return null;
  }
}

export default async function PluginPage({ params }: { params: { pluginId: string } }) {
  const pluginContent = await getPluginContent(params.pluginId);
  
  if (!pluginContent) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white capitalize">
            {params.pluginId.replace(/_/g, ' ')}
          </h1>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <div className="grid gap-6">
            {pluginContent.map((file) => (
              <div
                key={file.path}
                className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {file.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Path: {file.path}
                </p>
              </div>
            ))}
          </div>
        </Suspense>
      </div>
    </main>
  );
} 