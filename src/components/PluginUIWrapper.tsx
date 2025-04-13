'use client';

import { useState } from 'react';
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

  return <CustomUI files={files} />;
}

PluginUIWrapper.displayName = 'PluginUIWrapper';
export default PluginUIWrapper; 