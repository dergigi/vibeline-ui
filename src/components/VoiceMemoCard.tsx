"use client";

import React from 'react';
import { VoiceMemo } from '@/types/VoiceMemo';
import { motion } from 'framer-motion';
import { PlayIcon, PauseIcon, ChevronDownIcon, ChevronUpIcon, ArrowPathIcon, CheckIcon, ShareIcon, SparklesIcon, ClipboardDocumentCheckIcon, PencilSquareIcon, TrashIcon, ForwardIcon, BackwardIcon } from '@heroicons/react/24/solid';
import { useState, useRef, useCallback } from 'react'; // Import useCallback
import { useSearch } from '@/contexts/SearchContext';
import { DraftEditor } from './DraftEditor';
import Link from 'next/link';

interface VoiceMemoCardProps {
  memo: VoiceMemo;
}

export const VoiceMemoCard: React.FC<VoiceMemoCardProps> = ({ memo }) => {
  const { setSearchTerm } = useSearch();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isTodosExpanded, setIsTodosExpanded] = useState(false);
  const [isPromptsExpanded, setIsPromptsExpanded] = useState(false);
  const [isDraftsExpanded, setIsDraftsExpanded] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [isTodosCopied, setIsTodosCopied] = useState(false);
  const [isPromptsCopied, setIsPromptsCopied] = useState(false);
  const [showDraftEditor, setShowDraftEditor] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSummaryRefreshing, setIsSummaryRefreshing] = useState(false);
  const [isTodosRefreshing, setIsTodosRefreshing] = useState(false);
  const [countdown, setCountdown] = useState<{ [key: string]: number }>({});
  const [isDeleting, setIsDeleting] = useState<{ [key: string]: boolean }>({});
  const deleteIntervals = useRef<{ [key: string]: NodeJS.Timeout | null }>({});
  const audioRef = useRef<HTMLAudioElement>(null);
  // Add state to manage optimistic UI updates for todos
  const [optimisticTodos, setOptimisticTodos] = useState<string | null>(null);

  const SPEED_OPTIONS = [1, 1.5, 2, 3];

  const hasTodos = memo.todos?.trim().length > 0;
  const hasPrompts = memo.prompts?.trim().length > 0;
  const hasDrafts = memo.drafts?.trim().length > 0;

  const cleanTodos = (todos: string): { lines: string[], originalIndices: number[] } => {
    if (!todos) return { lines: [], originalIndices: [] };
    const allLines = todos.split('\n');
    const result = allLines.reduce((acc, line, index) => {
      const trimmed = line.trim();
      if (trimmed.length > 0 && !trimmed.startsWith('#')) {
        acc.lines.push(line);
        acc.originalIndices.push(index);
      }
      return acc;
    }, { lines: [] as string[], originalIndices: [] as number[] });
    return result;
  };

  const countTodos = (todos: string): number => {
    return cleanTodos(todos).lines.length;
  };

  const togglePlayPause = (): void => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const togglePlaybackSpeed = (): void => {
    if (audioRef.current) {
      const currentIndex = SPEED_OPTIONS.indexOf(playbackSpeed);
      const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
      const newSpeed = SPEED_OPTIONS[nextIndex];
      audioRef.current.playbackRate = newSpeed;
      setPlaybackSpeed(newSpeed);
    }
  };

  const skipForward = (): void => {
    if (audioRef.current && !isNaN(audioRef.current.duration) && audioRef.current.readyState >= 2) {
      const currentTime = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      const newTime = Math.min(currentTime + 30, duration);
      console.log('Skip forward:', { currentTime, duration, newTime });
      
      // Use a more reliable approach for seeking
      try {
        audioRef.current.currentTime = newTime;
        // Force a small delay to ensure the seek operation completes
        setTimeout(() => {
          if (audioRef.current && Math.abs(audioRef.current.currentTime - newTime) > 1) {
            console.log('Seek failed, retrying...', { expected: newTime, actual: audioRef.current.currentTime });
            audioRef.current.currentTime = newTime;
          }
        }, 100);
      } catch (error) {
        console.error('Error seeking forward:', error);
      }
    } else {
      console.log('Skip forward: Audio not ready', { 
        audioRef: !!audioRef.current, 
        duration: audioRef.current?.duration,
        readyState: audioRef.current?.readyState 
      });
    }
  };

  const skipBackward = (): void => {
    if (audioRef.current && !isNaN(audioRef.current.duration) && audioRef.current.readyState >= 2) {
      const currentTime = audioRef.current.currentTime;
      const newTime = Math.max(currentTime - 10, 0);
      console.log('Skip backward:', { currentTime, newTime });
      
      // Use a more reliable approach for seeking
      try {
        audioRef.current.currentTime = newTime;
        // Force a small delay to ensure the seek operation completes
        setTimeout(() => {
          if (audioRef.current && Math.abs(audioRef.current.currentTime - newTime) > 1) {
            console.log('Seek failed, retrying...', { expected: newTime, actual: audioRef.current.currentTime });
            audioRef.current.currentTime = newTime;
          }
        }, 100);
      } catch (error) {
        console.error('Error seeking backward:', error);
      }
    } else {
      console.log('Skip backward: Audio not ready', { 
        audioRef: !!audioRef.current, 
        duration: audioRef.current?.duration,
        readyState: audioRef.current?.readyState 
      });
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);
    
    return parts.join(' ');
  };

  const handleLoadedMetadata = (): void => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTimeAgo = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    
    // If years are different, return the formatted date with year
    if (dateObj.getFullYear() !== now.getFullYear()) {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(dateObj);
    }

    // For same year, check if it's today/yesterday
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const compareDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const diffInDays = Math.floor((today.getTime() - compareDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(dateObj);
  };

  const formatShortDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(dateObj);
  };

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).length;
  };

  const getLastParagraph = (text: string): string => {
    const paragraphs = text.trim().split(/\n\s*\n/);
    return paragraphs[paragraphs.length - 1];
  };

  const extractHashtags = (text: string): string[] => {
    // Common words to filter out
    const stopWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
      'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one',
      'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
      'should', 'could', 'was', 'were', 'is', 'am', 'are', 'been', 'being', 'had', 'has', 'did', 'doing', 'does'
    ]);

    // Split into words, convert to lowercase, remove punctuation
    const words = text.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3) // Only words longer than 3 characters
      .filter(word => !stopWords.has(word)); // Remove stop words

    // Count word frequency
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    // Sort by frequency and get top 3
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);
  };

  const handleCopyTodos = async (): Promise<void> => {
    if (memo.todos) {
      try {
        await navigator.clipboard.writeText(memo.todos);
        setIsTodosCopied(true);
        setTimeout(() => setIsTodosCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    }
  };

  const handleCopyPrompts = async (): Promise<void> => {
    if (memo.prompts) {
      try {
        await navigator.clipboard.writeText(memo.prompts);
        setIsPromptsCopied(true);
        setTimeout(() => setIsPromptsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    }
  };

  const handleHashtagClick = (tag: string): void => {
    setSearchTerm(tag);
  };
  
  // Function to handle toggling a todo item
  const handleTodoToggle = useCallback(async (lineNumber: number, currentChecked: boolean) => {
    // Get the relative path by taking the last two parts (TODOs/filename.md)
    const pathParts = memo.path.split('/');
    const filePath = pathParts.slice(-2).join('/');
    const newChecked = !currentChecked;
  
    // Optimistic UI update
    const lines = (optimisticTodos ?? memo.todos ?? '').split('\n');
    if (lineNumber >= 0 && lineNumber < lines.length) {
      const line = lines[lineNumber];
      const match = line.match(/^(\s*-\s*\[)[ x](\]\s*.*)/);
      if (match) {
        lines[lineNumber] = `${match[1]}${newChecked ? 'x' : ' '}${match[2]}`;
        setOptimisticTodos(lines.join('\n'));
      }
    }
  
    try {
      const response = await fetch('/api/todos/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          filePath, 
          lineNumber, 
          completed: newChecked 
        }),
      });
  
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to toggle todo:', error);
      setOptimisticTodos(null);
    }
  }, [memo.path, memo.todos, optimisticTodos]);
  
  const handleShare = async (): Promise<void> => {
    try {
      const response = await fetch('/api/open-in-finder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: memo.filename }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to open file in Finder');
      }
    } catch (error) {
      console.error('Error opening file in Finder:', error);
    }
  };

  const handleDeletePluginFiles = async (plugin: string): Promise<void> => {
    if (!memo.filename) return;
    
    // Set the appropriate loading state
    switch (plugin) {
      case 'transcripts':
        setIsRefreshing(true);
        break;
      case 'summaries':
        setIsSummaryRefreshing(true);
        break;
      case 'todos':
        setIsTodosRefreshing(true);
        break;
    }
    
    try {
      const response = await fetch('/api/plugins/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          filename: memo.filename,
          plugin
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete ${plugin} files`);
      }

      // Clear the appropriate field from the memo object
      switch (plugin) {
        case 'transcripts':
          memo.transcript = undefined;
          break;
        case 'summaries':
          memo.summary = undefined;
          break;
        case 'todos':
          memo.todos = undefined;
          break;
      }
      
      console.log(`${plugin} files deleted successfully`);
    } catch (error) {
      console.error(`Error deleting ${plugin} files:`, error);
    } finally {
      // Reset the appropriate loading state
      switch (plugin) {
        case 'transcripts':
          setIsRefreshing(false);
          break;
        case 'summaries':
          setIsSummaryRefreshing(false);
          break;
        case 'todos':
          setIsTodosRefreshing(false);
          break;
      }
      // Reset countdown and deleting states
      setCountdown(prev => ({ ...prev, [plugin]: 0 }));
      setIsDeleting(prev => ({ ...prev, [plugin]: false }));
    }
  };

  const startDeleteCountdown = (plugin: string): void => {
    // Clear any existing interval for this plugin
    if (deleteIntervals.current[plugin]) {
      clearInterval(deleteIntervals.current[plugin]);
    }

    setCountdown(prev => ({ ...prev, [plugin]: 5 }));
    setIsDeleting(prev => ({ ...prev, [plugin]: true }));
    
    const interval = setInterval(() => {
      setCountdown(prev => {
        const newCount = prev[plugin] - 1;
        if (newCount <= 0) {
          clearInterval(interval);
          handleDeletePluginFiles(plugin);
          return { ...prev, [plugin]: 0 };
        }
        return { ...prev, [plugin]: newCount };
      });
    }, 1000);

    // Store the interval ID
    deleteIntervals.current[plugin] = interval;
  };

  const cancelDelete = (plugin: string): void => {
    // Clear the interval
    if (deleteIntervals.current[plugin]) {
      clearInterval(deleteIntervals.current[plugin]);
      deleteIntervals.current[plugin] = null;
    }
    
    setCountdown(prev => ({ ...prev, [plugin]: 0 }));
    setIsDeleting(prev => ({ ...prev, [plugin]: false }));
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Link
              href={`/memos/${memo.filename}`}
              className="block hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {formatTimeAgo(memo.createdAt)}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatShortDate(memo.createdAt)}
                {duration && ` · ${formatDuration(duration)}`}
                {memo.transcript && ` · ${countWords(memo.transcript)} words`}
              </p>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={togglePlaybackSpeed}
              className={`px-1.5 py-0.5 rounded-md transition-colors text-[10px] ${
                playbackSpeed > 1
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
              title="Click to change playback speed"
            >
              {playbackSpeed}x
            </button>
            <button
              onClick={skipBackward}
              className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              title="Skip backward 10 seconds"
            >
              <BackwardIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={togglePlayPause}
              className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors duration-200"
            >
              {isPlaying ? (
                <PauseIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <PlayIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              )}
            </button>
            <button
              onClick={skipForward}
              className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              title="Skip forward 30 seconds"
            >
              <ForwardIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {memo.transcript && (
            <div>
              <div 
                className="flex items-center justify-between mb-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
              >
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Transcript
                  </h4>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isDeleting['transcripts']) {
                        cancelDelete('transcripts');
                      } else {
                        startDeleteCountdown('transcripts');
                      }
                    }}
                    className={`p-1 transition-colors flex items-center gap-1 ${
                      isDeleting['transcripts'] 
                        ? 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300' 
                        : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                    }`}
                    disabled={isRefreshing}
                  >
                    {isDeleting['transcripts'] ? (
                      <>
                        <TrashIcon className="w-3 h-3" />
                        <span className="text-xs">{countdown['transcripts']}s</span>
                      </>
                    ) : (
                      <ArrowPathIcon className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  {isTranscriptExpanded ? (
                    <ChevronUpIcon className="w-4 h-4" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4" />
                  )}
                </div>
              </div>
              <p className={`text-sm text-gray-600 dark:text-gray-400 text-left ${isTranscriptExpanded ? '' : 'line-clamp-5'}`}>
                {memo.transcript}
              </p>
            </div>
          )}

          {memo.summary && (
            <div>
              <div 
                className="flex items-center justify-between mb-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
              >
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Summary
                  </h4>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isDeleting['summaries']) {
                        cancelDelete('summaries');
                      } else {
                        startDeleteCountdown('summaries');
                      }
                    }}
                    className={`p-1 transition-colors flex items-center gap-1 ${
                      isDeleting['summaries'] 
                        ? 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300' 
                        : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                    }`}
                    disabled={isSummaryRefreshing}
                  >
                    {isDeleting['summaries'] ? (
                      <>
                        <TrashIcon className="w-3 h-3" />
                        <span className="text-xs">{countdown['summaries']}s</span>
                      </>
                    ) : (
                      <ArrowPathIcon className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  {isSummaryExpanded ? (
                    <ChevronUpIcon className="w-4 h-4" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4" />
                  )}
                </div>
              </div>
              <p className={`text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line text-left`}>
                {isSummaryExpanded ? memo.summary.trim() : getLastParagraph(memo.summary)}
              </p>
            </div>
          )}

          <audio
            ref={audioRef}
            src={memo.audioUrl}
            onEnded={() => setIsPlaying(false)}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={() => {
              if (audioRef.current) {
                console.log('Audio time update:', audioRef.current.currentTime);
              }
            }}
            className="hidden"
          />

          <div className="flex flex-col gap-4 mt-4 pt-4">
            {hasTodos && (
              <div>
                <div 
                  className="flex items-center justify-between mb-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                  onClick={() => setIsTodosExpanded(!isTodosExpanded)}
                >
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      TODOs ({memo.todos ? countTodos(memo.todos) : 0})
                    </h4>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isDeleting['todos']) {
                          cancelDelete('todos');
                        } else {
                          startDeleteCountdown('todos');
                        }
                      }}
                      className={`p-1 transition-colors flex items-center gap-1 ${
                        isDeleting['todos'] 
                          ? 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300' 
                          : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                      }`}
                      disabled={isTodosRefreshing}
                    >
                      {isDeleting['todos'] ? (
                        <>
                          <TrashIcon className="w-3 h-3" />
                          <span className="text-xs">{countdown['todos']}s</span>
                        </>
                      ) : (
                        <ArrowPathIcon className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="text-gray-500 dark:text-gray-400">
                      {isTodosExpanded ? (
                        <ChevronUpIcon className="w-4 h-4" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyTodos();
                      }}
                      className="text-xs px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1 min-w-[80px] justify-center"
                    >
                      {isTodosCopied ? (
                        <>
                          <CheckIcon className="w-3 h-3" />
                          <span>copied!</span>
                        </>
                      ) : (
                        <>
                          <ClipboardDocumentCheckIcon className="w-3 h-3" />
                          <span>copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                {isTodosExpanded && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mt-2 pl-1">
                    {(() => {
                      const { lines, originalIndices } = cleanTodos(optimisticTodos ?? memo.todos ?? '');
                      return lines.map((line, displayIndex) => {
                        const originalIndex = originalIndices[displayIndex];
                        // Match markdown checkbox format: "- [ ] text" or "- [x] text" (allowing for whitespace variations)
                        const match = line.match(/^(\s*-\s*\[\s*)([ x])(\s*\]\s*)(.*)/);
                        if (match) {
                          const indent = match[1].match(/^\s*/)?.[0] || '';
                          const isChecked = match[2] === 'x';
                          const text = match[4];
                          return (
                            <div key={displayIndex} className="flex items-center gap-2" style={{ paddingLeft: `${indent.length * 0.5}em` }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTodoToggle(originalIndex, isChecked)}
                                className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-indigo-500 focus:ring-offset-0 dark:focus:ring-offset-gray-800 cursor-pointer"
                              />
                              <label className={`flex-1 ${isChecked ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'} cursor-pointer`} onClick={() => handleTodoToggle(originalIndex, isChecked)}>
                                {text || <span className="italic text-gray-400 dark:text-gray-600">(empty)</span>}
                              </label>
                            </div>
                          );
                        }
                        const indentMatch = line.match(/^\s*/);
                        const indent = indentMatch ? indentMatch[0] : '';
                        return <div key={displayIndex} style={{ paddingLeft: `${indent.length * 0.5}em` }}>{line.trim() || <br />}</div>;
                      });
                    })()}
                  </div>
                )}
                </div>
            )}

            {hasPrompts && (
              <div>
                <div 
                  className="flex items-center justify-between mb-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                  onClick={() => setIsPromptsExpanded(!isPromptsExpanded)}
                >
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Prompt
                  </h4>
                  <div className="flex items-center gap-1">
                    <div className="text-gray-500 dark:text-gray-400">
                      {isPromptsExpanded ? (
                        <ChevronUpIcon className="w-4 h-4" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyPrompts();
                      }}
                      className="text-xs px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1 min-w-[80px] justify-center"
                    >
                      {isPromptsCopied ? (
                        <>
                          <CheckIcon className="w-3 h-3" />
                          <span>copied!</span>
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="w-3 h-3" />
                          <span>copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                {isPromptsExpanded && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line text-left">
                    {memo.prompts.trim()}
                  </p>
                )}
              </div>
            )}

            {hasDrafts && (
              <div>
                <div 
                  className="flex items-center justify-between mb-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                  onClick={() => setIsDraftsExpanded(!isDraftsExpanded)}
                >
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Draft
                  </h4>
                  <div className="flex items-center gap-1">
                    <div className="text-gray-500 dark:text-gray-400">
                      {isDraftsExpanded ? (
                        <ChevronUpIcon className="w-4 h-4" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDraftEditor(true);
                      }}
                      className="text-xs px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1 min-w-[80px] justify-center"
                    >
                      <PencilSquareIcon className="w-3 h-3" />
                      <span>edit</span>
                    </button>
                  </div>
                </div>
                {isDraftsExpanded && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line text-left">
                    {memo.drafts.trim()}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-between items-end">
              <div className="flex items-center gap-2">
                {memo.transcript && (
                  <div className="flex gap-1.5 flex-wrap">
                    {extractHashtags(memo.transcript).map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleHashtagClick(tag)}
                        className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleShare}
                  className="text-xs px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1 min-w-[80px] justify-center"
                >
                  <ShareIcon className="w-3 h-3" />
                  <span>share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      {showDraftEditor && (
        <DraftEditor
          initialContent={memo.drafts || ''}
          onClose={() => setShowDraftEditor(false)}
        />
      )}
    </>
  );
} 