'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/solid';

interface Plugin {
  id: string;
  name: string;
  path: string;
}

interface ArchiveFolder {
  name: string;
  memoCount: number;
}

interface CollapsibleLinksProps {
  plugins: Plugin[];
  archiveFolders: ArchiveFolder[];
}

export default function CollapsibleLinks({ plugins, archiveFolders }: CollapsibleLinksProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentMonth = new Date().toISOString().slice(0, 7);

  return (
    <div className="mb-8 flex flex-wrap gap-1.5 items-center">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        title={isExpanded ? 'Collapse' : 'Expand'}
      >
        <ChevronRightIcon className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>
      
      {isExpanded && (
        <>
          {plugins.map((plugin) => (
            <Link
              key={plugin.id}
              href={plugin.path}
              className="px-2 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
            >
              /{plugin.id}
            </Link>
          ))}
          
          <span className="px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded">
            {currentMonth}
          </span>
          
          {archiveFolders.slice(0, 5).map((folder) => (
            <Link
              key={folder.name}
              href={`/archive/${folder.name}`}
              className="px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              {folder.name}
            </Link>
          ))}
          
          {archiveFolders.length > 0 && (
            <Link
              href="/archive"
              className="px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              ...
            </Link>
          )}
        </>
      )}
    </div>
  );
}

