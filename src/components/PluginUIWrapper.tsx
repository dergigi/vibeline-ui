'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

interface PluginFile {
  name: string;
  path: string;
  content?: string;
}

interface PluginUIWrapperProps {
  pluginId: string;
  files: PluginFile[];
}

export default function PluginUIWrapper({ pluginId, files }: PluginUIWrapperProps) {
  const [error, setError] = useState<string | null>(null);

  // Create a dynamic import for the plugin UI
  const CustomUI = dynamic(
    () => import(`../../VoiceMemos/${pluginId}/page`).catch(err => {
      console.error(`Error loading plugin UI for ${pluginId}:`, err);
      setError(`Failed to load plugin UI: ${err.message}`);
      return () => <div>Error loading plugin UI</div>;
    }),
    {
      loading: () => <div>Loading custom plugin UI...</div>,
      ssr: false
    }
  );

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return <CustomUI files={files} />;
} 