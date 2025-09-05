'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, ExternalLink, FileText, Play, ChevronDown, ChevronRight } from 'lucide-react';

interface ShowNote {
  id: string;
  title: string;
  filename: string;
  createdAt: string;
  content: string;
  sections: {
    type: 'heading' | 'list' | 'text' | 'resources' | 'timestamps';
    content: string;
    items?: string[];
  }[];
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
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Parse show notes from markdown files
    const allShowNotes: ShowNote[] = [];
    
    files.forEach(file => {
      // Skip hidden files
      if (file.name.startsWith('.')) {
        return;
      }
      
      const content = file.content || '';
      if (!content.trim()) return;

      const lines = content.split('\n');
      const sections: ShowNote['sections'] = [];
      let currentSection: ShowNote['sections'][0] | null = null;
      let title = '';

      // Extract title from first heading
      const titleMatch = content.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        title = titleMatch[1];
      } else {
        title = file.name.replace(/\.md$/, '').replace(/_/g, ' ');
      }

      lines.forEach(line => {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('## ')) {
          // Save previous section
          if (currentSection) {
            sections.push(currentSection);
          }
          
          const sectionTitle = trimmedLine.replace('## ', '').toLowerCase();
          let sectionType: ShowNote['sections'][0]['type'] = 'text';
          
          if (sectionTitle.includes('resource') || sectionTitle.includes('link')) {
            sectionType = 'resources';
          } else if (sectionTitle.includes('timestamp') || sectionTitle.includes('time')) {
            sectionType = 'timestamps';
          } else if (sectionTitle.includes('key point') || sectionTitle.includes('note')) {
            sectionType = 'list';
          }
          
          currentSection = {
            type: sectionType,
            content: trimmedLine.replace('## ', ''),
            items: []
          };
        } else if (trimmedLine.startsWith('- ') && currentSection) {
          // List item
          if (!currentSection.items) currentSection.items = [];
          currentSection.items.push(trimmedLine.replace('- ', ''));
        } else if (trimmedLine && currentSection && currentSection.type === 'text') {
          // Regular text content
          currentSection.content += (currentSection.content ? '\n' : '') + trimmedLine;
        }
      });

      // Add the last section
      if (currentSection) {
        sections.push(currentSection);
      }

      const showNote: ShowNote = {
        id: file.name,
        title,
        filename: file.name,
        createdAt: file.name.split('_')[0], // Format: YYYYMMDD
        content,
        sections
      };
      
      allShowNotes.push(showNote);
    });

    // Sort by creation date (newest first)
    allShowNotes.sort((a, b) => b.filename.localeCompare(a.filename));
    
    setShowNotes(allShowNotes);
    setDisplayedNotes(allShowNotes.slice(0, ITEMS_PER_PAGE));
  }, [files]);

  const handleLoadMore = () => {
    const currentLength = displayedNotes.length;
    const nextNotes = showNotes.slice(currentLength, currentLength + ITEMS_PER_PAGE);
    setDisplayedNotes([...displayedNotes, ...nextNotes]);
  };

  const handleLoadAll = () => {
    setDisplayedNotes(showNotes);
  };

  const toggleExpanded = (noteId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
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

  const renderSection = (section: ShowNote['sections'][0], index: number) => {
    switch (section.type) {
      case 'resources':
        return (
          <div key={index} className="mt-4">
            <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center">
              <ExternalLink className="h-4 w-4 mr-1" />
              {section.content}
            </h4>
            {section.items && (
              <ul className="space-y-1">
                {section.items.map((item, idx) => (
                  <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      
      case 'timestamps':
        return (
          <div key={index} className="mt-4">
            <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {section.content}
            </h4>
            {section.items && (
              <ul className="space-y-1">
                {section.items.map((item, idx) => (
                  <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      
      case 'list':
        return (
          <div key={index} className="mt-4">
            <h4 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2">
              {section.content}
            </h4>
            {section.items && (
              <ul className="space-y-1">
                {section.items.map((item, idx) => (
                  <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      
      default:
        return (
          <div key={index} className="mt-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {section.content}
            </h4>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
          <FileText className="h-8 w-8 mr-3 text-blue-500" />
          Show Notes
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse and manage your podcast show notes
        </p>
      </div>

      <div className="space-y-4">
        {displayedNotes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No show notes found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Create your first show notes by adding markdown files to the shownotes folder
            </p>
          </div>
        ) : (
          displayedNotes.map((showNote) => (
            <div
              key={showNote.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700"
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
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      href={`/memos/${showNote.filename.replace('.md', '')}`}
                      className="p-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                      title="View full memo"
                    >
                      <Play className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => toggleExpanded(showNote.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {expandedNotes.has(showNote.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {expandedNotes.has(showNote.id) && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {showNote.sections.map((section, index) => renderSection(section, index))}
                    </div>
                  </div>
                )}
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
