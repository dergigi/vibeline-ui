'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowPathIcon, TrashIcon } from '@heroicons/react/24/solid';

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
  const [countdown, setCountdown] = useState<{ [key: string]: number }>({});
  const [isDeleting, setIsDeleting] = useState<{ [key: string]: boolean }>({});
  const deleteIntervals = useRef<{ [key: string]: NodeJS.Timeout | null }>({});

  useEffect(() => {
    // Parse titles from files
    const allTitles: TitleEntry[] = [];
    
    files.forEach(file => {
      // Skip hidden files (files that start with a dot)
      if (file.name.startsWith('.')) {
        return;
      }
      
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

    // Sort by full timestamp (newest first) - use filename for proper chronological ordering
    allTitles.sort((a, b) => b.filename.localeCompare(a.filename));
    
    setTitles(allTitles);
    setDisplayedTitles(allTitles.slice(0, ITEMS_PER_PAGE));
  }, [files]);

  const handleLoadMore = () => {
    const currentLength = displayedTitles.length;
    const nextTitles = titles.slice(currentLength, currentLength + ITEMS_PER_PAGE);
    setDisplayedTitles([...displayedTitles, ...nextTitles]);
  };

  const handleLoadAll = () => {
    setDisplayedTitles(titles);
  };

  const handleDeleteTitle = async (filename: string): Promise<void> => {
    try {
      const response = await fetch('/api/plugins/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          filename: filename,
          plugin: 'titles'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete title file');
      }

      // Remove the title from the local state
      setTitles(prev => prev.filter(title => title.filename !== filename));
      setDisplayedTitles(prev => prev.filter(title => title.filename !== filename));
      
      console.log('Title file deleted successfully');
    } catch (error) {
      console.error('Error deleting title file:', error);
    } finally {
      // Reset countdown and deleting states
      setCountdown(prev => ({ ...prev, [filename]: 0 }));
      setIsDeleting(prev => ({ ...prev, [filename]: false }));
    }
  };

  const startDeleteCountdown = (filename: string): void => {
    // Clear any existing interval for this file
    if (deleteIntervals.current[filename]) {
      clearInterval(deleteIntervals.current[filename]);
    }

    setCountdown(prev => ({ ...prev, [filename]: 5 }));
    setIsDeleting(prev => ({ ...prev, [filename]: true }));
    
    const interval = setInterval(() => {
      setCountdown(prev => {
        const newCount = prev[filename] - 1;
        if (newCount <= 0) {
          clearInterval(interval);
          handleDeleteTitle(filename);
          return { ...prev, [filename]: 0 };
        }
        return { ...prev, [filename]: newCount };
      });
    }, 1000);

    // Store the interval ID
    deleteIntervals.current[filename] = interval;
  };

  const cancelDelete = (filename: string): void => {
    // Clear the interval
    if (deleteIntervals.current[filename]) {
      clearInterval(deleteIntervals.current[filename]);
      deleteIntervals.current[filename] = null;
    }
    
    setCountdown(prev => ({ ...prev, [filename]: 0 }));
    setIsDeleting(prev => ({ ...prev, [filename]: false }));
  };

  // Clean up intervals when component unmounts
  React.useEffect(() => {
    const intervals = deleteIntervals.current;
    return () => {
      Object.values(intervals).forEach(interval => {
        if (interval) {
          clearInterval(interval);
        }
      });
    };
  }, []);

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
              href={`/memos/${titleEntry.filename.replace('.txt', '')}`}
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
                <div className="ml-4 flex-shrink-0 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isDeleting[titleEntry.filename]) {
                        cancelDelete(titleEntry.filename);
                      } else {
                        startDeleteCountdown(titleEntry.filename);
                      }
                    }}
                    className={`p-1 transition-colors flex items-center gap-1 ${
                      isDeleting[titleEntry.filename] 
                        ? 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300' 
                        : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                    }`}
                    title="Refresh title (delete and regenerate)"
                  >
                    {isDeleting[titleEntry.filename] ? (
                      <>
                        <TrashIcon className="w-3 h-3" />
                        <span className="text-xs">{countdown[titleEntry.filename]}s</span>
                      </>
                    ) : (
                      <ArrowPathIcon className="w-3 h-3" />
                    )}
                  </button>
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
        <div className="flex justify-center gap-3 pt-6">
          <button
            onClick={handleLoadMore}
            className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
          >
            Load more
          </button>
          <button
            onClick={handleLoadAll}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-900/20 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900/30 transition-colors"
          >
            Load all
          </button>
        </div>
      )}
    </div>
  );
};

export default TitlesPlugin;
