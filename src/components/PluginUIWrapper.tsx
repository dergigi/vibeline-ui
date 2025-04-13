'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

interface PluginFile {
  name: string;
  path: string;
  content?: string;
  transcript?: string;
}

interface PluginUIProps {
  files: PluginFile[];
}

interface PluginUIWrapperProps {
  pluginId: string;
  files: PluginFile[];
}

// Error component with display name
const ErrorDisplay = ({ message }: { message: string }) => (
  <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
    <h2 className="text-xl font-semibold mb-2">Error</h2>
    <p>{message}</p>
  </div>
);
ErrorDisplay.displayName = 'ErrorDisplay';

// Loading component with display name
const LoadingDisplay = () => <div>Loading custom plugin UI...</div>;
LoadingDisplay.displayName = 'LoadingDisplay';

function PluginUIWrapper({ pluginId, files }: PluginUIWrapperProps) {
  const [error, setError] = useState<string | null>(null);
  const [enhancedFiles, setEnhancedFiles] = useState<PluginFile[]>(files);

  useEffect(() => {
    async function loadTranscripts() {
      const filesWithTranscripts = await Promise.all(
        files.map(async (file) => {
          try {
            // Try to read matching transcript file
            const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
            const response = await fetch(`/api/memos/transcript/${fileName}`);
            if (!response.ok) throw new Error('Transcript not found');
            const transcript = await response.text();
            console.log('Transcript loaded:', transcript);
            return { ...file, transcript };
          } catch (error) {
            // If transcript doesn't exist, return original file
            console.error('Failed to load transcript:', {
              path: file.path,
              error: error
            });
            return file;
          }
        })
      );
      console.log('Files with transcripts:', filesWithTranscripts);
      setEnhancedFiles(filesWithTranscripts);
    }

    loadTranscripts();
  }, [files]);

  // Create a dynamic import for the plugin UI
  const CustomUI = dynamic<PluginUIProps>(
    () => import(`../../VoiceMemos/${pluginId}/page`).catch(err => {
      console.error(`Error loading plugin UI for ${pluginId}:`, err);
      setError(`Failed to load plugin UI: ${err.message}`);
      const ErrorComponent = () => <ErrorDisplay message="Error loading plugin UI" />;
      ErrorComponent.displayName = 'ErrorComponent';
      return ErrorComponent;
    }),
    {
      loading: LoadingDisplay,
      ssr: false
    }
  );

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  return <CustomUI files={enhancedFiles} />;
}

PluginUIWrapper.displayName = 'PluginUIWrapper';
export default PluginUIWrapper; 