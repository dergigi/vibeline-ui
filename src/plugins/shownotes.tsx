'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, FileText, Play } from 'lucide-react';

interface ShowNote {
  id: string;
  title: string;
  filename: string;
  createdAt: string;
  content: string;
}

interface ShownotesPluginProps {
  files: {
    name: string;
    path: string;
    content?: string;
  }[];
}

const ITEMS_PER_PAGE = 10;

const ShownotesPlugin: React.FC<ShownotesPluginProps> = ({ files }) => {
  const [showNotes, setShowNotes] = useState<ShowNote[]>([]);
  const [displayedNotes, setDisplayedNotes] = useState<ShowNote[]>([]);

  useEffect(() => {
    // Parse show notes from markdown files and fetch titles
    const parseShowNotes = async () => {
      const allShowNotes: ShowNote[] = [];
      
      for (const file of files) {
        // Skip hidden files
        if (file.name.startsWith('.')) {
          continue;
        }
        
        const content = file.content || '';
        if (!content.trim()) continue;

        // Get base filename without extension for title lookup
        const baseFilename = file.name.replace(/\.md$/, '');
        
        // Try to fetch title from titles API
        let title = '';
        try {
          const titleResponse = await fetch(`/api/memos/${baseFilename}`);
          if (titleResponse.ok) {
            const memoData = await titleResponse.json();
            title = memoData.title || '';
          }
        } catch (error) {
          console.log('Could not fetch title for', baseFilename);
        }

        // Fallback to extracting title from markdown content
        if (!title) {
          const titleMatch = content.match(/^#\s+(.+)$/m);
          if (titleMatch) {
            title = titleMatch[1];
          } else {
            title = baseFilename.replace(/_/g, ' ');
          }
        }

        const showNote: ShowNote = {
          id: file.name,
          title,
          filename: file.name,
          createdAt: file.name.split('_')[0], // Format: YYYYMMDD
          content
        };
        
        allShowNotes.push(showNote);
      }

      // Sort by creation date (newest first)
      allShowNotes.sort((a, b) => b.filename.localeCompare(a.filename));
      
      setShowNotes(allShowNotes);
      setDisplayedNotes(allShowNotes.slice(0, ITEMS_PER_PAGE));
    };

    parseShowNotes();
  }, [files]);

  const handleLoadMore = () => {
    const currentLength = displayedNotes.length;
    const nextNotes = showNotes.slice(currentLength, currentLength + ITEMS_PER_PAGE);
    setDisplayedNotes([...displayedNotes, ...nextNotes]);
  };

  const handleLoadAll = () => {
    setDisplayedNotes(showNotes);
  };

  const hasMore = displayedNotes.length < showNotes.length;

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

  const formatTime = (filename: string) => {
    const timeMatch = filename.match(/_(\d{6})\./);
    if (timeMatch) {
      const time = timeMatch[1];
      return `${time.slice(0, 2)}:${time.slice(2, 4)}`;
    }
    return '';
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
          <FileText className="h-8 w-8 mr-3 text-blue-500" />
          Show Notes
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse your show notes
        </p>
      </div>

      <div className="space-y-6">
        {displayedNotes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No show notes found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Add markdown files to the shownotes folder
            </p>
          </div>
        ) : (
          displayedNotes.map((showNote) => (
            <div
              key={showNote.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {showNote.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(showNote.createdAt)}
                      </div>
                      {formatTime(showNote.filename) && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatTime(showNote.filename)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <Link
                      href={`/memos/${showNote.filename.replace('.md', '')}`}
                      className="p-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                      title="View full memo"
                    >
                      <Play className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
                    {showNote.content}
                  </pre>
                </div>
              </div>
            </div>
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

export default ShownotesPlugin;