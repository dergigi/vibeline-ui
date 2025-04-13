import { Suspense } from 'react';
import fs from 'fs/promises';
import path from 'path';
import { notFound } from 'next/navigation';
import { existsSync } from 'fs';

const VOICE_MEMOS_DIR = path.join(process.cwd(), 'VoiceMemos');

interface PluginFile {
  name: string;
  path: string;
  content?: string;
}

async function getPluginContent(pluginId: string): Promise<{ files: PluginFile[]; customUI?: string }> {
  const pluginDir = path.join(VOICE_MEMOS_DIR, pluginId);
  const customUIPath = path.join(pluginDir, 'page.tsx');
  
  try {
    const entries = await fs.readdir(pluginDir, { withFileTypes: true });
    const filePromises = entries
      .filter(entry => entry.isFile() && entry.name !== 'page.tsx') // Exclude the UI file from the list
      .map(async entry => {
        const filePath = path.join(pluginDir, entry.name);
        let content: string | undefined;
        try {
          content = await fs.readFile(filePath, 'utf-8');
        } catch (error) {
          console.error(`Error reading file ${filePath}:`, error);
        }
        return {
          name: entry.name,
          path: path.join(pluginId, entry.name),
          content
        };
      });

    const files = await Promise.all(filePromises);

    // Check if custom UI exists
    let customUI: string | undefined;
    if (existsSync(customUIPath)) {
      customUI = await fs.readFile(customUIPath, 'utf-8');
    }
    
    return { files, customUI };
  } catch (error) {
    console.error(`Error reading plugin ${pluginId}:`, error);
    return { files: [] };
  }
}

function DefaultPluginUI({ files, pluginId }: { files: PluginFile[]; pluginId: string }) {
  return (
    <div className="grid gap-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white capitalize">
          {pluginId.replace(/_/g, ' ')}
        </h1>
      </div>
      {files.map((file) => (
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
          {file.content && (
            <pre className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded overflow-auto">
              {file.content}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}

export default async function PluginPage({ params }: { params: Promise<{ pluginId: string }> }) {
  const { pluginId } = await params;
  const { files, customUI } = await getPluginContent(pluginId);
  
  if (!files.length && !customUI) {
    notFound();
  }

  // If there's a custom UI component, dynamically import and use it
  if (customUI) {
    // Create a temporary file in the app directory to import the custom UI
    const tempUIPath = path.join(process.cwd(), 'src/app/plugins/[pluginId]/_temp_ui.tsx');
    await fs.writeFile(tempUIPath, customUI);
    
    try {
      // Dynamic import of the custom UI component
      const CustomUI = (await import('./_temp_ui')).default;
      return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <Suspense fallback={<div>Loading custom plugin UI...</div>}>
              <CustomUI files={files} />
            </Suspense>
          </div>
        </main>
      );
    } catch (error) {
      console.error('Error loading custom UI:', error);
      // Fall back to default UI if custom UI fails to load
    } finally {
      // Clean up temporary file
      await fs.unlink(tempUIPath).catch(console.error);
    }
  }

  // Default UI
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <DefaultPluginUI files={files} pluginId={pluginId} />
        </Suspense>
      </div>
    </main>
  );
} 