'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface TitleEntry {
  id: string;
  title: string;
  filename: string;
  createdAt: string;
}

interface TitlesPluginProps {
  files: {
    name: string;
    path: string;
    content?: string;
  }[];
}

const ITEMS_PER_PAGE = 15;

const TitlesPlugin: React.FC<TitlesPluginProps> = ({ files }) => {
  const [titles, setTitles] = useState<TitleEntry[]>([]);
  const [displayedTitles, setDisplayedTitles] = useState<TitleEntry[]>([]);

  useEffect(() => {
    // Parse titles from files
    const allTitles: TitleEntry[] = [];
    
    files.forEach(file => {
      const content = file.content || '';
      const title = content.trim();
      
      if (title) {
        const titleEntry: TitleEntry = {
          id: file.name,
          title: title,
          filename: file.name,
          createdAt: file.name.split('_')[0] // Format: YYYYMMDD
        };
        
        allTitles.push(titleEntry);
      }
    });

    // Sort by creation date (newest first)
    allTitles.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    
    setTitles(allTitles);
    setDisplayedTitles(allTitles.slice(0, ITEMS_PER_PAGE));
  }, [files]);

  const handleLoadMore = () => {
    const currentLength = displayedTitles.length;
    const nextTitles = titles.slice(currentLength, currentLength + ITEMS_PER_PAGE);
    setDisplayedTitles([...displayedTitles, ...nextTitles]);
  };

  const hasMore = displayedTitles.length < titles.length;

  const formatDate = (dateStr: string) => {
    if (dateStr.length === 8) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return new Date(`${year}-${month}-${day}`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
    return dateStr;
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Titles
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse your voice memo titles
        </p>
      </div>

      <div className="space-y-3">
        {displayedTitles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No titles found</p>
          </div>
        ) : (
          displayedTitles.map((titleEntry) => (
            <Link
              key={titleEntry.id}
              href={`/memos/${titleEntry.filename}`}
              className="block p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                    {titleEntry.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formatDate(titleEntry.createdAt)}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-gray-400 dark:text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
      
      {hasMore && (
        <div className="flex justify-center pt-6">
          <button
            onClick={handleLoadMore}
            className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
};

export default TitlesPlugin;
