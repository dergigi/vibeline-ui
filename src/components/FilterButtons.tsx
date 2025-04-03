'use client';

import { PencilIcon, SparklesIcon, CheckIcon } from '@heroicons/react/24/solid';
import { useSearch } from '@/contexts/SearchContext';

export function FilterButtons() {
  const { activeFilters, toggleFilter } = useSearch();

  return (
    <div className="flex gap-2">
      <button
        onClick={() => toggleFilter('todos')}
        className={`p-1.5 rounded-md transition-colors ${
          activeFilters.has('todos')
            ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
        title="Show TODOs"
      >
        <CheckIcon className="w-3 h-3" />
      </button>
      <button
        onClick={() => toggleFilter('prompts')}
        className={`p-1.5 rounded-md transition-colors ${
          activeFilters.has('prompts')
            ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
        title="Show prompts"
      >
        <SparklesIcon className="w-3 h-3" />
      </button>
      <button
        onClick={() => toggleFilter('drafts')}
        className={`p-1.5 rounded-md transition-colors ${
          activeFilters.has('drafts')
            ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
        title="Show blog drafts"
      >
        <PencilIcon className="w-3 h-3" />
      </button>
    </div>
  );
} 